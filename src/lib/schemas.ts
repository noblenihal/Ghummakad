import { z } from 'zod'

// ── Vibe Search ────────────────────────────────────────────────────────────
// Request the user sends, and the shape we require back from Gemini.

export const discoverRequestSchema = z.object({
  vibe: z.string().trim().min(3, 'Tell us a little more about the vibe.').max(300),
})
export type DiscoverRequest = z.infer<typeof discoverRequestSchema>

export const destinationSchema = z.object({
  name: z.string(),
  region: z.string(),
  hook: z.string(),
  whyItMatches: z.string(),
  bestMonths: z.string(),
})
export type Destination = z.infer<typeof destinationSchema>

export const discoverResponseSchema = z.object({
  destinations: z.array(destinationSchema).min(1).max(3),
})
export type DiscoverResponse = z.infer<typeof discoverResponseSchema>

// Gemini responseSchema (JSON-Schema-ish subset the SDK accepts). Kept in sync
// with `destinationSchema` above by the route's zod parse.
export const discoverGeminiSchema = {
  type: 'object',
  properties: {
    destinations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          region: { type: 'string' },
          hook: { type: 'string' },
          whyItMatches: { type: 'string' },
          bestMonths: { type: 'string' },
        },
        required: ['name', 'region', 'hook', 'whyItMatches', 'bestMonths'],
      },
    },
  },
  required: ['destinations'],
} as const
