import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'

// ── Meet the Locals ────────────────────────────────────────────────────────
// Request the user sends, and the shape we require back from Gemini.

export const localsRequestSchema = z.object({
  city: z.string().trim().min(2, 'Tell us which city you are visiting.').max(60),
})
export type LocalsRequest = z.infer<typeof localsRequestSchema>

export const localPhraseSchema = z.object({
  local: z.string(),
  translit: z.string(),
  english: z.string(),
})
export type LocalPhrase = z.infer<typeof localPhraseSchema>

export const localPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  trade: z.string(),
  emoji: z.string(),
  greeting: z.string(),
  story: z.string(),
  phrase: localPhraseSchema,
})
export type LocalPersona = z.infer<typeof localPersonaSchema>

export const localsResponseSchema = z.object({
  city: z.string(),
  locals: z.array(localPersonaSchema).min(2).max(4),
})
export type LocalsResponse = z.infer<typeof localsResponseSchema>

// Gemini responseSchema, typed with the SDK's SchemaType enum so it needs no
// cast at the call site. Kept in sync with `localsResponseSchema` above by the
// route's zod parse.
export const localsGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    city: { type: SchemaType.STRING },
    locals: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          age: { type: SchemaType.NUMBER },
          trade: { type: SchemaType.STRING },
          emoji: { type: SchemaType.STRING },
          greeting: { type: SchemaType.STRING },
          story: { type: SchemaType.STRING },
          phrase: {
            type: SchemaType.OBJECT,
            properties: {
              local: { type: SchemaType.STRING },
              translit: { type: SchemaType.STRING },
              english: { type: SchemaType.STRING },
            },
            required: ['local', 'translit', 'english'],
          },
        },
        required: ['id', 'name', 'age', 'trade', 'emoji', 'greeting', 'story', 'phrase'],
      },
    },
  },
  required: ['city', 'locals'],
}

// Prompt builder lives with the feature so it can be unit-tested without
// touching the network.
export function buildLocalsPrompt({ city }: LocalsRequest): string {
  return [
    'You are Ghummakad, a well-travelled Indian storyteller who introduces',
    `visitors to the soul of a city through its people. Create 3 fictional but`,
    `culturally authentic local characters of the real city of ${city}.`,
    '',
    'Vary the cast to suit the city — for example an elder artisan keeping a',
    'traditional craft alive, a market woman who knows every lane, a young guide',
    'or student who bridges old and new. Give each:',
    '- a short unique id (slug), a believable local name, an age, and a trade',
    '- a single emoji that works as their avatar',
    '- a warm one-line greeting (it may mix in the local language)',
    '- a first-person heritage story of roughly 120-180 words: vivid, personal,',
    '  rooted in that character\'s daily life, mentioning real neighbourhoods,',
    '  landmarks, foods and traditions of the city',
    '- one genuinely useful phrase in the city\'s real local language, with its',
    '  script in `local`, a transliteration in `translit`, and the English',
    '  meaning in `english`',
    '',
    'Ground everything in genuine cultural detail. Never claim these characters',
    'are real people, never invent places, landmarks or traditions that do not',
    'exist, and never use a language not actually spoken in the city.',
    '',
    `City: "${city}"`,
  ].join('\n')
}
