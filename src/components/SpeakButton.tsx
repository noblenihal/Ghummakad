'use client'

import { useEffect, useRef, useState } from 'react'

interface SpeakButtonProps {
  text: string
  /** 'story' = warm accented English narration; 'phrase' = native-language line. */
  kind: 'story' | 'phrase'
  /** BCP-47 hint for the browser-speech fallback. */
  lang?: string
  label: string
  /** Bearer token supplier for /api/tts (Gemini native voices). */
  getToken?: () => Promise<string | null>
  className?: string
}

/**
 * Speaks `text` with Gemini's native TTS (natural, accented voices) and falls
 * back to the browser's speechSynthesis if the API is unavailable. Audio is
 * cached per clip on the server and by the browser, so replays are instant.
 */
export default function SpeakButton({
  text,
  kind,
  lang = 'en-IN',
  label,
  getToken,
  className = '',
}: SpeakButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function stop() {
    audioRef.current?.pause()
    audioRef.current = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setState('idle')
  }

  function speakWithBrowser() {
    if (!('speechSynthesis' in window)) {
      setState('idle')
      return
    }
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    const voices = synth.getVoices()
    const voice =
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(lang.split('-')[0] ?? ''))
    if (voice) utterance.voice = voice
    utterance.rate = 0.95
    utterance.onend = () => setState('idle')
    utterance.onerror = () => setState('idle')
    setState('playing')
    synth.speak(utterance)
  }

  async function play() {
    setState('loading')
    try {
      const token = getToken ? await getToken() : null
      if (!token) throw new Error('no-token')
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, kind }),
      })
      if (!res.ok) throw new Error('tts-failed')
      const blob = await res.blob()
      const audio = new Audio(URL.createObjectURL(blob))
      audioRef.current = audio
      audio.onended = () => setState('idle')
      audio.onerror = () => setState('idle')
      setState('playing')
      await audio.play()
    } catch {
      // Real voices unavailable → degrade to the browser's built-in speech.
      speakWithBrowser()
    }
  }

  function toggle() {
    if (state === 'playing' || state === 'loading') {
      stop()
    } else {
      void play()
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state === 'playing' ? `Stop: ${label}` : label}
      aria-pressed={state === 'playing'}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-marigold/10 disabled:opacity-60 ${className}`}
    >
      <span aria-hidden="true">{state === 'playing' ? '⏹' : '🔊'}</span>
      {state === 'loading' ? 'Loading…' : state === 'playing' ? 'Stop' : 'Listen'}
    </button>
  )
}
