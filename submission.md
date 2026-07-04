# Ghummakad — Submission

Copy-paste answers for each form field (each kept under the 1024-character limit),
followed by the product plan we're building toward.

---

## Public GitHub Repository Link

```
https://github.com/noblenihal/Ghummakad
```

---

## Deployed Link

```
http://168.144.24.204:8081
```

Test credentials (signup is also open, accounts auto-confirm):
`nihalgupta11213@gmail.com` / `hello1234`

---

## Describe the changes/updates made in the deployed version

```
Ghummakad is a full-stack GenAI travel companion for the Destination Discovery & Cultural Experiences challenge. Its philosophy: don't hand travellers a list of places — help them feel a destination and meet the culture behind it.

The deployed app works end-to-end with no static or mock data. A visitor signs up or logs in (real self-hosted Supabase auth), lands in a gated workspace under the Ghummakad brand, and uses Vibe Search: they describe a mood in plain language ("misty hills, monasteries, total quiet") and a live Gemini call returns three real, matched destinations — each with a vivid hook, a reason it fits that specific vibe, and the best months to visit. Output is structured JSON, schema-validated before display.

Stack: Next.js 14 (TypeScript, App Router), Gemini called only server-side, Supabase (Postgres + GoTrue + PostgREST) with row-level security, all Dockerised behind Caddy on a DigitalOcean droplet. Ships with unit tests, accessibility, and security headers.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Google Gemini (gemini-2.5-flash) via the @google/generative-ai SDK is the core Gen AI engine, and it powers every intelligent output in the app.

Where it runs today: server-side only, inside the Next.js route handler src/app/api/discover/route.ts (the "Vibe Search" feature). The user's free-text vibe is composed into a prompt (src/lib/prompts.ts) and sent to Gemini with a responseSchema, so the model returns clean structured JSON — a set of real destinations, each with a hook, a why-it-fits reason, and best months. The response is validated with zod (src/lib/schemas.ts) before it reaches the UI. Every request triggers a fresh, live model call; nothing is cached or hardcoded, and the API key never leaves the server.

Rolling out next on the same Gemini engine + Google APIs: live-generated local personas and first-person heritage stories, in-character chat, a learn-a-phrase panel, real events via Google Search grounding, Imagen persona faces, and Cloud Text-to-Speech greetings.
```

---

## Product plan — "Meet the Locals" (what we're building into Ghummakad)

> **Core insight:** Don't hand travellers a list of places — introduce them to the *people* who
> live there. A small cast of local personas delivers storytelling, heritage, and "engage with
> locals" at once, then their recommendations power discovery.

Each feature maps to a challenge-rubric word:

| # | Feature | What it does | Rubric hit |
|---|---|---|---|
| 1 | Meet the Locals | Live-generated local personas (elder, artisan, young guide) | engage with locals |
| 2 | First-person stories | Each local tells their heritage story in character | storytelling + heritage |
| 3 | Spoken greeting | Tap a face → a short voice line (Cloud TTS / browser speech) | live the experience |
| 4 | Learn a phrase | Local phrase → transliteration → English, with audio | culture + engage |
| 5 | Experience cards | Places each local recommends, with **real photos** (Places → Wikipedia → gradient) | discover culture |
| 6 | Swipe → itinerary | Swipe the pooled picks → a weather-aware, geo-clustered day plan | live the experience |
| 7 | Live events strip | Real festivals/events now, via Gemini + Google Search grounding | suggest local events |
| — | Vibe Search *(shipped)* | Describe a mood → 3 matched real destinations | recommend attractions |

**Delivery is phased, and every deployed feature makes a real Gemini/API call** (per the
organizers' "no static/mock/canned output" disqualification rule). Flaky features are cut, not
faked. Full technical plan lives in `PLAN.md` (ideas + practical steps in `discover-mode/PLAN.md`).

### Judging-rubric coverage (all six, from v1)
- **Code Quality** — TypeScript strict, modules split (prompts/schemas/gemini/verify), ESLint + jsx-a11y.
- **Security** — keys server-only, Supabase RLS (users see only their own data), zod on every input, security headers, generic auth errors.
- **Efficiency** — gemini-2.5-flash, Next.js standalone build, small Alpine runtime.
- **Testing** — Vitest unit tests for schemas, prompt builders, auth-token verification.
- **Accessibility** — semantic landmarks, labelled inputs, aria-live regions, visible focus rings.
- **Problem Statement Alignment** — README + this file open with the brief and map each requirement → feature → file.
```
