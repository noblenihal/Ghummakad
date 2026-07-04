import Link from 'next/link'
import Image from 'next/image'
import VibeCycle from '@/components/VibeCycle'

const STAMPS = [
  { emoji: '🧑‍🎨', title: 'Meet the locals', note: 'characters who carry the city' },
  { emoji: '📻', title: 'Hear their stories', note: 'heritage, told first-person' },
  { emoji: '🗺️', title: 'Weave your day', note: 'a plan shaped by real weather' },
]

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* घुमक्कड़ as texture — the wanderer watermark behind everything. */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 select-none font-hindi text-[11rem] leading-none text-henna/[0.07] sm:text-[16rem] lg:text-[22rem]"
      >
        घुमक्कड़
      </p>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="postmark inline-flex p-1">
              <Image src="/logo.png" alt="" width={44} height={44} className="rounded-full" />
            </span>
            <span className="font-display text-xl font-bold text-ink">Ghummakad</span>
          </span>
          <Link
            href="/login"
            className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
          >
            Sign in
          </Link>
        </header>

        {/* Hero */}
        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="rise-in font-mono text-xs uppercase tracking-[0.35em] text-henna">
            घुमक्कड़ · one who wanders
          </p>
          <h1 className="rise-in mt-4 max-w-3xl font-display text-5xl font-black leading-[1.05] text-ink sm:text-7xl">
            Travel by feeling,
            <br />
            not by checklist.
          </h1>
          <p className="rise-in-delayed mt-6 min-h-[2.5rem] max-w-2xl text-2xl text-ink/80 sm:text-3xl">
            <VibeCycle />
          </p>
          <p className="rise-in-delayed mt-4 max-w-xl text-lg text-ink/70">
            Tell Ghummakad what you&apos;re chasing. Meet the people who live there, hear their
            stories, and build a day around the places they actually love.
          </p>
          <div className="rise-in-delayed mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-marigold px-7 py-3.5 font-semibold text-ink shadow-sm transition hover:bg-marigold/90"
            >
              Start wandering
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ink/20 px-7 py-3.5 font-semibold text-ink transition hover:bg-ink/5"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Stamp row — what's inside, as postage stamps */}
        <section aria-label="What Ghummakad does" className="grid gap-4 pb-10 sm:grid-cols-3">
          {STAMPS.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border-2 border-dashed border-ink/20 bg-white/70 p-4"
            >
              <p className="text-2xl" aria-hidden="true">
                {s.emoji}
              </p>
              <p className="mt-2 font-display text-lg font-bold text-ink">{s.title}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{s.note}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-ink/10 pb-2 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Powered by Gemini · every story, voice and plan is generated live
          </p>
        </footer>
      </div>
    </main>
  )
}
