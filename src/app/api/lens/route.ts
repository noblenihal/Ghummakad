import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import {
  ALLOWED_MIME,
  MAX_BYTES,
  analyzePhoto,
  LensShapeError,
} from '@/lib/features/lens'

// Real Gemini Vision call, gated behind a verified Supabase session. Uploads
// are unique, so nothing here is cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const auth = await verifyRequest(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected a multipart form with a "photo" file.' },
      { status: 400 },
    )
  }

  const file = form.get('photo')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Attach a photo file under the "photo" field.' },
      { status: 400 },
    )
  }

  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported image type. Use a JPEG, PNG, WebP or HEIC photo.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'That photo is over 6MB. Please upload a smaller one.' },
      { status: 400 },
    )
  }

  try {
    const imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    const result = await analyzePhoto(imageBase64, file.type)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof LensShapeError) {
      return NextResponse.json({ error: err.message }, { status: 502 })
    }
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
