import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'
import { serverEnv } from '../env'

// ── Photo Lens ─────────────────────────────────────────────────────────────
// The user uploads a photo of a monument/place; Gemini Vision identifies it
// and tells its story. Every response is a live model call — no caching, no
// canned data (each upload is unique).

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const
export const MAX_BYTES = 6 * 1024 * 1024

export const lensNearbyGemSchema = z.object({
  name: z.string(),
  why: z.string(),
})
export type LensNearbyGem = z.infer<typeof lensNearbyGemSchema>

export const lensResponseSchema = z.object({
  identified: z.boolean(),
  name: z.string(),
  location: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  story: z.string(),
  funFact: z.string(),
  bestTimeToVisit: z.string(),
  nearbyGem: lensNearbyGemSchema,
})
export type LensResponse = z.infer<typeof lensResponseSchema>

// Gemini responseSchema, typed with the SDK's SchemaType enum. Kept in sync
// with `lensResponseSchema` above by the zod parse in `analyzePhoto`.
export const lensGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    identified: { type: SchemaType.BOOLEAN },
    name: { type: SchemaType.STRING },
    location: { type: SchemaType.STRING },
    confidence: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['high', 'medium', 'low'],
    },
    story: { type: SchemaType.STRING },
    funFact: { type: SchemaType.STRING },
    bestTimeToVisit: { type: SchemaType.STRING },
    nearbyGem: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        why: { type: SchemaType.STRING },
      },
      required: ['name', 'why'],
    },
  },
  required: [
    'identified',
    'name',
    'location',
    'confidence',
    'story',
    'funFact',
    'bestTimeToVisit',
    'nearbyGem',
  ],
}

// Prompt builder lives with the feature so it can be unit-tested without
// touching the network.
export function buildLensPrompt(): string {
  return [
    'You are Ghummakad, a well-travelled Indian storyteller with a keen eye for',
    'monuments, temples, forts, markets and landscapes. Look carefully at the',
    'attached photo and identify the landmark or place it shows.',
    '',
    'If you can identify it with reasonable certainty:',
    '- set `identified` to true, give its proper `name` and its `location`',
    '  (city/region, country)',
    '- set `confidence` to "high", "medium" or "low" so it honestly reflects how',
    '  certain you are of the identification',
    '- write `story` as 150-220 words weaving together its history, a legend or',
    '  piece of folklore attached to it, and its cultural significance — vivid,',
    '  in the second person, as if walking beside the traveller',
    '- give one surprising `funFact`, a practical `bestTimeToVisit` line, and a',
    '  `nearbyGem`: a real lesser-known spot nearby worth skipping the crowd',
    '  for, with `name` and `why` it is worth it',
    '',
    'If you cannot confidently identify the specific place: set `identified` to',
    'false, leave `name` and `location` as empty strings, set `confidence` to',
    '"low", and still use `story` to describe what kind of place it appears to',
    'be — its architectural style, era, region and atmosphere — so the traveller',
    'learns something real. Fill the other fields with honest general guidance',
    'for that kind of place.',
    '',
    'NEVER invent a specific identification you are not reasonably sure of, and',
    'never fabricate history, legends or places that do not exist. An honest',
    '"I am not sure" beats a confident wrong answer.',
  ].join('\n')
}

/** Thrown when the model's output does not match the expected JSON shape. */
export class LensShapeError extends Error {
  constructor(message = 'The lens gave an unexpected answer. Try another photo.') {
    super(message)
    this.name = 'LensShapeError'
  }
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Identify the place in a photo and return its story. Calls the Gemini REST
 * API directly: the installed SDK version handles inline image data combined
 * with a responseSchema awkwardly, so we build the request ourselves and keep
 * `serverEnv()` as the single source of the key.
 */
export async function analyzePhoto(imageBase64: string, mimeType: string): Promise<LensResponse> {
  const { geminiKey } = serverEnv()
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.')
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: buildLensPrompt() },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: lensGeminiSchema,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini request failed with status ${res.status}.`)
  }

  const payload: unknown = await res.json()

  let parsed: unknown
  try {
    const parts = (payload as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }).candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) throw new Error('No candidate parts.')
    const text = parts.map((p) => p.text ?? '').join('')
    parsed = JSON.parse(text)
  } catch {
    throw new LensShapeError()
  }

  const result = lensResponseSchema.safeParse(parsed)
  if (!result.success) {
    throw new LensShapeError()
  }
  return result.data
}
