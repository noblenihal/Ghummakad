'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase/browser'
import VibeSearchSection from '@/components/VibeSearchSection'
import LocalsSection from '@/components/LocalsSection'
import EventsSection from '@/components/EventsSection'
import DayWeaverSection from '@/components/DayWeaverSection'

type Status = 'checking' | 'ready'

// Thin authenticated shell: session check + header + feature sections. Each
// feature lives in its own component and receives getToken to call the APIs.
export default function AppPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace('/login')
          return
        }
        setEmail(data.session.user.email ?? null)
        setStatus('ready')
      })
  }, [router])

  const getToken = useCallback(async () => {
    const { data } = await supabaseBrowser().auth.getSession()
    return data.session?.access_token ?? null
  }, [])

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
        <span className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded" />
          <span className="font-display text-lg font-bold text-ink">Ghummakad</span>
        </span>
        <div className="flex items-center gap-4 text-sm">
          {email && <span className="hidden text-ink/60 sm:inline">{email}</span>}
          <button onClick={signOut} className="font-semibold text-indigo underline">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-16 px-6 py-10">
        <VibeSearchSection getToken={getToken} />
        <LocalsSection getToken={getToken} />
        <DayWeaverSection getToken={getToken} />
        <EventsSection getToken={getToken} />
      </main>
    </div>
  )
}
