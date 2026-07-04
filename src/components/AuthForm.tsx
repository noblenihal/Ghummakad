'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase/browser'

type Mode = 'login' | 'signup'

const COPY: Record<Mode, { title: string; cta: string; alt: string; altHref: string; altLabel: string }> = {
  login: {
    title: 'Welcome back',
    cta: 'Sign in',
    alt: 'New here?',
    altHref: '/signup',
    altLabel: 'Create an account',
  },
  signup: {
    title: 'Create your account',
    cta: 'Sign up',
    alt: 'Already have an account?',
    altHref: '/login',
    altLabel: 'Sign in',
  },
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const copy = COPY[mode]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const supabase = supabaseBrowser()
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Auto-confirm is on server-side, so a session usually exists already.
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          router.push('/app')
          return
        }
        setNotice('Account created. You can sign in now.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/app')
      }
    } catch (err) {
      // Generic message — avoid leaking whether an email exists.
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6 py-16">
      {/* Watermark echo of the landing page. */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-8 select-none font-hindi text-[7rem] leading-none text-henna/[0.07]"
      >
        घुमक्कड़
      </p>

      {/* Boarding pass */}
      <div className="perforated relative rounded-2xl border border-ink/15 bg-white pl-4 shadow-sm">
        <div className="p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/40">
                Ghummakad · boarding pass
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-ink">{copy.title}</h1>
            </div>
            <Link href="/" aria-label="Back to the Ghummakad home page" className="postmark inline-flex shrink-0 p-1">
              <Image src="/logo.png" alt="" width={44} height={44} className="rounded-full" />
            </Link>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-widest text-ink/50"
              >
                Traveller · email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5 w-full rounded-lg border border-ink/20 bg-parchment/50 px-3 py-2.5 text-ink placeholder:text-ink/30"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[11px] uppercase tracking-widest text-ink/50"
              >
                Secret · password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-ink/20 bg-parchment/50 px-3 py-2.5 text-ink placeholder:text-ink/30"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-henna/10 px-3 py-2 text-sm text-henna">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-indigo/10 px-3 py-2 text-sm text-indigo">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
            >
              {busy ? 'Please wait…' : copy.cta}
            </button>
          </form>

          <p className="mt-6 border-t border-dashed border-ink/15 pt-4 text-center font-hindi text-lg text-henna/80">
            पधारो म्हारे देस
            <span className="ml-2 font-body text-xs text-ink/40">— welcome to my land</span>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink/70">
        {copy.alt}{' '}
        <Link href={copy.altHref} className="font-semibold text-indigo underline">
          {copy.altLabel}
        </Link>
      </p>
    </main>
  )
}
