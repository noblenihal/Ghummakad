import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'
import { generateJson } from '@/lib/gemini'
import { TtlCache } from '@/lib/ttl-cache'

// ── Day Weaver: weather-aware itinerary ────────────────────────────────────

// Live weather from Open-Meteo (keyless). Every field is null if the lookup
// fails — the itinerary still works without weather, it just cannot adapt.
export interface WeatherSummary {
  tempC: number | null
  precipProbPct: number | null
  sunrise: string | null
  sunset: string | null
}

const NO_WEATHER: WeatherSummary = {
  tempC: null,
  precipProbPct: null,
  sunrise: null,
  sunset: null,
}

/** "2026-07-04T19:12" → "19:12"; anything unparseable stays null. */
function clockTime(iso: unknown): string | null {
  if (typeof iso !== 'string') return null
  const time = iso.split('T')[1]
  return time ? time.slice(0, 5) : null
}

const asNumber = (v: unknown): number | null => (typeof v === 'number' ? v : null)

export async function getWeather(city: string): Promise<WeatherSummary> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
    )
    if (!geoRes.ok) return NO_WEATHER
    const geo = await geoRes.json()
    const place = geo?.results?.[0]
    if (typeof place?.latitude !== 'number' || typeof place?.longitude !== 'number') {
      return NO_WEATHER
    }

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        '&current=temperature_2m,weather_code' +
        '&daily=sunrise,sunset,precipitation_probability_max' +
        '&timezone=auto&forecast_days=1',
    )
    if (!forecastRes.ok) return NO_WEATHER
    const forecast = await forecastRes.json()

    return {
      tempC: asNumber(forecast?.current?.temperature_2m),
      precipProbPct: asNumber(forecast?.daily?.precipitation_probability_max?.[0]),
      sunrise: clockTime(forecast?.daily?.sunrise?.[0]),
      sunset: clockTime(forecast?.daily?.sunset?.[0]),
    }
  } catch {
    return NO_WEATHER
  }
}

// Request the user sends, and the shape we require back from Gemini.

export const chosenExperienceSchema = z.object({
  name: z.string(),
  bestTime: z.string(),
  indoor: z.boolean(),
})
export type ChosenExperience = z.infer<typeof chosenExperienceSchema>

export const itineraryRequestSchema = z.object({
  city: z.string().trim().min(2, 'Tell us which city you are visiting.').max(60),
  chosen: z
    .array(chosenExperienceSchema)
    .min(1, 'Pick at least one experience to weave.')
    .max(6),
})
export type ItineraryRequest = z.infer<typeof itineraryRequestSchema>

export const itineraryStopSchema = z.object({
  name: z.string(),
  when: z.string(),
  why: z.string(),
  tip: z.string(),
})
export type ItineraryStop = z.infer<typeof itineraryStopSchema>

export const itineraryResponseSchema = z.object({
  title: z.string(),
  intro: z.string(),
  stops: z.array(itineraryStopSchema).min(1).max(8),
  outro: z.string(),
})
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>

// Gemini responseSchema, typed with the SDK's SchemaType enum so it needs no
// cast at the call site. Kept in sync with `itineraryResponseSchema` above by
// the zod parse in `fetchDayPlan`.
export const itineraryGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    intro: { type: SchemaType.STRING },
    stops: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          when: { type: SchemaType.STRING },
          why: { type: SchemaType.STRING },
          tip: { type: SchemaType.STRING },
        },
        required: ['name', 'when', 'why', 'tip'],
      },
    },
    outro: { type: SchemaType.STRING },
  },
  required: ['title', 'intro', 'stops', 'outro'],
}

// Prompt builder lives with the feature so it can be unit-tested without
// touching the network.
export function buildItineraryPrompt(
  city: string,
  chosen: ChosenExperience[],
  weather: WeatherSummary,
): string {
  const picks = chosen
    .map(
      (c) =>
        `- ${c.name} (best at ${c.bestTime}, ${c.indoor ? 'indoor' : 'outdoor'})`,
    )
    .join('\n')

  const weatherLines: string[] = []
  if (weather.tempC !== null) {
    weatherLines.push(`- current temperature: ${weather.tempC}°C`)
  }
  if (weather.precipProbPct !== null) {
    weatherLines.push(`- chance of rain today: ${weather.precipProbPct}%`)
  }
  if (weather.sunrise !== null) weatherLines.push(`- sunrise at ${weather.sunrise}`)
  if (weather.sunset !== null) weatherLines.push(`- sunset at ${weather.sunset}`)

  return [
    'You are Ghummakad, a well-travelled Indian storyteller planning one',
    `perfect day in the real city of ${city} for a friend.`,
    '',
    'Weave ONLY these chosen experiences into one flowing day — do not add,',
    'drop or rename any of them:',
    picks,
    '',
    weatherLines.length > 0
      ? ['Adapt the day to the real weather:', ...weatherLines].join('\n')
      : 'No live weather is available — plan by the natural rhythm of the day.',
    '',
    'Order the stops by the natural time of day each experience shines. If the',
    'chance of rain is high, put indoor experiences first and keep outdoor ones',
    'flexible. If it is very hot, schedule outdoor stops around sunrise and',
    'sunset — use the real sunrise and sunset times above when given.',
    '',
    'Give the day a short evocative title and a two-sentence intro. For each',
    'stop give `when` (a time of day, e.g. "6:00 am, just before sunrise"),',
    '`why` (why this moment, woven into the story of the day) and `tip` (one',
    'genuinely useful insider tip). Close with a warm one-or-two-sentence',
    'outro. Warm narrative tone, plain text only, no markdown. Never invent',
    'places or details that do not exist.',
  ].join('\n')
}

/** Thrown when Gemini returns JSON that drifts from the required shape. */
export class ItineraryShapeError extends Error {
  constructor() {
    super('The guide gave an unexpected answer. Try weaving again.')
    this.name = 'ItineraryShapeError'
  }
}

export interface DayPlanResult {
  plan: ItineraryResponse
  weather: WeatherSummary
}

// Identical city + picks within the TTL reuse the last genuine result instead
// of paying for another model call. Cached values are real model output —
// nothing is hardcoded or faked.
const CACHE_TTL_MS = 30 * 60 * 1000
const itineraryCache = new TtlCache<DayPlanResult>(CACHE_TTL_MS)

const normalizeCity = (city: string) => city.trim().toLowerCase().replace(/\s+/g, ' ')

const cacheKey = (req: ItineraryRequest) =>
  `${normalizeCity(req.city)}|${req.chosen
    .map((c) => c.name.trim().toLowerCase())
    .sort()
    .join('|')}`

export async function fetchDayPlan(req: ItineraryRequest): Promise<DayPlanResult> {
  const key = cacheKey(req)
  const cached = itineraryCache.get(key)
  if (cached) return cached

  const weather = await getWeather(req.city)
  const raw = await generateJson(
    buildItineraryPrompt(req.city, req.chosen, weather),
    itineraryGeminiSchema,
  )
  const parsed = itineraryResponseSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) throw new ItineraryShapeError()

  const result: DayPlanResult = { plan: parsed.data, weather }
  itineraryCache.set(key, result)
  return result
}
