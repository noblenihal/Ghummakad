'use client'

import { useEffect, useState } from 'react'

// The hero demos the product: the kinds of feelings Ghummakad turns into places.
const VIBES = [
  'misty hills & morning monasteries…',
  'desert forts & folk songs after dark…',
  'old bazaars, brass and cardamom…',
  'a river town where time slows down…',
  'monsoon chai on a painted balcony…',
]

/**
 * Types each vibe out letter by letter, holds, erases, moves on. Respects
 * prefers-reduced-motion by showing a static line instead.
 */
export default function VibeCycle() {
  const [reduced, setReduced] = useState(false)
  const [index, setIndex] = useState(0)
  const [chars, setChars] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'holding' | 'erasing'>('typing')

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduced) return
    const current = VIBES[index] ?? ''
    let delay: number
    if (phase === 'typing') {
      delay = chars >= current.length ? 0 : 45
    } else if (phase === 'holding') {
      delay = 1800
    } else {
      delay = chars <= 0 ? 0 : 18
    }
    const timer = window.setTimeout(() => {
      if (phase === 'typing') {
        if (chars >= current.length) setPhase('holding')
        else setChars((c) => c + 1)
      } else if (phase === 'holding') {
        setPhase('erasing')
      } else {
        if (chars <= 0) {
          setIndex((i) => (i + 1) % VIBES.length)
          setPhase('typing')
        } else {
          setChars((c) => c - 1)
        }
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [reduced, index, chars, phase])

  const text = reduced ? VIBES[0] : (VIBES[index] ?? '').slice(0, chars)

  return (
    <span className="vibe-gradient font-display italic" aria-label={VIBES[index]}>
      {text}
      {!reduced && (
        <span aria-hidden="true" className="animate-pulse font-normal not-italic text-marigold">
          |
        </span>
      )}
    </span>
  )
}
