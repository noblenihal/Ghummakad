import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import { generateJson } from '@/lib/gemini'
import { buildDiscoverPrompt } from '@/lib/prompts'
import { TtlCache } from '@/lib/ttl-cache'
import {
  discoverGeminiSchema,
  discoverRequestSchema,
  discoverResponseSchema,
  type DiscoverResponse,
} from '@/lib/schemas'

// Real Gemini call, gated behind a verified Supabase session.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Identical vibes within the TTL reuse the last genuine Gemini result instead of
// paying for another model call. Cached values are real model output — nothing
// is hardcoded or faked.
const CACHE_TTL_MS = 30 * 60 * 1000
const discoverCache = new TtlCache<DiscoverResponse>(CACHE_TTL_MS)

const cacheKey = (vibe: string) => vibe.trim().toLowerCase().replace(/\s+/g, ' ')

export async function POST(req: Request) {
  const auth = await verifyRequest(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = discoverRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const key = cacheKey(parsed.data.vibe)
  const cached = discoverCache.get(key)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const raw = await generateJson(buildDiscoverPrompt(parsed.data), discoverGeminiSchema)
    const result = discoverResponseSchema.safeParse(JSON.parse(raw))
    if (!result.success) {
      return NextResponse.json(
        { error: 'The guide gave an unexpected answer. Try rephrasing your vibe.' },
        { status: 502 },
      )
    }
    discoverCache.set(key, result.data)
    return NextResponse.json(result.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
