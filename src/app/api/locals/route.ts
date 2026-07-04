import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import { generateJson } from '@/lib/gemini'
import { TtlCache } from '@/lib/ttl-cache'
import {
  buildLocalsPrompt,
  localsGeminiSchema,
  localsRequestSchema,
  localsResponseSchema,
  type LocalsResponse,
} from '@/lib/features/locals'

// Real Gemini call, gated behind a verified Supabase session.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Identical cities within the TTL reuse the last genuine Gemini result instead
// of paying for another model call. Cached values are real model output —
// nothing is hardcoded or faked.
const CACHE_TTL_MS = 30 * 60 * 1000
const localsCache = new TtlCache<LocalsResponse>(CACHE_TTL_MS)

const cacheKey = (city: string) => city.trim().toLowerCase().replace(/\s+/g, ' ')

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

  const parsed = localsRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const key = cacheKey(parsed.data.city)
  const cached = localsCache.get(key)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const raw = await generateJson(buildLocalsPrompt(parsed.data), localsGeminiSchema)
    const result = localsResponseSchema.safeParse(JSON.parse(raw))
    if (!result.success) {
      return NextResponse.json(
        { error: 'The guide gave an unexpected answer. Try another city.' },
        { status: 502 },
      )
    }
    localsCache.set(key, result.data)
    return NextResponse.json(result.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
