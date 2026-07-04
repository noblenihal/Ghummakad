import { describe, it, expect } from 'vitest'
import {
  experiencesRequestSchema,
  experiencesResponseSchema,
  experienceSchema,
  buildExperiencesPrompt,
} from './experiences'

describe('experiencesRequestSchema', () => {
  it('accepts a reasonable city', () => {
    const r = experiencesRequestSchema.safeParse({ city: 'Udaipur' })
    expect(r.success).toBe(true)
  })

  it('rejects an empty / too-short city', () => {
    expect(experiencesRequestSchema.safeParse({ city: '' }).success).toBe(false)
    expect(experiencesRequestSchema.safeParse({ city: 'a' }).success).toBe(false)
  })

  it('rejects an over-long city', () => {
    const r = experiencesRequestSchema.safeParse({ city: 'x'.repeat(61) })
    expect(r.success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const r = experiencesRequestSchema.parse({ city: '  Kochi  ' })
    expect(r.city).toBe('Kochi')
  })
})

describe('experiencesResponseSchema', () => {
  const experience = {
    id: 'ambrai-ghat-sunrise',
    name: 'Ambrai Ghat',
    hook: 'Watch the City Palace catch first light across Lake Pichola.',
    bestTime: 'sunrise',
    indoor: false,
    category: 'heritage',
  }
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ ...experience, id: `exp-${i}` }))

  it('accepts a well-formed set of 5-6 experiences', () => {
    expect(
      experiencesResponseSchema.safeParse({ city: 'Udaipur', experiences: many(5) }).success,
    ).toBe(true)
    expect(
      experiencesResponseSchema.safeParse({ city: 'Udaipur', experiences: many(6) }).success,
    ).toBe(true)
  })

  it('rejects only 4 experiences', () => {
    expect(
      experiencesResponseSchema.safeParse({ city: 'Udaipur', experiences: many(4) }).success,
    ).toBe(false)
  })

  it('rejects 7 experiences', () => {
    expect(
      experiencesResponseSchema.safeParse({ city: 'Udaipur', experiences: many(7) }).success,
    ).toBe(false)
  })

  it('requires every experience field', () => {
    const { hook, ...withoutHook } = experience
    expect(experienceSchema.safeParse(withoutHook).success).toBe(false)

    const { indoor, ...withoutIndoor } = experience
    expect(experienceSchema.safeParse(withoutIndoor).success).toBe(false)
  })

  it('requires the city on the response', () => {
    expect(experiencesResponseSchema.safeParse({ experiences: many(5) }).success).toBe(false)
  })
})

describe('buildExperiencesPrompt', () => {
  it('embeds the requested city', () => {
    const prompt = buildExperiencesPrompt('Bhopal')
    expect(prompt).toContain('Bhopal')
  })

  it('carries the anti-fabrication instruction', () => {
    const prompt = buildExperiencesPrompt('Bhopal')
    expect(prompt.toLowerCase()).toContain('never')
  })
})
