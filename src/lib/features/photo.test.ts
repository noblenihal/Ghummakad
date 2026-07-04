import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolvePhoto } from './photo'

// The module-level cache persists across tests, so each test uses a unique
// query string to guarantee it exercises real fetch behaviour, not the cache.

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response

beforeEach(() => {
  delete process.env.GOOGLE_CLOUD_KEY
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GOOGLE_CLOUD_KEY
})

describe('resolvePhoto — wikipedia layer', () => {
  it('returns the wikipedia thumbnail on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ thumbnail: { source: 'https://upload.wikimedia.org/ziro.jpg' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolvePhoto('Ziro Valley wiki-success')
    expect(result).toEqual({
      url: 'https://upload.wikimedia.org/ziro.jpg',
      source: 'wikipedia',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('en.wikipedia.org/api/rest_v1/page/summary/')
  })

  it('retries with a comma-simplified query after a 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(
        jsonResponse({ originalimage: { source: 'https://upload.wikimedia.org/hampi.jpg' } }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolvePhoto('Hampi wiki-retry, Karnataka, India')
    expect(result).toEqual({
      url: 'https://upload.wikimedia.org/hampi.jpg',
      source: 'wikipedia',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(encodeURIComponent('Hampi wiki-retry'))
  })

  it('returns null when every layer fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolvePhoto('Nowhere all-fail')
    expect(result).toBeNull()
  })
})

describe('resolvePhoto — google places layer', () => {
  it('uses Places when GOOGLE_CLOUD_KEY is set and a photo comes back', async () => {
    process.env.GOOGLE_CLOUD_KEY = 'test-key'
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        places: [{ photos: [{ name: 'places/abc/photos/xyz' }] }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolvePhoto('Taj Mahal places-success')
    expect(result).toEqual({
      url: 'https://places.googleapis.com/v1/places/abc/photos/xyz/media?maxWidthPx=800&key=test-key',
      source: 'places',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://places.googleapis.com/v1/places:searchText',
    )
  })

  it('falls through to wikipedia when Places errors', async () => {
    process.env.GOOGLE_CLOUD_KEY = 'test-key'
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('places down'))
      .mockResolvedValueOnce(
        jsonResponse({ thumbnail: { source: 'https://upload.wikimedia.org/fallback.jpg' } }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolvePhoto('Jaipur places-fallback')
    expect(result).toEqual({
      url: 'https://upload.wikimedia.org/fallback.jpg',
      source: 'wikipedia',
    })
  })
})

describe('resolvePhoto — cache', () => {
  it('serves a repeat lookup from the cache without refetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ thumbnail: { source: 'https://upload.wikimedia.org/cached.jpg' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await resolvePhoto('Munnar cache-test')
    const again = await resolvePhoto('  Munnar   CACHE-test ') // normalized to same key
    expect(again).toEqual({
      url: 'https://upload.wikimedia.org/cached.jpg',
      source: 'wikipedia',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
