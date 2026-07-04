import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolvePhoto } from '@/lib/features/photo'

// Deliberately PUBLIC (no verifyRequest): it only resolves publicly available
// photos of places — nothing user-specific or sensitive — and <img>/next/image
// requests can't attach a Supabase bearer token anyway.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.string().trim().min(2).max(120)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(searchParams.get('q') ?? '')
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid photo query.' }, { status: 400 })
  }

  try {
    const photo = await resolvePhoto(parsed.data)
    // Misses still return 200 with url: null — the client shows a gradient
    // fallback rather than treating "no photo found" as an error.
    return NextResponse.json(photo ?? { url: null })
  } catch {
    return NextResponse.json({ url: null })
  }
}
