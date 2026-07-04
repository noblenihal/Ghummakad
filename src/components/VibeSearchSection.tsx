'use client'

import { useState, type FormEvent } from 'react'
import type { Destination } from '@/lib/schemas'
import PlacePhoto from '@/components/PlacePhoto'

interface VibeSearchSectionProps {
  getToken: () => Promise<string | null>
}

export default function VibeSearchSection({ getToken }: VibeSearchSectionProps) {
  const [vibe, setVibe] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Destination[] | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResults(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Your session expired. Please sign in again.')
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vibe }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Request failed.')
      setResults(json.destinations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="vibe-heading" className="py-10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-henna">
        Ticket 01 · Vibe search
      </p>
      <h2 id="vibe-heading" className="mt-1 font-display text-3xl font-bold text-ink">
        What kind of trip are you chasing?
      </h2>
      <p className="mt-2 text-ink/70">
        Describe a mood — “slow mornings, old bazaars, no crowds” — and get places that match.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="vibe" className="sr-only">
          Your travel vibe
        </label>
        <textarea
          id="vibe"
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          rows={3}
          required
          minLength={3}
          maxLength={300}
          placeholder="e.g. misty hills, monasteries, hot noodle soup and total quiet"
          className="w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
        >
          {busy ? 'Consulting the locals…' : 'Find my places'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-henna/10 px-4 py-3 text-henna">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results?.map((d) => (
          <article
            key={`${d.name}-${d.region}`}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm"
          >
            <div className="relative">
              {/* Comma matters: the photo resolver's Wikipedia retry strips
                  everything after the first comma, falling back to the bare
                  place name (e.g. "Hawa Mahal, Jaipur" → "Hawa Mahal"). */}
              <PlacePhoto
                query={`${d.name}, ${d.region}`}
                alt={`Photo of ${d.name}`}
                className="h-40 w-full"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/80 to-transparent"
              />
              <span className="absolute bottom-2 left-3 font-mono text-[11px] uppercase tracking-widest text-parchment">
                {d.region}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl font-bold text-ink">{d.name}</h3>
              <p className="mt-1 italic text-henna">{d.hook}</p>
              <p className="mt-2 text-sm text-ink/80">{d.whyItMatches}</p>
              <p className="mt-3 inline-block rounded border border-dashed border-ink/25 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                Best months · {d.bestMonths}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
