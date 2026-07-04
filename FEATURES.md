# Ghummakad — Feature Tracker

Shared checklist so we both know what's built, what's live, and what needs your testing.
Live app: **http://168.144.24.204:8081** · Login: `nihalgupta11213@gmail.com` / `hello1234`

**Legend:** ✅ live & ready to test · 🧪 built, needs your test · 🔨 building now · ⬜ planned

---

## Live now — please test

| # | Feature | Status | How to test | Your feedback |
|---|---------|--------|-------------|---------------|
| 1 | **Sign up / Log in** | ✅ | Go to the app → sign up or use the test login. You should land in the workspace. | |
| 2 | **Auth gating** | ✅ | Open `/app` in a private window (logged out) → should bounce you to `/login`. | |
| 3 | **Vibe Search** | ✅ | In the workspace, type a mood ("misty hills, monasteries, hot food, quiet") → 3 real destinations with a hook + reason + best months. | |
| 4 | **Sign out** | ✅ | Click sign out → returns to landing; `/app` locked again. | |
| 5 | **Ghummakad branding** (logo + favicon) | 🧪 | Logo on landing + workspace header, favicon in the browser tab. | |
| 6 | **Meet the Locals** | 🧪 | In the workspace, "Meet the locals": enter a city (Jaipur) → "Introduce me" → 3 local characters with emoji avatars, name/age/trade, greeting. | |
| 7 | **First-person heritage story** | 🧪 | Tap a local's card → it expands with their personal story + a "Say it like a local" phrase (local script + transliteration + meaning). | |
| 10 | **Real photos on destination cards** | 🧪 | Run a Vibe Search → each destination card should show a real photo (Wikipedia/Places), or a clean gradient if none exists. | |
| 12 | **Live events strip** | 🧪 | "What's happening right now": enter a city → real festivals/events in the next 2 weeks, found via Google Search grounding. | |

## Building next

| # | Feature | Status | What it does | Needs testing when done |
|---|---------|--------|--------------|--------------------------|
| 8 | **Spoken greeting / narration** | ⬜ | A local greets you aloud (browser voice; Cloud TTS later). | Audio plays, sounds right |
| 9 | **Learn a phrase — audio** | ⬜ | Hear the phrase spoken (text version already live in #7). | Audio correct |
| 11 | **Swipe → itinerary** | ⬜ | Swipe the picks → a weather-aware day plan. | Day plan makes sense |

## Under the hood (done, affects the score)

| Area | Status | Notes |
|------|--------|-------|
| Efficiency: model reuse + token cap + repeat-query cache | 🧪 | Deploying now — repeat searches return instantly. |
| Testing: 19 unit tests | ✅ | `npm test` green. |
| Security: server-only keys, RLS, zod, headers | ✅ | Scored 99. |
| Accessibility: labels, aria-live, focus rings | ✅ | Scored 96. |

---

## Score watch 🎯

- Current: **92.83** · Highest competitor: **98** → target: **beat 98**.
- Lowest bars: **Efficiency (80)**, **Code Quality (88)** → both just improved (deploying).
- Biggest remaining lever: shipping features 6–12 raises **Problem Statement Alignment** and overall
  impact — the app visibly solves all six parts of the brief, not just one.

_How to give feedback: drop notes in the "Your feedback" column or just tell me per number (e.g. "#3 results felt generic")._
