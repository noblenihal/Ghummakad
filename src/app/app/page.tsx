'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import type { Destination } from '@/lib/schemas'

type Status = 'checking' | 'ready'

export default function AppPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState<string | null>(null)

  const [vibe, setVibe] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Destination[] | null>(null)

  // Client-side guard: no session → back to /login.
  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
        return
      }
      setEmail(data.session.user.email ?? null)
      setStatus('ready')
    })
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResults(null)
    setBusy(true)
    try {
      const supabase = supabaseBrowser()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        router.replace('/login')
        return
      }
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

  async function signOut() {
    await supabaseBrowser().auth.signOut()
    router.replace('/')
  }

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-ink/60">Loading…</p>
      </main>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <span className="font-display text-lg font-bold text-ink">Ghummakad</span>
        <div className="flex items-center gap-4 text-sm">
          {email && <span className="hidden text-ink/60 sm:inline">{email}</span>}
          <button onClick={signOut} className="font-semibold text-indigo underline">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">What kind of trip are you chasing?</h1>
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

        <section aria-live="polite" className="mt-8 space-y-4">
          {results?.map((d) => (
            <article key={`${d.name}-${d.region}`} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-ink">{d.name}</h2>
                <span className="text-sm text-ink/50">{d.region}</span>
              </div>
              <p className="mt-1 italic text-henna">{d.hook}</p>
              <p className="mt-3 text-ink/80">{d.whyItMatches}</p>
              <p className="mt-3 text-sm text-ink/50">Best months: {d.bestMonths}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
