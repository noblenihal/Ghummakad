'use client'

import { useState, type FormEvent } from 'react'
import type { LocalPersona, LocalsResponse } from '@/lib/features/locals'
import LocalChat from '@/components/LocalChat'
import SpeakButton from '@/components/SpeakButton'

type Props = {
  getToken: () => Promise<string | null>
}

export default function LocalsSection({ getToken }: Props) {
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LocalsResponse | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setOpenId(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Please sign in to meet the locals.')
      const res = await fetch('/api/locals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Request failed.')
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold text-ink">Meet the locals</h2>
      <p className="mt-2 text-ink/70">
        Name a city and be introduced to the kind of people who carry its stories.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="locals-city" className="sr-only">
            City
          </label>
          <input
            id="locals-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            minLength={2}
            maxLength={60}
            placeholder="e.g. Varanasi, Madurai, Shillong"
            className="w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
        >
          {busy ? 'Finding your people…' : 'Introduce me'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-henna/10 px-4 py-3 text-henna">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-8 space-y-4">
        {result && (
          <>
            <p className="text-sm text-ink/50">Your cast in {result.city} — tap someone to hear their story.</p>
            {result.locals.map((local) => (
              <LocalCard
                key={local.id}
                local={local}
                city={result.city}
                getToken={getToken}
                open={openId === local.id}
                onToggle={() => setOpenId((cur) => (cur === local.id ? null : local.id))}
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

function LocalCard({
  local,
  city,
  getToken,
  open,
  onToggle,
}: {
  local: LocalPersona
  city: string
  getToken: () => Promise<string | null>
  open: boolean
  onToggle: () => void
}) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 rounded-2xl p-5 text-left transition hover:bg-marigold/5"
      >
        <span aria-hidden="true" className="text-4xl">
          {local.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-ink">{local.name}</span>
            <span className="text-sm text-ink/50">
              {local.age} · {local.trade}
            </span>
          </span>
          <span className="mt-1 block italic text-henna">{local.greeting}</span>
        </span>
        <span aria-hidden="true" className="text-ink/40">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink/10 px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-line text-ink/80">{local.story}</p>
            <SpeakButton
              text={`${local.greeting} ${local.story}`}
              lang="en-IN"
              label={`Listen to ${local.name}'s story`}
              className="shrink-0"
            />
          </div>
          <div className="mt-4 rounded-xl border border-ink/10 bg-marigold/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-henna">
                Say it like a local
              </p>
              <SpeakButton
                text={local.phrase.local}
                lang="hi-IN"
                label={`Hear the phrase ${local.phrase.translit}`}
              />
            </div>
            <p className="mt-2 text-lg text-ink">{local.phrase.local}</p>
            <p className="mt-1 text-sm italic text-ink/70">{local.phrase.translit}</p>
            <p className="mt-1 text-sm text-ink/60">“{local.phrase.english}”</p>
          </div>
          <LocalChat city={city} local={local} getToken={getToken} />
        </div>
      )}
    </article>
  )
}
