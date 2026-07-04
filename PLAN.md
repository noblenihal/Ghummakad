# Ghummakad — घुमक्कड़
### "Travel like a wanderer, not a tourist."

**Challenge:** Destination Discovery & Cultural Experiences (PromptWars · Google for Developers · Build with AI)

---

## 1. The Idea

Every travel app answers *"where should I go?"* with the same top-10 lists. **Ghummakad** answers a different question: *"what will I feel there?"*

Ghummakad is an AI **local friend** — not a search engine. For any destination, it gives you a chatty, opinionated local companion (a chaiwala in Varanasi, a fisherman in Kochi, an auto-driver in Jaipur) who tells you stories, steers you away from tourist traps toward hidden gems, and connects you to what's *actually happening* in the city this week.

### Why this wins the challenge rubric
The brief demands 6 things; each maps to a concrete feature:

| Brief requirement | Ghummakad feature |
|---|---|
| Recommend attractions | **Vibe Search** — describe a mood ("slow mornings, old bazaars, no crowds"), get matched destinations |
| Uncover hidden gems | **"Skip This, Do This"** — for every famous spot, a local-approved alternative |
| Immersive storytelling | **Katha Mode** — monument/place → legend, history & folklore narrated aloud (TTS) |
| Promote heritage | **Photo Lens** — upload a photo of any monument → Gemini Vision identifies it and tells its story |
| Suggest local events | **Cultural Calendar** — festivals, melas, performances near your dates (Gemini + Google Search grounding) |
| Authentic cultural experiences | **Meet the Culture** — craft workshops, home-cooked food trails, folk performances woven into a day plan |

### The demo moment (what judges remember)
Upload a photo of a random temple → Ghummakad identifies it, a local character *speaks* its 400-year-old legend aloud, then says *"…and if you liked this, skip the queue at X — walk 10 minutes to Y instead, and Thursday there's a folk night nearby."* Discovery → story → gem → event, in one flow.

---

## 2. Product Scope (hackathon cut)

One Next.js web app, 6 screens:

0. **Auth** — `/login` and `/signup`. Sign in with **Google** (OAuth) or **email + password**. A signed-in user gets a lightweight profile so their trips/personas can be saved (see below). Everything past auth is gated.
1. **Home / Vibe Search** — free-text mood input OR pick a destination. Returns 3 destination cards (image, one-line hook, "why it matches your vibe").
2. **Destination page** — the core screen:
   - **Local Guide chat** (persona-driven, streams responses)
   - **Hidden Gems** list with "Skip This → Do This" pairs
   - **Cultural Calendar** (events near selected dates, grounded via Google Search)
   - **Experiences** (workshops, food trails, performances)
3. **Katha Mode** — pick a place or **upload a photo** → story card + play-audio button (browser SpeechSynthesis; zero extra API cost).
4. **Day Weaver** — one-tap itinerary that threads gems + experiences + events into a narrated day plan.

**Why auth earns its keep (not just a gate):** a logged-in user's Vibe Search results and woven day plans are **saved to their account** ("My Trips") — so auth is load-bearing, not decoration. Signed-out users hit `/login`.

Out of scope (say so in the pitch): bookings, payments, offline mode.

---

## 3. Architecture

```
Next.js 14 (App Router, TypeScript, Tailwind)
│
├── middleware.ts             # Auth.js — protects app routes, redirects to /login
├── app/(auth)/               # /login, /signup (public)
├── app/(app)/                # gated screens: home, destination, katha, weaver, my-trips
├── app/api/
│   ├── auth/[...nextauth]/    # Auth.js handler (Google OAuth + Credentials)
│   ├── signup/route.ts        # create user: zod-validate, bcrypt-hash, store
│   ├── discover/route.ts      # Vibe Search → structured JSON (destination cards)
│   ├── guide/route.ts         # Local Guide chat → streaming, persona system prompt
│   ├── gems/route.ts          # Hidden gems + skip/do pairs → structured JSON
│   ├── events/route.ts        # Cultural Calendar → Gemini + googleSearch grounding tool
│   ├── katha/route.ts         # Story gen (text or image input → Gemini multimodal)
│   ├── weave/route.ts         # Day Weaver itinerary
│   └── trips/route.ts         # save/list a user's trips (owner-scoped)
│
├── Auth.js v5 (NextAuth)      # Google provider + Credentials provider
│   └── Prisma adapter → SQLite (dev.db)   # User, Account, Session, Trip
│       └── bcrypt for password hashing
│
└── Gemini API (@google/genai SDK)
    ├── gemini-2.5-flash      # everything (fast + cheap, multimodal, grounding)
    ├── responseSchema        # structured JSON → clean UI cards, no parsing hacks
    └── googleSearch tool     # real, current events — not hallucinated ones
```

**Gemini features showcased (matters at a Google event):** multimodal image input, Google Search grounding, structured output, streaming chat with system-instruction personas. Four distinct API capabilities, not just "we called an LLM."

**Auth stack rationale:** Auth.js is the Next.js-native choice and gives Google OAuth *and* email/password from one library. Prisma + SQLite is a **real database** (file-based, zero infra) — credentials and saved trips persist for real, so this is not mock data. Passwords are bcrypt-hashed; sessions are JWT. For deploy, swap SQLite → hosted Postgres (Neon) by changing one Prisma datasource URL.

