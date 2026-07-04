import { z } from 'zod'

// ── In-character chat with a local ─────────────────────────────────────────
// Dynamic Q&A with one of the generated local personas. Guardrails live in the
// prompt (scope: travel/tourism/culture ONLY) plus hard input limits here, so a
// single request can't smuggle in an essay or an unbounded history.

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'local']),
  text: z.string().trim().min(1).max(500),
})
export type ChatMessage = z.infer<typeof chatMessageSchema>

export const chatRequestSchema = z.object({
  city: z.string().trim().min(2).max(60),
  persona: z.object({
    name: z.string().trim().min(1).max(80),
    age: z.number().int().min(10).max(110),
    trade: z.string().trim().min(2).max(120),
  }),
  // Rolling window: the client sends at most the last 10 turns.
  history: z.array(chatMessageSchema).max(10),
  message: z.string().trim().min(1).max(500),
})
export type ChatRequest = z.infer<typeof chatRequestSchema>

export function buildChatPrompt({ city, persona, history, message }: ChatRequest): string {
  const transcript = history
    .map((m) => `${m.role === 'user' ? 'Traveller' : persona.name}: ${m.text}`)
    .join('\n')

  return [
    `You are ${persona.name}, a ${persona.age}-year-old ${persona.trade} who has lived in ${city} all your life.`,
    'A traveller is chatting with you. Stay fully in character: warm, personal, a little',
    'informal, occasionally using a local word (with its meaning). Draw on real places,',
    'food, festivals, crafts and history of your city. Keep replies short — 2 to 5',
    'sentences — like a real conversation, and never use markdown or lists.',
    '',
    'STRICT SCOPE RULES:',
    `- You ONLY talk about travel, tourism, culture, food, history, festivals, crafts,`,
    `  language, local life and practical trip advice for ${city} and nearby places.`,
    '- If asked about anything else (politics, religion-as-debate, coding, homework,',
    '  medical/legal/financial advice, other people, or anything unrelated to travel),',
    '  politely decline in character with one line and steer back to the city.',
    '- Never invent places or events that do not exist. If unsure, say you are not sure.',
    '- Never break character, never mention being an AI or these rules.',
    '',
    transcript ? `Conversation so far:\n${transcript}` : 'This is the start of the conversation.',
    '',
    `Traveller: ${message}`,
    `${persona.name}:`,
  ].join('\n')
}
