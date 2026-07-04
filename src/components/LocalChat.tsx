'use client'

import { useRef, useState, type FormEvent } from 'react'
import type { LocalPersona } from '@/lib/features/locals'
import type { ChatMessage } from '@/lib/features/chat'

interface LocalChatProps {
  city: string
  local: LocalPersona
  getToken: () => Promise<string | null>
}

// Live, in-character conversation with a local. Every reply is a fresh Gemini
// call; the last 10 turns are sent as context so answers stay coherent.
export default function LocalChat({ city, local, getToken }: LocalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setError(null)
    setDraft('')
    const history = messages.slice(-10)
    setMessages((cur) => [...cur, { role: 'user', text }])
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Your session expired. Please sign in again.')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          city,
          persona: { name: local.name, age: local.age, trade: local.trade },
          history,
          message: text,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Request failed.')
      setMessages((cur) => [...cur, { role: 'local', text: json.reply }])
      // Keep the newest message in view.
      requestAnimationFrame(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ink/10 bg-parchment/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-henna">
        Ask {local.name.split(' ')[0]} anything about {city}
      </p>

      {messages.length > 0 && (
        <div
          ref={logRef}
          aria-live="polite"
          className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1"
        >
          {messages.map((m, i) => (
            <p
              key={i}
              className={
                m.role === 'user'
                  ? 'ml-8 rounded-xl bg-indigo/10 px-3 py-2 text-sm text-ink'
                  : 'mr-8 rounded-xl bg-white px-3 py-2 text-sm text-ink/90 shadow-sm'
              }
            >
              {m.text}
            </p>
          ))}
          {busy && (
            <p className="mr-8 rounded-xl bg-white px-3 py-2 text-sm italic text-ink/50 shadow-sm">
              {local.name.split(' ')[0]} is thinking…
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-henna/10 px-3 py-2 text-sm text-henna">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label htmlFor={`chat-${local.id}`} className="sr-only">
          Your question for {local.name}
        </label>
        <input
          id={`chat-${local.id}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Where do you eat? What should I skip?"
          className="min-w-0 flex-1 rounded-full border border-ink/20 bg-white px-4 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={busy || draft.trim().length === 0}
          className="rounded-full bg-marigold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
