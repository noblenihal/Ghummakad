'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

interface LensResult {
  identified: boolean
  name: string
  location: string
  confidence: 'high' | 'medium' | 'low'
  story: string
  funFact: string
  bestTimeToVisit: string
  nearbyGem: { name: string; why: string }
}

interface PhotoLensSectionProps {
  getToken: () => Promise<string | null>
}

// Mirror the server's constraints so bad uploads fail fast, client-side.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 6 * 1024 * 1024

export default function PhotoLensSection({ getToken }: PhotoLensSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LensResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Revoke the object URL whenever it changes / on unmount, so previews never leak.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    setError(null)
    setResult(null)
    if (!picked) return
    if (!ALLOWED_MIME.includes(picked.type)) {
      setFile(null)
      setPreviewUrl(null)
      setError('That file type won’t work — use a JPEG, PNG, WebP or HEIC photo.')
      return
    }
    if (picked.size > MAX_BYTES) {
      setFile(null)
      setPreviewUrl(null)
      setError('That photo is over 6MB. Please pick a smaller one.')
      return
    }
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Your session expired. Please sign in again.')
      const form = new FormData()
      form.append('photo', file)
      const res = await fetch('/api/lens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
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
    <section aria-labelledby="lens-heading">
      <h2 id="lens-heading" className="font-display text-3xl font-bold text-ink">
        Point at a monument
      </h2>
      <p className="mt-2 text-ink/70">
        Upload a photo — if it has a story, we&apos;ll tell it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label
          htmlFor="lens-photo"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-white px-6 py-10 text-center transition hover:border-marigold hover:bg-marigold/5"
        >
          <span aria-hidden="true" className="text-3xl">
            📷
          </span>
          <span className="font-semibold text-ink">Choose or drop a photo</span>
          <span className="text-sm text-ink/50">JPEG, PNG, WebP or HEIC — up to 6MB</span>
          <input
            ref={inputRef}
            id="lens-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={onPick}
            className="sr-only"
          />
        </label>

        {previewUrl && file && (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Preview of ${file.name}`}
              className="h-20 w-20 rounded-xl border border-ink/10 object-cover"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold/90 disabled:opacity-60"
            >
              {busy ? 'Reading the stones…' : 'Identify & tell the story'}
            </button>
          </div>
        )}
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-henna/10 px-4 py-3 text-henna">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-8">
        {result && result.identified && (
          <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl font-bold text-ink">{result.name}</h3>
              <span className="rounded-full bg-indigo/10 px-3 py-1 font-mono text-xs text-indigo">
                {result.location} · {result.confidence} confidence
              </span>
            </div>
            <p className="mt-4 whitespace-pre-line text-ink/80">{result.story}</p>
            <div className="mt-5 rounded-xl bg-marigold/10 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Fun fact</p>
              <p className="mt-1 text-sm text-ink/80">{result.funFact}</p>
            </div>
            <p className="mt-4 text-sm text-ink/70">
              <span className="font-semibold text-ink">Best time to visit:</span>{' '}
              {result.bestTimeToVisit}
            </p>
            <div className="mt-5 rounded-xl border border-henna/20 bg-henna/5 px-4 py-3">
              <p className="text-sm font-semibold text-henna">
                Skip the crowd: {result.nearbyGem.name}
              </p>
              <p className="mt-1 text-sm text-ink/80">{result.nearbyGem.why}</p>
            </div>
          </article>
        )}

        {result && !result.identified && (
          <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-ink">
              We couldn&apos;t name this one — but here&apos;s what we see
            </h3>
            <p className="mt-3 whitespace-pre-line text-ink/80">{result.story}</p>
            <p className="mt-4 text-sm text-ink/50">
              Try a clearer angle, or a shot with more of the structure in frame.
            </p>
          </article>
        )}
      </div>
    </section>
  )
}
