import { TtlCache } from '@/lib/ttl-cache'

// ── Real-photo resolver ────────────────────────────────────────────────────
// Resolves a place query to a REAL photo fetched live from public APIs.
// Layer 1: Google Places API (New) — only when GOOGLE_CLOUD_KEY is set.
// Layer 2: Wikipedia REST summary thumbnail — keyless fallback.
// Nothing is bundled or faked: every URL points at a live photo of the place.

export type PhotoResult = { url: string; source: 'places' | 'wikipedia' }

// Repeated lookups for the same place within the TTL reuse the previously
// resolved (genuine) URL instead of re-hitting the upstream APIs.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
export const photoCache = new TtlCache<PhotoResult | null>(CACHE_TTL_MS, 500)

const normalize = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ')

async function fromPlaces(query: string, apiKey: string): Promise<PhotoResult | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.photos,places.displayName',
      },
      body: JSON.stringify({ textQuery: query }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      places?: Array<{ photos?: Array<{ name?: string }> }>
    }
    const photoName = json.places?.[0]?.photos?.[0]?.name
    if (!photoName) return null
    return {
      url: `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`,
      source: 'places',
    }
  } catch {
    return null // fall through to the next layer
  }
}

async function fetchWikiSummary(title: string): Promise<Response> {
  return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    headers: { 'User-Agent': 'Ghummakad/1.0' },
  })
}

async function fromWikipedia(query: string): Promise<PhotoResult | null> {
  try {
    let res = await fetchWikiSummary(query)
    if (res.status === 404) {
      // "Ziro Valley, Arunachal Pradesh" often 404s where "Ziro Valley" hits.
      const simplified = query.split(',')[0]?.trim() ?? ''
      if (simplified.length < 2 || simplified === query.trim()) return null
      res = await fetchWikiSummary(simplified)
    }
    if (!res.ok) return null
    const json = (await res.json()) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
    }
    const url = json.thumbnail?.source ?? json.originalimage?.source
    return url ? { url, source: 'wikipedia' } : null
  } catch {
    return null
  }
}

export async function resolvePhoto(query: string): Promise<PhotoResult | null> {
  const key = normalize(query)
  const cached = photoCache.get(key)
  if (cached !== undefined) return cached

  const googleKey = process.env.GOOGLE_CLOUD_KEY
  const result =
    (googleKey ? await fromPlaces(query, googleKey) : null) ?? (await fromWikipedia(query))

  photoCache.set(key, result)
  return result
}
