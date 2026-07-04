import { GoogleGenerativeAI, type ResponseSchema } from '@google/generative-ai'
import { serverEnv } from './env'

// Single lazily-created client. Server-side only — the key must never reach the
// browser bundle.
let cached: GoogleGenerativeAI | null = null

function genAI(): GoogleGenerativeAI {
  if (cached) return cached
  const { geminiKey } = serverEnv()
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.')
  }
  cached = new GoogleGenerativeAI(geminiKey)
  return cached
}

const MODEL = 'gemini-2.5-flash'

/**
 * Ask Gemini for JSON matching `schema` and return the parsed text. The caller
 * is responsible for validating the shape (we do that with zod) so a model that
 * drifts from the schema fails loudly rather than corrupting the UI.
 */
export async function generateJson(
  prompt: string,
  // A plain JSON-Schema object. The SDK's typed enum (`SchemaType`) is stricter
  // than needed; the string-literal form is valid at runtime, so we cast once
  // here rather than pushing the enum through every schema definition.
  responseSchema: Record<string, unknown>,
): Promise<string> {
  const model = genAI().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as unknown as ResponseSchema,
      temperature: 0.9,
    },
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
