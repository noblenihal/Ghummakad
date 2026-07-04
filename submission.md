# Ghummakad — Submission

Copy-paste answers for each form field (each under the 1024-character limit).

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

Test login: `nihalgupta11213@gmail.com` / `hello1234` (or sign up — it's instant).

---

## Describe the changes/updates made in the deployed version

```
Ghummakad reimagines destination discovery: instead of a ranked list of tourist spots, you feel a place and meet the culture behind it. All live in the deployed app:

1. Vibe Search — describe the trip you're craving ("misty hills, monasteries, total quiet") → three real destinations matching the mood, each with a hook, why it fits you, best months, and a real photo fetched live.

2. Meet the Locals — enter any city and get introduced to local characters (an elder artisan, a market seller, a young guide). Each tells their first-person heritage story — with audio narration — and teaches you a local phrase you can hear spoken aloud.

3. Chat with a Local — ask them anything, they answer in character; conversations stay warmly scoped to travel and culture.

4. Weave Your Day — pick the experiences you love; Ghummakad weaves them into a day plan adapted to the city's real weather, sunrise and sunset.

5. What's Happening Right Now — real events in the next two weeks via Google Search grounding.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Google Gemini (gemini-2.5-flash) powers every intelligent feature in Ghummakad:

1. Vibe Search — Gemini reads the mood behind a free-text "vibe" and recommends real destinations matched to that feeling.

2. Meet the Locals — Gemini creates an authentic cast of locals for any city, writes each one's first-person heritage story grounded in real places and traditions, plus a genuine local phrase with transliteration.

3. Chat with a Local — a fully dynamic, in-character conversation, guardrailed to travel/culture topics only, no fabricated places.

4. Weave Your Day — Gemini composes chosen experiences into a narrated day plan, adapting to live weather, sunrise and sunset (Open-Meteo).

5. Live events — Gemini with Google Search grounding surfaces real, current events — verifiable, not hallucinated.

6. Real place photos — fetched live from Google Places / Wikipedia APIs.

Every response is generated live per request. Nothing canned, nothing mocked.
```

---

## How it solves the challenge

The brief asks for six things. Ghummakad answers each as a traveller experience, not a feature list:

- **Recommend attractions** → describe a mood, get real destinations that match it.
- **Uncover hidden gems** → local characters point you past the tourist traps.
- **Immersive storytelling** → first-person heritage stories, told in a local's voice.
- **Promote heritage** → every place comes with the story and culture behind it.
- **Suggest local events** → what's actually happening in the city this week.
- **Authentic cultural experiences** → learn a phrase, meet the people, live the day locals live.

---

## Technical notes (for reviewers)

- **Live, not mocked** — every result is a real Gemini call; nothing is hardcoded or cached to look real.
- **Stack** — Next.js (App Router, TypeScript) · Gemini (gemini-2.5-flash) called only from the server · self-hosted Supabase (Postgres + auth) · Docker + Caddy on a DigitalOcean droplet.
- **Solid by default** — real sign-in with per-user data isolation, input validation, unit tests, accessibility, and security headers. Secrets never reach the browser.
