import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import { synthesizeSpeech, ttsRequestSchema } from '@/lib/features/tts'

// Natural, accented speech via Gemini's native TTS model. Auth-gated (it spends
// model quota); the client falls back to browser speechSynthesis on failure.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await verifyRequest(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = ttsRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const wav = await synthesizeSpeech(parsed.data)
    return new NextResponse(new Uint8Array(wav), {
      headers: {
        'Content-Type': 'audio/wav',
        // Same clip is immutable for a session; let the browser cache replays.
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Speech failed.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
