# AGENTS.md — how to explore Ghummakad (for LLMs & coding agents)

Ghummakad is a GenAI travel-discovery app (Google PromptWars hackathon: *Destination
Discovery & Cultural Experiences*). One rule governs everything: **every user-facing
result comes from a live API call at request time — no mock data, no canned AI output.**
Keep that invariant when you change anything.

## What the app does

Signed-in travellers get three live features (all on the single workspace page `/app`):

1. **Vibe Search** — free-text mood → Gemini returns up to 3 real destinations
   (hook, why-it-matches, best months) + a real photo of each place.
2. **Meet the Locals** — a city → Gemini creates 3 authentic local characters, each
   with a greeting, a first-person heritage story, and a local-language phrase
   (script + transliteration + meaning).
3. **What's Happening Right Now** — a city → real events in the next 14 days via
   Gemini with Google Search grounding.

Live deployment: `http://168.144.24.204:8081` (Docker Compose on a DigitalOcean
droplet). Test login: `nihalgupta11213@gmail.com` / `hello1234`.

## Architecture in one paragraph

Next.js 14 App Router (TypeScript strict) + Tailwind. The browser talks to Next.js
route handlers under `src/app/api/*`; only the server calls Gemini
(`gemini-2.5-flash` via `@google/generative-ai`). Auth and data are self-hosted
Supabase (Postgres 16 + GoTrue + PostgREST) running as sibling containers; Caddy
serves the app and the Supabase endpoints (`/auth/v1`, `/rest/v1`) from one origin.
The client holds a Supabase session and sends its JWT as `Authorization: Bearer` to
the app's APIs; the server verifies it with the service-role key
(`src/lib/supabase/verify.ts`).

## Code map (read in this order)

| Path | What it is |
|---|---|
| `src/lib/gemini.ts` | Gemini client: one `GenerativeModel` per response schema, `generateJson(prompt, schema)` |
| `src/lib/schemas.ts` | Vibe Search zod schemas + Gemini `ResponseSchema` (SchemaType enum) |
| `src/lib/prompts.ts` | Vibe Search prompt builder |
| `src/lib/features/locals.ts` | Meet-the-Locals: zod + Gemini schema + prompt builder |
| `src/lib/features/events.ts` | Events: zod schemas, grounded REST call (`tools: [{ google_search: {} }]`), `parseEventsText` |
| `src/lib/features/photo.ts` | `resolvePhoto`: Places API (only if `GOOGLE_CLOUD_KEY` set) → Wikipedia REST → `null` |
| `src/lib/ttl-cache.ts` | Small TTL cache reused by all features (real results only) |
| `src/lib/supabase/browser.ts` / `verify.ts` | Browser client / server-side bearer-token verification |
| `src/app/api/{discover,locals,events}/route.ts` | Auth-gated POST handlers, all follow the same shape: verify → zod body → cache → Gemini → zod response |
| `src/app/api/photo/route.ts` | Public GET (`?q=`) — images aren't sensitive; returns `{ url: null }` on miss |
| `src/app/app/page.tsx` | Authenticated workspace shell; composes the three feature sections |
| `src/components/*Section.tsx`, `PlacePhoto.tsx`, `AuthForm.tsx` | One component per feature; `PlacePhoto` renders a gradient when no real photo exists |
| `docker-compose.yml`, `Dockerfile`, `caddy/Caddyfile`, `supabase/`, `scripts/` | Deploy stack (see README "Deploy") |

Conventions: strict TS (`noUncheckedIndexedAccess`), zod-validate every input **and**
every Gemini response, feature logic lives in `src/lib/features/<name>.ts` with a
colocated `<name>.test.ts`, UI in a matching `src/components/<Name>Section.tsx`.

## Run & verify (all commands work from the repo root)

```bash
npm install
npm test          # vitest — 52 tests across 7 files, all green
npm run lint      # next lint + jsx-a11y
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8081 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npm run build
npm run dev       # needs a real .env.local (see .env.example) to actually sign in
```

Secrets live in `.env.local` (gitignored; template in `.env.example`; generate
Supabase keys with `node scripts/gen-keys.mjs`). `GEMINI_API_KEY` is required for the
AI routes; `GOOGLE_CLOUD_KEY` is optional (better photos via Places API).

## Exercising the live APIs

`/api/photo` is public: `GET /api/photo?q=Hawa%20Mahal,%20Jaipur` → `{ url, source }`.
The other APIs need a Supabase JWT: sign in via the UI, or POST
`{email, password}` to `/auth/v1/token?grant_type=password` with an `apikey` header
(the anon key baked into the deployed site), then call e.g.
`POST /api/locals` with `Authorization: Bearer <access_token>` and body `{"city":"Jaipur"}`.

Photo-query tip: pass `"Name, Region"` **with the comma** — on a Wikipedia 404 the
resolver retries with everything before the first comma.

## Other docs

- `README.md` — quickstart, deploy steps, rubric notes
- `PLAN.md` — product plan and scoring strategy
- `FEATURES.md` — feature tracker (what's live vs. planned) and how to test each
- `submission.md` — hackathon submission answers
