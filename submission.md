# Ghummakad — Submission

Copy-paste answers for each form field. Every field is kept under the 1024-character limit.

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
`demo@ghummakad.app` / `ghummakad123`

---

## Describe the changes/updates made in the deployed version

```
First working version of Ghummakad — an AI "local friend" for destination discovery. Live features, fully working end-to-end (no static/mock data):

1. Auth — email/password signup & login via self-hosted Supabase (GoTrue). Every app page is gated behind a real session.
2. Vibe Search — user describes a mood ("misty hills, monasteries, total quiet"); a live Gemini call returns 3 real destinations with a hook, a why-it-fits reason, and best months. Output is structured JSON, validated with zod before rendering.

Stack: Next.js 14 (App Router, TypeScript strict) + Tailwind, Gemini called only from server route handlers, Supabase (Postgres + GoTrue + PostgREST) for auth/data with Row-Level Security, all in Docker Compose behind Caddy on a DigitalOcean droplet. Includes 15 passing unit tests, accessibility (labels, aria-live, focus rings), and security headers.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Google Gemini (model: gemini-2.5-flash), accessed via the @google/generative-ai SDK.

Where: called server-side only, in the Next.js route handler src/app/api/discover/route.ts (the "Vibe Search" feature). The user's free-text vibe is turned into a prompt (src/lib/prompts.ts) and sent to Gemini with a responseSchema so it returns structured JSON — a list of real destinations, each with a hook, a why-it-matches reason, and best months to visit. The response is validated with zod (src/lib/schemas.ts) before it reaches the UI. Every request makes a fresh, live Gemini call — nothing is cached or hardcoded. The API key stays on the server and is never exposed to the browser.
```
