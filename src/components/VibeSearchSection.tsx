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
    <section aria-labelledby="vibe-heading">
      <h2 id="vibe-heading" className="font-display text-3xl font-bold text-ink">
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

      <div aria-live="polite" className="mt-8 space-y-4">
        {results?.map((d) => (
          <article
            key={`${d.name}-${d.region}`}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm"
          >
            {/* Comma matters: the photo resolver's Wikipedia retry strips
                everything after the first comma, falling back to the bare
                place name (e.g. "Hawa Mahal, Jaipur" → "Hawa Mahal"). */}
            <PlacePhoto
              query={`${d.name}, ${d.region}`}
              alt={`Photo of ${d.name}`}
              className="h-44 w-full"
            />
            <div className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-ink">{d.name}</h3>
              <span className="text-sm text-ink/50">{d.region}</span>
            </div>
            <p className="mt-1 italic text-henna">{d.hook}</p>
            <p className="mt-3 text-ink/80">{d.whyItMatches}</p>
            <p className="mt-3 text-sm text-ink/50">Best months: {d.bestMonths}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
