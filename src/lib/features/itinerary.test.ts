import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  itineraryRequestSchema,
  itineraryResponseSchema,
  buildItineraryPrompt,
  getWeather,
  type WeatherSummary,
} from './itinerary'

const chosen = [
  { name: 'Ambrai Ghat', bestTime: 'sunrise', indoor: false },
  { name: 'City Palace Museum', bestTime: 'afternoon', indoor: true },
]

describe('itineraryRequestSchema', () => {
  it('accepts a city with 1-6 chosen experiences', () => {
    expect(itineraryRequestSchema.safeParse({ city: 'Udaipur', chosen }).success).toBe(true)
    expect(
      itineraryRequestSchema.safeParse({ city: 'Udaipur', chosen: [chosen[0]] }).success,
    ).toBe(true)
  })

  it('rejects zero chosen experiences', () => {
    expect(itineraryRequestSchema.safeParse({ city: 'Udaipur', chosen: [] }).success).toBe(false)
  })

  it('rejects seven chosen experiences', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...chosen[0], name: `Stop ${i}` }))
    expect(itineraryRequestSchema.safeParse({ city: 'Udaipur', chosen: seven }).success).toBe(
      false,
    )
  })

  it('rejects a chosen experience missing a field', () => {
    const broken = [{ name: 'Ambrai Ghat', bestTime: 'sunrise' }]
    expect(itineraryRequestSchema.safeParse({ city: 'Udaipur', chosen: broken }).success).toBe(
      false,
    )
  })

  it('rejects a too-short city', () => {
    expect(itineraryRequestSchema.safeParse({ city: 'a', chosen }).success).toBe(false)
  })
})

describe('itineraryResponseSchema', () => {
  const stop = {
    name: 'Ambrai Ghat',
    when: '6:00 am, just before sunrise',
    why: 'The palace glows across the still lake before the crowds wake.',
    tip: 'Chai sellers by the steps open earlier than the cafes.',
  }
  const plan = {
    title: 'A Slow Day by Pichola',
    intro: 'Udaipur asks you to start early.',
    stops: [stop],
    outro: 'Let the lake breeze walk you home.',
  }

  it('accepts a well-formed plan', () => {
    expect(itineraryResponseSchema.safeParse(plan).success).toBe(true)
  })

  it('rejects a plan with no stops', () => {
    expect(itineraryResponseSchema.safeParse({ ...plan, stops: [] }).success).toBe(false)
  })

  it('rejects a plan with more than 8 stops', () => {
    const nine = Array.from({ length: 9 }, () => stop)
    expect(itineraryResponseSchema.safeParse({ ...plan, stops: nine }).success).toBe(false)
  })

  it('requires every stop field', () => {
    const { tip, ...withoutTip } = stop
    expect(
      itineraryResponseSchema.safeParse({ ...plan, stops: [withoutTip] }).success,
    ).toBe(false)
  })

  it('requires title, intro and outro', () => {
    const { outro, ...withoutOutro } = plan
    expect(itineraryResponseSchema.safeParse(withoutOutro).success).toBe(false)
  })
})

describe('buildItineraryPrompt', () => {
  const weather: WeatherSummary = {
    tempC: 34,
    precipProbPct: 10,
    sunrise: '05:29',
    sunset: '19:12',
  }
  const noWeather: WeatherSummary = {
    tempC: null,
    precipProbPct: null,
    sunrise: null,
    sunset: null,
  }

  it('embeds the city and every chosen experience name', () => {
    const prompt = buildItineraryPrompt('Udaipur', chosen, noWeather)
    expect(prompt).toContain('Udaipur')
    expect(prompt).toContain('Ambrai Ghat')
    expect(prompt).toContain('City Palace Museum')
  })

  it('embeds the weather numbers when provided', () => {
    const prompt = buildItineraryPrompt('Udaipur', chosen, weather)
    expect(prompt).toContain('34')
    expect(prompt).toContain('10%')
    expect(prompt).toContain('05:29')
    expect(prompt).toContain('19:12')
  })

  it('omits weather figures when none are available', () => {
    const prompt = buildItineraryPrompt('Udaipur', chosen, noWeather)
    expect(prompt).not.toContain('°C')
    expect(prompt.toLowerCase()).toContain('no live weather')
  })
})

describe('getWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns all-null fields when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    )
    const w = await getWeather('Udaipur')
    expect(w).toEqual({ tempC: null, precipProbPct: null, sunrise: null, sunset: null })
  })

  it('returns a compact summary from geocode + forecast', async () => {
    const geocode = {
      results: [{ latitude: 24.58, longitude: 73.68 }],
    }
    const forecast = {
      current: { temperature_2m: 34.2, weather_code: 1 },
      daily: {
        sunrise: ['2026-07-04T05:29'],
        sunset: ['2026-07-04T19:12'],
        precipitation_probability_max: [10],
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => geocode })
      .mockResolvedValueOnce({ ok: true, json: async () => forecast })
    vi.stubGlobal('fetch', fetchMock)

    const w = await getWeather('Udaipur')
    expect(w).toEqual({ tempC: 34.2, precipProbPct: 10, sunrise: '05:29', sunset: '19:12' })

    const geoUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(geoUrl).toContain('geocoding-api.open-meteo.com')
    expect(geoUrl).toContain('Udaipur')
    const forecastUrl = String(fetchMock.mock.calls[1]?.[0])
    expect(forecastUrl).toContain('latitude=24.58')
    expect(forecastUrl).toContain('longitude=73.68')
  })
})
