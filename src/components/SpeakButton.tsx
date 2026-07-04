'use client'

import { useEffect, useRef, useState } from 'react'

interface SpeakButtonProps {
  text: string
  /** BCP-47 hint, e.g. 'hi-IN' for Devanagari phrases, 'en-IN' for stories. */
  lang?: string
  label: string
  className?: string
}

/**
 * Speaks `text` with the browser's built-in speechSynthesis — no API key, and
 * doubles as an accessibility feature. Picks the best available voice for
 * `lang` (exact match, then language-prefix match), falling back to the
 * default voice. Hidden entirely if the browser doesn't support speech.
 */
export default function SpeakButton({ text, lang = 'en-IN', label, className = '' }: SpeakButtonProps) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      // Don't let a narration outlive the component.
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!supported) return null

  function pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(lang.split('-')[0] ?? '')) ??
      null
    )
  }

  function toggle() {
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    synth.cancel() // stop any other narration first
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    const voice = pickVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    utteranceRef.current = utterance
    setSpeaking(true)
    synth.speak(utterance)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? `Stop: ${label}` : label}
      aria-pressed={speaking}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-marigold/10 ${className}`}
    >
      <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
      {speaking ? 'Stop' : 'Listen'}
    </button>
  )
}
