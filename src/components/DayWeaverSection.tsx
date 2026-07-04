'use client'

import { useState, type FormEvent } from 'react'
import PlacePhoto from '@/components/PlacePhoto'

interface ExperienceItem {
  id: string
  name: string
  hook: string
  bestTime: string
  indoor: boolean
  category: string
}

interface PlanStop {
  name: string
  when: string
  why: string
  tip: string
}

interface DayPlan {
  title: string
  intro: string
  stops: PlanStop[]
  outro: string
}

interface WeatherSummary {
  tempC: number | null
  precipProbPct: number | null
  sunrise: string | null
  sunset: string | null
}

interface DayWeaverSectionProps {
  getToken: () => Promise<string | null>
}

function weatherLine(w: WeatherSummary): string | null {
  const bits: string[] = []
  if (w.tempC !== null) bits.push(`${Math.round(w.tempC)}°C`)
  if (w.precipProbPct !== null) bits.push(`${w.precipProbPct}% rain`)
  if (w.sunset !== null) bits.push(`sunset ${w.sunset}`)
  return bits.length > 0 ? `Planned around: ${bits.join(', ')}` : null
}

export default function DayWeaverSection({ getToken }: DayWeaverSectionProps) {
  const [city, setCity] = useState('')
  const [searchedCity, setSearchedCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [weaving, setWeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<ExperienceItem[] | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [weather, setWeather] = useState<WeatherSummary | null>(null)

  async function authedPost(path: string, body: unknown) {
    const token = await getToken()
    if (!token) throw new Error('Your session expired. Please sign in again.')
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Request failed.')
    return json
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setExperiences(null)
    setPicked(new Set())
    setPlan(null)
    setWeather(null)
    setBusy(true)
    try {
      const json = await authedPost('/api/experiences', { city })
      setExperiences(json.experiences)
      setSearchedCity(json.city ?? city)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onWeave() {
    if (!experiences || picked.size === 0) return
    setError(null)
    setPlan(null)
    setWeather(null)
    setWeaving(true)
    try {
      const chosen = experiences
        .filter((ex) => picked.has(ex.id))
        .map((ex) => ({ name: ex.name, bestTime: ex.bestTime, indoor: ex.indoor }))
      const json = await authedPost('/api/itinerary', { city: searchedCity, chosen })
      setPlan(json.plan)
      setWeather(json.weather ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setWeaving(false)
    }
  }

  const weatherSummary = weather ? weatherLine(weather) : null

  return (
    <section aria-labelledby="dayweaver-heading" className="py-10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-henna">
        Ticket 03 · Day weaver
      </p>
      <h2 id="dayweaver-heading" className="mt-1 font-display text-3xl font-bold text-ink">
        Weave your day
      </h2>
      <p className="mt-2 text-ink/70">
        Pick the experiences that call to you — we weave them into one weather-aware day.
      </p>

      <form onSubmit={onSearch} className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="dayweaver-city" className="sr-only">
          City
        </label>
        <input
          id="dayweaver-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          placeholder="e.g. Udaipur"
          className="w-56 flex-1 rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink sm:flex-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
        >
          {busy ? 'Gathering experiences…' : 'Show me experiences'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-henna/10 px-4 py-3 text-henna">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-8">
        {experiences && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {experiences.map((ex) => {
                const selected = picked.has(ex.id)
                return (
                  <article
                    key={ex.id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                      selected ? 'border-indigo ring-2 ring-indigo/40' : 'border-ink/10'
                    }`}
                  >
                    <div className="relative">
                      {/* Comma matters: the photo resolver's Wikipedia retry
                          strips everything after the first comma, falling back
                          to the bare place name. */}
                      <PlacePhoto
                        query={`${ex.name}, ${searchedCity}`}
                        alt={`Photo of ${ex.name}`}
                        className="h-28 w-full"
                      />
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Add ${ex.name} to my day`}
                        onClick={() => togglePick(ex.id)}
                        className={`absolute right-2 top-2 shrink-0 rounded-full border px-3 py-1 text-lg shadow-sm transition ${
                          selected
                            ? 'border-indigo bg-indigo text-white'
                            : 'border-ink/20 bg-white text-ink/50 hover:text-henna'
                        }`}
                      >
                        {selected ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-henna">
                        {ex.category} · best at {ex.bestTime}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">
                        {ex.name}
                      </h3>
                      <p className="mt-1 text-sm text-ink/80">{ex.hook}</p>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="sticky bottom-4 mt-6 flex justify-center">
              <button
                type="button"
                onClick={onWeave}
                disabled={picked.size === 0 || weaving}
                className="rounded-full bg-marigold px-8 py-3 font-semibold text-ink shadow-lg transition hover:bg-marigold/90 disabled:opacity-60"
              >
                {weaving
                  ? 'Weaving your day…'
                  : `Weave my day (${picked.size} picked)`}
              </button>
            </div>
          </>
        )}
      </div>

      <div aria-live="polite" className="mt-8">
        {plan && (
          <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h3 className="font-display text-2xl font-bold text-ink">{plan.title}</h3>
            {weatherSummary && (
              <p className="mt-1 text-sm font-semibold text-henna">{weatherSummary}</p>
            )}
            <p className="mt-3 text-ink/80">{plan.intro}</p>
            <ol className="mt-5">
              {plan.stops.map((stop, i) => (
                <li key={`${stop.name}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < plan.stops.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-4 top-9 w-px bg-henna/40"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo font-mono text-sm font-semibold text-white"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-henna">
                      Stop {String(i + 1).padStart(2, '0')} · {stop.when}
                    </p>
                    <h4 className="mt-0.5 font-display font-bold text-ink">{stop.name}</h4>
                    <p className="mt-1 text-ink/80">{stop.why}</p>
                    <p className="mt-1 text-sm text-ink/60">Tip: {stop.tip}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-ink/80">{plan.outro}</p>
          </article>
        )}
      </div>
    </section>
  )
}
