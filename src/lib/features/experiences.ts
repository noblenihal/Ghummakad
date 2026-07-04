import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'
import { generateJson } from '@/lib/gemini'
import { TtlCache } from '@/lib/ttl-cache'

// ── Day Weaver: pickable experiences ───────────────────────────────────────
// Request the user sends, and the shape we require back from Gemini.

export const experiencesRequestSchema = z.object({
  city: z.string().trim().min(2, 'Tell us which city you are visiting.').max(60),
})
export type ExperiencesRequest = z.infer<typeof experiencesRequestSchema>

export const experienceSchema = z.object({
  id: z.string(),
  name: z.string(),
  hook: z.string(),
  bestTime: z.string(),
  indoor: z.boolean(),
  category: z.string(),
})
export type Experience = z.infer<typeof experienceSchema>

export const experiencesResponseSchema = z.object({
  city: z.string(),
  experiences: z.array(experienceSchema).min(5).max(6),
})
export type ExperiencesResponse = z.infer<typeof experiencesResponseSchema>

// Gemini responseSchema, typed with the SDK's SchemaType enum so it needs no
// cast at the call site. Kept in sync with `experiencesResponseSchema` above
// by the zod parse in `fetchExperiences`.
export const experiencesGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    city: { type: SchemaType.STRING },
    experiences: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          hook: { type: SchemaType.STRING },
          bestTime: { type: SchemaType.STRING },
          indoor: { type: SchemaType.BOOLEAN },
          category: { type: SchemaType.STRING },
        },
        required: ['id', 'name', 'hook', 'bestTime', 'indoor', 'category'],
      },
    },
  },
  required: ['city', 'experiences'],
}

// Prompt builder lives with the feature so it can be unit-tested without
// touching the network.
export function buildExperiencesPrompt(city: string): string {
  return [
    'You are Ghummakad, a well-travelled Indian storyteller who knows cities',
    `from the inside. List exactly 6 real, culturally authentic experiences or`,
    `places in the real city of ${city} — a mix of famous landmarks and`,
    'hidden gems only locals would send a friend to.',
    '',
    'For each experience give:',
    '- a short unique id (slug) and the real name of the place or experience',
    '- a `hook`: one vivid line that makes a traveller want to go right now',
    '- a `bestTime`: the natural time of day it shines (e.g. "sunrise",',
    '  "morning", "afternoon", "evening", "after dark")',
    '- `indoor`: true if it is mostly sheltered from the weather, false if it',
    '  is out in the open',
    '- a `category`: one word such as "heritage", "food", "craft", "nature"',
    '  or "market"',
    '',
    'Ground everything in genuine detail. Never invent places, experiences or',
    'traditions that do not exist — only name what is really there.',
    '',
    `City: "${city}"`,
  ].join('\n')
}

/** Thrown when Gemini returns JSON that drifts from the required shape. */
export class ExperiencesShapeError extends Error {
  constructor() {
    super('The guide gave an unexpected answer. Try another city.')
    this.name = 'ExperiencesShapeError'
  }
}

// Identical cities within the TTL reuse the last genuine Gemini result instead
// of paying for another model call. Cached values are real model output —
// nothing is hardcoded or faked.
const CACHE_TTL_MS = 30 * 60 * 1000
const experiencesCache = new TtlCache<ExperiencesResponse>(CACHE_TTL_MS)

const cacheKey = (city: string) => city.trim().toLowerCase().replace(/\s+/g, ' ')

export async function fetchExperiences(
  req: ExperiencesRequest,
): Promise<ExperiencesResponse> {
  const key = cacheKey(req.city)
  const cached = experiencesCache.get(key)
  if (cached) return cached

  const raw = await generateJson(buildExperiencesPrompt(req.city), experiencesGeminiSchema)
  const result = experiencesResponseSchema.safeParse(JSON.parse(raw))
  if (!result.success) throw new ExperiencesShapeError()
  experiencesCache.set(key, result.data)
  return result.data
}
