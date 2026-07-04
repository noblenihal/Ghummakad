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
Ghummakad reimagines how travellers discover a place. Most trip apps hand you the same ranked list of tourist spots. Ghummakad helps you feel a destination and connect with its culture instead — which is the heart of this challenge.

In the live app, a traveller signs in and simply describes the trip they're craving, in their own words — "misty hills, monasteries, hot food and total quiet." Ghummakad instantly understands the mood and surfaces three real destinations that match it, each with a vivid hook, a personal reason it fits you, and the best time to go. No filters, no endless scrolling — you describe a feeling, and it responds.

This turns discovery from searching into a conversation. It's also the foundation for the fuller experience we're rolling out: meeting local characters, hearing their heritage stories, learning a phrase in their language, and building a day around the places locals genuinely love.
```

---

## Mention the Gen AI services utilized in the submission, and where did you utilize it?

```
Google Gemini is the intelligence behind Ghummakad.

Right now it powers discovery: a traveller types a free-text "vibe" and Gemini reads the mood behind it, then recommends real destinations matched to that feeling — each with a hook, a reason it suits the traveller, and the best time to visit. It runs live on every request, so every recommendation is genuinely generated, never a canned list.

Coming next on the same Gemini engine: local characters who tell their own heritage stories, chat with you in character, teach you a phrase, and surface real cultural events happening this week — turning Gemini into a whole cast of local guides you can actually talk to.

(Implementation details are in the Technical notes below.)
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
