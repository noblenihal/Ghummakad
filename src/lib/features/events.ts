import { z } from 'zod'
import { serverEnv } from '../env'
import { TtlCache } from '../ttl-cache'

// ── Live Cultural Events ───────────────────────────────────────────────────
// Real events found via a Gemini call with Google Search grounding. Grounding
// is not supported through the @google/generative-ai SDK's generationConfig +
// responseSchema combo, so we call the REST API directly with fetch. Grounded
// responses cannot use a responseSchema either, so the prompt instructs the
// model to reply with ONLY a JSON array and we parse defensively.

export const eventsRequestSchema = z.object({
  city: z.string().trim().min(2, 'Tell us which city you are visiting.').max(60),
})
export type EventsRequest = z.infer<typeof eventsRequestSchema>

export const eventSchema = z.object({
  name: z.string(),
  when: z.string(),
  venue: z.string(),
  blurb: z.string(),
})
export type CulturalEvent = z.infer<typeof eventSchema>

export const eventsResponseSchema = z.array(eventSchema).max(6)
export type EventsResponse = z.infer<typeof eventsResponseSchema>

/** Thrown when the grounded model reply cannot be parsed into valid events. */
export class EventsParseError extends Error {
  constructor(message = 'Gemini returned events in an unexpected shape.') {
    super(message)
    this.name = 'EventsParseError'
  }
}

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// Events change slowly, so identical cities within 3h reuse the last genuine
// grounded result instead of paying for another search-backed model call.
// Cached values are real model output — nothing is hardcoded or faked.
const CACHE_TTL_MS = 3 * 60 * 60 * 1000
const eventsCache = new TtlCache<{ events: CulturalEvent[] }>(CACHE_TTL_MS)

const cacheKey = (city: string) => city.trim().toLowerCase().replace(/\s+/g, ' ')

// Prompt builder lives with the feature so it can be unit-tested without
// touching the network.
export function buildEventsPrompt(city: string, todayIso: string): string {
  return [
    'You are a diligent local culture researcher. Using live web search, find',
    `real cultural events, festivals, fairs, exhibitions and live music that are`,
    `actually happening in ${city} in the next 14 days from ${todayIso}.`,
    '',
    'Reply ONLY with a JSON array — no markdown fences, no commentary, no keys',
    'outside the array. Each element must be an object with exactly these',
    'string fields:',
    '- "name": the event name',
    '- "when": a human-readable date (e.g. "Sat 12 Jul, 7 pm")',
    '- "venue": where it takes place',
    '- "blurb": a one-line description',
    '',
    'Include at most 6 events, and only ones you can verify from search',
    'results. If nothing verifiable is found, reply with exactly [].',
  ].join('\n')
}

/**
 * Parse the model's text reply into validated events. Strips ```json fences
 * if the model added them despite instructions. Returns null when the text is
 * not valid JSON or does not match the events shape.
 */
export function parseEventsText(text: string): EventsResponse | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }
  const result = eventsResponseSchema.safeParse(parsed)
  return result.success ? result.data : null
}

type GeminiRestResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

/** Fetch real, search-grounded cultural events for a city. */
export async function fetchEvents(city: string): Promise<{ events: CulturalEvent[] }> {
  const key = cacheKey(city)
  const cached = eventsCache.get(key)
  if (cached) return cached

  const { geminiKey } = serverEnv()
  if (!geminiKey) {
    throw new Error('Gemini is not configured on the server.')
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildEventsPrompt(city, todayIso) }] }],
      tools: [{ google_search: {} }],
    }),
  })
  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}).`)
  }

  const json = (await res.json()) as GeminiRestResponse
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
  const events = parseEventsText(text)
  if (events === null) {
    throw new EventsParseError()
  }

  const result = { events }
  eventsCache.set(key, result)
  return result
}
