'use client'

import { useState, type FormEvent } from 'react'

interface EventItem {
  name: string
  when: string
  venue: string
  blurb: string
}

interface EventsSectionProps {
  getToken: () => Promise<string | null>
}

export default function EventsSection({ getToken }: EventsSectionProps) {
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<EventItem[] | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEvents(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Your session expired. Please sign in again.')
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Request failed.')
      setEvents(json.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="events-heading">
      <h2 id="events-heading" className="font-display text-3xl font-bold text-ink">
        What&apos;s happening right now
      </h2>
      <p className="mt-2 text-ink/70">
        Real festivals, fairs and performances in the next two weeks — found live on the web.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="events-city" className="sr-only">
          City
        </label>
        <input
          id="events-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          placeholder="e.g. Jaipur"
          className="w-56 flex-1 rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink sm:flex-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
        >
          {busy ? 'Checking the city…' : 'Find events'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-henna/10 px-4 py-3 text-henna">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-8 space-y-4">
        {events !== null && events.length === 0 && (
          <p className="text-ink/60">
            Nothing verifiable found for the next two weeks — try a bigger city nearby.
          </p>
        )}
        {events?.map((ev) => (
          <article
            key={`${ev.name}-${ev.when}`}
            className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-ink">{ev.name}</h3>
              <span className="text-sm font-semibold text-henna">{ev.when}</span>
            </div>
            <p className="mt-1 text-sm text-ink/50">{ev.venue}</p>
            <p className="mt-2 text-ink/80">{ev.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
