import { z } from 'zod'
import { TtlCache } from '@/lib/ttl-cache'
import { serverEnv } from '@/lib/env'

// ── Accented speech via Gemini native TTS ──────────────────────────────────
// gemini-2.5-flash-preview-tts returns raw 24kHz mono s16le PCM; we wrap it in
// a WAV header so the browser can play it directly. The style instruction gives
// warm, naturally accented delivery instead of a robotic screen-reader voice.

const TTS_MODEL = 'gemini-2.5-flash-preview-tts'
const SAMPLE_RATE = 24000

export const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(600),
  // 'story' = warm English with an Indian accent; 'phrase' = native-language line.
  kind: z.enum(['story', 'phrase']),
})
export type TtsRequest = z.infer<typeof ttsRequestSchema>

// Audio is ~50-100KB per short clip; keep the cache small but useful.
export const ttsCache = new TtlCache<Buffer>(6 * 60 * 60 * 1000, 60)

export function buildSpeechText({ text, kind }: TtsRequest): string {
  if (kind === 'phrase') {
    return `Say this exactly once, slowly and clearly, as a warm native speaker teaching a traveller: ${text}`
  }
  return `Read this warmly, like an elderly Indian storyteller speaking English with a gentle Indian accent, unhurried: ${text}`
}

/** Wrap raw s16le PCM in a RIFF/WAV header so browsers can play it. */
export function pcmToWav(pcm: Buffer, sampleRate = SAMPLE_RATE): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // PCM chunk size
  header.writeUInt16LE(1, 20) // PCM format
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28) // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

export async function synthesizeSpeech(req: TtsRequest): Promise<Buffer> {
  const key = `${req.kind}:${req.text.trim().toLowerCase()}`
  const cached = ttsCache.get(key)
  if (cached) return cached

  const { geminiKey } = serverEnv()
  if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured on the server.')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSpeechText(req) }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } },
          },
        },
      }),
    },
  )
  if (!res.ok) throw new Error(`TTS request failed (${res.status}).`)

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string } }> }
    }>
  }
  const b64 = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData
    ?.data
  if (!b64) throw new Error('TTS returned no audio.')

  const wav = pcmToWav(Buffer.from(b64, 'base64'))
  ttsCache.set(key, wav)
  return wav
}
