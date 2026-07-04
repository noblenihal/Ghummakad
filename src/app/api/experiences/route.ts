import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import {
  ExperiencesShapeError,
  experiencesRequestSchema,
  fetchExperiences,
} from '@/lib/features/experiences'

// Real Gemini call, gated behind a verified Supabase session.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const parsed = experiencesRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const result = await fetchExperiences(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ExperiencesShapeError) {
      return NextResponse.json({ error: err.message }, { status: 502 })
    }
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
