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
Ghummakad reimagines destination discovery. Trip apps hand you a ranked list of tourist spots; Ghummakad helps you feel a place and meet the culture behind it. Everything below is live in the deployed app:

1. Vibe Search — describe the trip you're craving in your own words ("misty hills, monasteries, total quiet") and get three real destinations that match the mood, each with a hook, why it fits you, best months — and a real photo of the place fetched live.

2. Meet the Locals — enter any city and be introduced to a cast of local characters: an elder artisan, a market seller, a young guide. Each greets you and tells their own first-person heritage story, rich with the city's real places and traditions — plus a phrase in the local language with pronunciation and meaning, so you can "say it like a local."

3. What's Happening Right Now — real festivals, fairs and performances in the city over the next two weeks, found live with Google Search grounding.

All behind real sign-in, in a clean branded experience.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Google Gemini (gemini-2.5-flash) is the intelligence behind every feature of Ghummakad:

1. Vibe Search — Gemini reads the mood behind a traveller's free-text "vibe" and recommends real destinations matched to that feeling, with a hook, a personal why-it-fits, and the best time to go.

2. Meet the Locals — Gemini creates an authentic cast of local characters for any city and writes each one's first-person heritage story, grounded in the city's real places, crafts and traditions — plus a genuine local-language phrase with transliteration and meaning.

3. Live events — Gemini with Google Search grounding finds real festivals, fairs and performances happening in the city in the next two weeks, so events are current and verifiable, not hallucinated.

4. Real place photos — destination cards fetch live images of each recommended place from public photo APIs (Google Places / Wikipedia).

Every response is generated live on request — nothing canned, nothing mocked.
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
