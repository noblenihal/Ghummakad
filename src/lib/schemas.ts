import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'

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

// Gemini responseSchema, typed with the SDK's SchemaType enum so it needs no
// cast at the call site. Kept in sync with `destinationSchema` above by the
// route's zod parse.
export const discoverGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    destinations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          region: { type: SchemaType.STRING },
          hook: { type: SchemaType.STRING },
          whyItMatches: { type: SchemaType.STRING },
          bestMonths: { type: SchemaType.STRING },
        },
        required: ['name', 'region', 'hook', 'whyItMatches', 'bestMonths'],
      },
    },
  },
  required: ['destinations'],
}
