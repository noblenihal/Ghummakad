import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  lensResponseSchema,
  buildLensPrompt,
  analyzePhoto,
  LensShapeError,
} from './lens'

const validResult = {
  identified: true,
  name: 'Charminar',
  location: 'Hyderabad, India',
  confidence: 'high',
  story:
    'You stand before the four soaring minarets raised in 1591 by Muhammad Quli Qutb Shah, a monument of thanks after a plague lifted from his new city.',
  funFact: 'A secret tunnel is said to run from the Charminar to Golconda Fort.',
  bestTimeToVisit: 'Early morning, just after sunrise, before the bazaar crowds arrive.',
  nearbyGem: {
    name: 'Nimrah Café',
    why: 'Century-old Irani chai and Osmania biscuits in the monument’s shadow.',
  },
}

describe('lensResponseSchema', () => {
  it('accepts a well-formed result', () => {
    const r = lensResponseSchema.safeParse(validResult)
    expect(r.success).toBe(true)
  })

  it('rejects a result missing nearbyGem', () => {
    const { nearbyGem, ...withoutGem } = validResult
    expect(lensResponseSchema.safeParse(withoutGem).success).toBe(false)
  })

  it('rejects a bad confidence value', () => {
    const broken = { ...validResult, confidence: 'certain' }
    expect(lensResponseSchema.safeParse(broken).success).toBe(false)
  })
})

describe('buildLensPrompt', () => {
  it('carries the anti-fabrication instruction', () => {
    const prompt = buildLensPrompt()
    expect(prompt).toContain('NEVER')
  })

  it('explains the identified=false fallback', () => {
    const prompt = buildLensPrompt()
    expect(prompt).toContain('`identified` to')
    expect(prompt).toContain('false')
    expect(prompt.toLowerCase()).toContain('empty strings')
  })
})

describe('analyzePhoto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.GEMINI_API_KEY
  })

  it('sends the image inline and returns the validated result', async () => {
    process.env.GEMINI_API_KEY = 'test'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(validResult) }] } }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzePhoto('aGVsbG8=', 'image/jpeg')
    expect(result).toEqual(validResult)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }]
    const body = JSON.parse(init.body)
    expect(body.contents[0].parts[0].inline_data).toEqual({
      mime_type: 'image/jpeg',
      data: 'aGVsbG8=',
    })
  })

  it('throws LensShapeError on garbage model output', async () => {
    process.env.GEMINI_API_KEY = 'test'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not json at all' }] } }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(analyzePhoto('aGVsbG8=', 'image/png')).rejects.toBeInstanceOf(LensShapeError)
  })
})
