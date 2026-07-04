'use client'

import { useEffect, useState } from 'react'

interface PlacePhotoProps {
  query: string
  alt: string
  className?: string
}

/**
 * Real photo of a place, resolved live via /api/photo (Places → Wikipedia).
 * While loading shows a shimmer; if no real photo exists, renders a warm
 * gradient so the card never breaks — but never a fake "photo".
 */
export default function PlacePhoto({ query, alt, className = '' }: PlacePhotoProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'done' | 'none'>('loading')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setUrl(null)
    fetch(`/api/photo?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j: { url: string | null }) => {
        if (cancelled) return
        if (j.url) {
          setUrl(j.url)
          setState('done')
        } else {
          setState('none')
        }
      })
      .catch(() => {
        if (!cancelled) setState('none')
      })
    return () => {
      cancelled = true
    }
  }, [query])

  if (state === 'done' && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary (Places/Wikipedia); next/image would need a whitelist
      <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`bg-gradient-to-br from-marigold/60 via-henna/40 to-indigo/50 ${
        state === 'loading' ? 'animate-pulse' : ''
      } ${className}`}
    />
  )
}
