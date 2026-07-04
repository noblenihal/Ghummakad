import { NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/supabase/verify'
import { generateText } from '@/lib/gemini'
import { buildChatPrompt, chatRequestSchema } from '@/lib/features/chat'

// Live, in-character chat with a local persona. Deliberately uncached — every
// reply is a fresh Gemini call so the conversation is genuinely dynamic.
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

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const reply = (await generateText(buildChatPrompt(parsed.data))).trim()
    if (!reply) {
      return NextResponse.json(
        { error: 'The local went quiet for a moment. Ask again?' },
        { status: 502 },
      )
    }
    return NextResponse.json({ reply })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
