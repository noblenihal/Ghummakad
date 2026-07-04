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
    <section aria-labelledby="events-heading" className="py-10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-henna">
        Ticket 04 · Live events
      </p>
      <h2 id="events-heading" className="mt-1 font-display text-3xl font-bold text-ink">
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

      <div aria-live="polite" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events !== null && events.length === 0 && (
          <p className="text-ink/60 sm:col-span-2">
            Nothing verifiable found for the next two weeks — try a bigger city nearby.
          </p>
        )}
        {events?.map((ev) => (
          <article
            key={`${ev.name}-${ev.when}`}
            className="rounded-2xl border border-dashed border-ink/25 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold leading-snug text-ink">{ev.name}</h3>
              <span className="shrink-0 rounded border border-dashed border-henna/50 bg-henna/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-henna">
                {ev.when}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              <span aria-hidden="true">📍 </span>
              {ev.venue}
            </p>
            <p className="mt-2 text-sm text-ink/80">{ev.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
