import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <Image src="/logo.png" alt="Ghummakad logo" width={96} height={96} priority className="mb-4 rounded-2xl" />
      <p className="font-display text-sm uppercase tracking-[0.3em] text-henna">घुमक्कड़ · Travel &amp; Explore</p>
      <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-ink sm:text-6xl">
        Ghummakad
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink/80">
        Travel like a wanderer, not a tourist. Describe the <em>feeling</em> you are chasing and an
        AI local friend points you to places — real ones — that match your vibe.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-marigold px-6 py-3 font-semibold text-ink shadow-sm transition hover:bg-marigold/90"
        >
          Start wandering
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-ink/20 px-6 py-3 font-semibold text-ink transition hover:bg-ink/5"
        >
          I already have an account
        </Link>
      </div>
      <p className="mt-10 text-sm text-ink/60">
        Powered by Gemini · every suggestion is generated live, nothing is pre-canned.
      </p>
    </main>
  )
}
