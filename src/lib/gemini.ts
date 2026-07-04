import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type ResponseSchema,
} from '@google/generative-ai'
import { serverEnv } from './env'

// Single lazily-created client. Server-side only — the key must never reach the
// browser bundle.
let client: GoogleGenerativeAI | null = null

function genAI(): GoogleGenerativeAI {
  if (client) return client
  const { geminiKey } = serverEnv()
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.')
  }
  client = new GoogleGenerativeAI(geminiKey)
  return client
}

const MODEL = 'gemini-2.5-flash'
// Cap generation: our JSON payloads are small, so this trims latency and cost
// without truncating valid responses.
const MAX_OUTPUT_TOKENS = 1024

// Reuse one configured model per response schema rather than rebuilding it on
// every request. Schemas are module-level constants, so their identity is
// stable and keying a Map on them is safe.
const modelCache = new Map<ResponseSchema, GenerativeModel>()

function modelFor(responseSchema: ResponseSchema): GenerativeModel {
  const cached = modelCache.get(responseSchema)
  if (cached) return cached
  const model = genAI().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.9,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  })
  modelCache.set(responseSchema, model)
  return model
}

/**
 * Ask Gemini for JSON matching `responseSchema` and return the raw text. The
 * caller validates the shape with zod, so a model that drifts from the schema
 * fails loudly rather than corrupting the UI.
 */
export async function generateJson(
  prompt: string,
  responseSchema: ResponseSchema,
): Promise<string> {
  const result = await modelFor(responseSchema).generateContent(prompt)
  return result.response.text()
}
