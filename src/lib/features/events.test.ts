import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  eventsRequestSchema,
  eventsResponseSchema,
  eventSchema,
  buildEventsPrompt,
  parseEventsText,
  fetchEvents,
} from './events'

const event = {
  name: 'Kala Ghoda Nights',
  when: 'Sat 11 Jul, 7 pm',
  venue: 'Kala Ghoda, Fort',
  blurb: 'Street art, live music and food stalls across south Mumbai.',
}

describe('eventsRequestSchema', () => {
  it('accepts a reasonable city', () => {
    const r = eventsRequestSchema.safeParse({ city: 'Jaipur' })
    expect(r.success).toBe(true)
  })

  it('rejects an empty / too-short city', () => {
    expect(eventsRequestSchema.safeParse({ city: '' }).success).toBe(false)
    expect(eventsRequestSchema.safeParse({ city: 'a' }).success).toBe(false)
  })

  it('rejects an over-long city', () => {
    const r = eventsRequestSchema.safeParse({ city: 'x'.repeat(61) })
    expect(r.success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const r = eventsRequestSchema.parse({ city: '  Pune  ' })
    expect(r.city).toBe('Pune')
  })
})

describe('eventsResponseSchema', () => {
  it('accepts a valid array of events', () => {
    expect(eventsResponseSchema.safeParse([event, event]).success).toBe(true)
  })

  it('accepts an empty array (nothing verifiable found)', () => {
    expect(eventsResponseSchema.safeParse([]).success).toBe(true)
  })

  it('rejects more than 6 events', () => {
    const many = Array.from({ length: 7 }, () => event)
    expect(eventsResponseSchema.safeParse(many).success).toBe(false)
  })

  it('rejects an event missing venue', () => {
    const { venue, ...partial } = event
    expect(eventSchema.safeParse(partial).success).toBe(false)
    expect(eventsResponseSchema.safeParse([partial]).success).toBe(false)
  })
})

describe('buildEventsPrompt', () => {
  it('embeds the city and the date', () => {
    const prompt = buildEventsPrompt('Kochi', '2026-07-04')
    expect(prompt).toContain('Kochi')
    expect(prompt).toContain('2026-07-04')
  })

  it('demands a JSON-only reply', () => {
    expect(buildEventsPrompt('Kochi', '2026-07-04')).toContain('ONLY')
  })
})

describe('parseEventsText', () => {
  it('parses a plain JSON array', () => {
    const parsed = parseEventsText(JSON.stringify([event]))
    expect(parsed).toEqual([event])
  })

  it('strips ```json fences before parsing', () => {
    const fenced = '```json\n' + JSON.stringify([event]) + '\n```'
    const parsed = parseEventsText(fenced)
    expect(parsed).toEqual([event])
  })

  it('returns null on garbage text', () => {
    expect(parseEventsText('sorry, I could not find anything')).toBeNull()
  })

  it('returns null on valid JSON of the wrong shape', () => {
    expect(parseEventsText('{"events": []}')).toBeNull()
    expect(parseEventsText(JSON.stringify([{ name: 'x' }]))).toBeNull()
  })
})

describe('fetchEvents', () => {
  const originalKey = process.env.GEMINI_API_KEY

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = originalKey
  })

  it('calls the grounded REST endpoint and returns validated events', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify([event]) }] } }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchEvents('Test City ' + Date.now())
    expect(result).toEqual({ events: [event] })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toContain('gemini-2.5-flash:generateContent')
    const requestBody = JSON.parse(init.body)
    expect(requestBody.tools).toEqual([{ google_search: {} }])
    expect(requestBody.contents[0].parts[0].text).toContain('ONLY')
  })
})
