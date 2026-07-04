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
Every travel app answers "where should I go?" with the same top-10 list. Ghummakad answers a different question: what do you want to feel? This version ships that full experience, working end-to-end.

Describe a feeling — "misty hills, monasteries, quiet" — and three real destinations appear, with real photos and why each fits YOU. Enter any city and meet its people: an elder artisan, a market seller, a young guide — each telling their own heritage story aloud in a warm accented voice, and teaching you a phrase pronounced like a native. Ask them anything — where they actually eat, what's worth skipping — and they answer in character. Upload a photo of a monument and it tells you its story, a fun fact, and the hidden gem nearby. Pick the experiences you love and they're woven into a day plan built around the city's real weather and sunset. Then see what's actually happening in town these two weeks — real events, not guesses.

Discovery → people → stories → a lived day: the entire challenge brief in one flow.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Gemini isn't a feature in Ghummakad — it is the product. Five of its capabilities work together:

1. Structured text (gemini-2.5-flash) turns a traveller's mood into real matched destinations, invents each city's authentic local characters and their first-person heritage stories, and weaves chosen experiences into a day plan adapted to live weather (Open-Meteo fed into the prompt).

2. In-character chat lets you actually talk to those locals — dynamic answers to any question, guardrailed to travel and culture, never inventing places.

3. Vision (multimodal) reads your monument photo: identifies it, tells its story, a fun fact, and the hidden gem nearby.

4. Google Search grounding pulls real, current events for any city — verifiable, never hallucinated.

5. Native text-to-speech (gemini-2.5-flash-preview-tts) gives every local a warm accented voice and pronounces phrases like a native speaker.

Place photos stream live from Google Places/Wikipedia. Everything is generated at request time — nothing canned or mocked.
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
