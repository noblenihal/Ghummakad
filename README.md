# Ghummakad — घुमक्कड़

**Travel like a wanderer, not a tourist.** An AI *local friend* that helps travellers
discover destinations and cultural experiences that match a feeling — not a checklist.

> **Challenge (Destination Discovery & Cultural Experiences):** Build a GenAI-powered
> platform that helps travellers discover destinations and engage with local culture in
> meaningful ways. The solution must use Generative AI to recommend attractions, uncover
> hidden gems, generate immersive storytelling, promote heritage, suggest local events,
> and connect visitors with authentic cultural experiences.

## Live demo

- **URL:** http://168.144.24.204:8081
- **Test credentials:** `nihalgupta11213@gmail.com` / `hello1234`
  (or create your own account — signup is open and accounts are auto-confirmed)

## What works today (v1)

This first version is intentionally small but **fully real end-to-end** — no static pages,
no mock data, no canned AI responses:

- **Auth** — email/password signup & login via self-hosted Supabase (GoTrue). Every app
  page is gated behind a real session.
- **Vibe Search** — describe a mood; a **live Gemini call** returns real destinations with
  a hook, a why-it-fits reason, and best months. Structured output validated with zod.

## Problem-statement alignment

The challenge asks for six capabilities. v1 ships the first; the rest are scaffolded on the
same architecture (see `PLAN.md`).

| Requirement | Feature | Where | Status |
|---|---|---|---|
| Recommend attractions | Vibe Search | `src/app/api/discover/route.ts` | ✅ live |
| Uncover hidden gems | "Skip This, Do This" | `PLAN.md` | planned |
| Immersive storytelling | Katha Mode (TTS) | `PLAN.md` | planned |
| Promote heritage | Photo Lens (Gemini Vision) | `PLAN.md` | planned |
| Suggest local events | Cultural Calendar (Search grounding) | `PLAN.md` | planned |
| Authentic experiences | Day Weaver | `PLAN.md` | planned |

## How we score on the judging rubric

- **Code Quality** — TypeScript strict (`noUncheckedIndexedAccess`), ESLint + jsx-a11y,
  small single-purpose modules, prompt/schema logic split out of routes.
- **Security** — Gemini key server-only, service-role key never in the client bundle,
  password hashing handled by GoTrue, zod validation on every API input, RLS so a user
  can only read their own data, security headers in `next.config.mjs`, generic auth errors.
- **Efficiency** — `gemini-2.5-flash`, Next.js standalone output, small Alpine runtime image.
- **Testing** — Vitest unit tests for schemas, prompt builders, and auth-token verification.
  Run `npm test`.
- **Accessibility** — semantic landmarks, labelled inputs, `aria-live` result region,
  visible focus rings, `lang` set, WCAG-minded palette.
- **Problem Statement Alignment** — this README opens with the brief verbatim and maps each
  requirement to a feature and file.

## Architecture

Next.js 14 (App Router, TS, Tailwind) → server route handlers call Gemini. Auth & data via
self-hosted Supabase (Postgres + GoTrue + PostgREST) behind Caddy, all in Docker Compose on
a DigitalOcean droplet. Caddy serves `/auth/v1` and `/rest/v1` from the same origin as the
app, so the app URL *is* the Supabase URL.

## Run locally

```bash
npm install
cp .env.example .env.local        # fill in; generate secrets with: node scripts/gen-keys.mjs
npm run dev                       # http://localhost:3000
npm test                          # unit tests
```

## Deploy (DigitalOcean droplet)

```bash
rsync -az --exclude node_modules --exclude .next ./ root@<droplet>:/opt/ghummakad/
scp .env.local root@<droplet>:/opt/ghummakad/.env.local
ssh root@<droplet> 'bash /opt/ghummakad/scripts/setup-droplet.sh'
```