**Secrets in `.env.local` (gitignored):** `GEMINI_API_KEY`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`. A `.env.example` (committed, no values) documents them.

---

## 4. Scoring Strategy (the judge is a code scanner)

We are scored on: **Code Quality · Security · Efficiency · Testing · Accessibility · Problem Statement Alignment.** Testing and Accessibility are where teams bleed points (sample scorecard: 0 and 45) — so we treat them as features, not chores.

| Dimension | How we max it |
|---|---|
| **Code Quality** | TypeScript strict mode, ESLint + Prettier, small single-purpose modules, no dead code, typed API contracts shared between routes and UI, meaningful names |
| **Security** | Gemini key only in server route handlers (never `NEXT_PUBLIC_`), `.env.local` gitignored, zod validation on every API input, file-type/size limits on photo upload, no `dangerouslySetInnerHTML`, security headers in `next.config`. **Auth: bcrypt password hashing (never plaintext), `AUTH_SECRET` set, OAuth secrets server-side only, middleware-gated routes, trips owner-scoped (a user can't read another's data), generic "invalid credentials" errors (no user-enumeration)** |
| **Efficiency** | `gemini-2.5-flash`, streaming responses, `next/image`, route-level code splitting, in-memory response cache for repeated destination queries, no client-side waterfalls |
| **Testing** | **Vitest + React Testing Library from Phase 1, not the end.** Unit tests for prompt builders, zod schemas, and utils; component tests for cards/chat; API route tests with mocked Gemini client. Target: every `lib/` module and API route has a test file. `npm test` green in CI-able state |
| **Accessibility** | Semantic landmarks (`main/nav/section`), labels on every input, alt text on all images, visible focus rings, keyboard-navigable chat and cards, `aria-live` for streaming responses, WCAG-AA contrast in the palette, `eslint-plugin-jsx-a11y` on from day one — Katha's audio narration is itself an a11y feature (say so in README) |
| **Alignment** | README opens with the problem statement verbatim, then maps each of the 6 brief requirements to a feature + file path (reuse the table in §1) |

## 5. Build Plan

| Phase | What | Time |
|---|---|---|
| 0 | Scaffold Next.js + TS strict + Tailwind, ESLint (+jsx-a11y) + Prettier, **Vitest wired**, .env.local + .env.example, typed Gemini client util, README skeleton with alignment table | 45 min |
| 0.5 | **Auth**: Prisma + SQLite schema (User/Account/Session/Trip), Auth.js v5 with Google + Credentials providers, bcrypt signup route, `/login` + `/signup` pages (a11y forms), `middleware.ts` gating, session in header with sign-out. Tests: signup validation, bcrypt hash/verify, route guard | 1.5 hr |
| 1 | `discover` + `gems` APIs with zod + responseSchema → Home + Destination page cards. Tests for schemas, prompt builders, both routes | 1.5 hr |
| 2 | Local Guide streaming chat with persona prompts, `aria-live` regions, keyboard nav. Chat component test | 1 hr |
| 3 | Katha Mode: photo upload (validated) → Gemini Vision → story + SpeechSynthesis audio. Upload-validation tests | 1 hr |
| 4 | Cultural Calendar with Search grounding + Day Weaver + **My Trips** (save/list, owner-scoped). Route tests | 1.5 hr |
| 5 | Score sweep: a11y audit (Lighthouse/axe), security headers, coverage gaps, loading skeletons, mobile layout, README final + **test credentials**, **pre-submission gauntlet (below)** | 1 hr |

**~8 hours** to demo-ready. Auth (0.5) + Phases 1–3 are a complete pitch if time runs short — 4 and 5 are upgrades, not dependencies. Tests and a11y ride along in every phase so the scanner never catches us at 0.

### Risk cuts — DQ-safe versions
**Hard rule (from organizers): no static pages, no mock/seeded data, no canned AI responses, no features that only look like they work. Every demoed feature must make a real, working Gemini call end-to-end. If a feature is flaky, we CUT it — we never fake it.**

- Grounding flaky at venue → drop the Cultural Calendar feature entirely rather than serve cached events; the other 5 features still cover the brief.
- Photo ID wrong on obscure monuments → demo with 2–3 pre-tested *photos* (real Gemini call every time — choosing a reliable input is fine, canning the output is not).
- Slow wifi → keep a mobile hotspot ready; show honest loading states, never pre-rendered "results."
- **Auth is in scope → the DQ slide requires sharing test credentials.** README ships a working demo account (e.g. `demo@ghummakad.app` / a real password that exists in the seeded DB) AND the Google login path. Both must actually work end-to-end. Seed the demo user via a `prisma db seed` script so a fresh clone has a real, loginable account — this is a *real* row in the DB, not mock data.
- Google OAuth needs the deploy URL in the authorized redirect URIs — set this before submission, or the Google button silently fails (a false positive). If OAuth can't be configured for the demo host in time, keep email/password (which needs no external console) as the guaranteed path and only show the Google button once its redirect is verified.

### Pre-submission gauntlet (organizers will hands-on test every feature)
1. Fresh clone → `npm install && npm run build && npm start` must work with only `.env.local`.
2. Click through every visible feature as a hostile evaluator: anything that errors or returns a dud gets fixed or **removed from the UI** before submission (a broken visible feature = false positive = DQ).
3. Verify in the network tab that each feature fires a live `/api/*` call and each API hits Gemini — no code path returns hardcoded content.
4. README feature list must match exactly what runs — never list more than works.
5. **Auth walkthrough**: log in with the shared demo credentials AND with Google, confirm gated pages redirect when signed out, confirm "My Trips" saves and reloads. README's test-credentials block must be current.

---

## 6. Pitch line

> "Google Maps tells you where things are. Ghummakad tells you why they matter — and what the locals would do instead."
