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

1. Vibe Search — describe the trip you're craving ("misty hills, monasteries, total quiet") → three real destinations matching the mood, with a hook, why it fits you, best months, and a real photo.

2. Meet the Locals — any city introduces you to local characters. Each tells their first-person heritage story — narrated in a natural accented voice — and teaches a local phrase you can hear pronounced.

3. Chat with a Local — ask anything; they answer in character, warmly scoped to travel and culture.

4. Photo Lens — upload a photo of any monument; it's identified and its story, a fun fact, and a nearby hidden gem come back.

5. Weave Your Day — pick experiences you love; they're woven into a day plan adapted to the city's real weather, sunrise and sunset.

6. What's Happening Right Now — real events in the next two weeks via Google Search grounding.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Ghummakad uses five distinct Gemini capabilities:

1. Text + structured output (gemini-2.5-flash) — Vibe Search destination matching, local characters & their heritage stories, and weather-adaptive day plans (live Open-Meteo weather fed into the prompt).

2. In-character chat — fully dynamic conversations with each local, guardrailed to travel/culture topics, no fabricated places.

3. Vision (multimodal) — Photo Lens: upload a monument photo, Gemini identifies it and tells its story, a fun fact, and a nearby hidden gem.

4. Google Search grounding — real, current cultural events for any city, verifiable rather than hallucinated.

5. Native text-to-speech (gemini-2.5-flash-preview-tts) — stories narrated in warm accented voices and local phrases pronounced like a native speaker.

Plus live place photos from Google Places / Wikipedia APIs. Every response is generated live per request. Nothing canned, nothing mocked.
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
