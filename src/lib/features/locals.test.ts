import { describe, it, expect } from 'vitest'
import {
  localsRequestSchema,
  localsResponseSchema,
  localPersonaSchema,
  buildLocalsPrompt,
} from './locals'

describe('localsRequestSchema', () => {
  it('accepts a reasonable city', () => {
    const r = localsRequestSchema.safeParse({ city: 'Varanasi' })
    expect(r.success).toBe(true)
  })

  it('rejects an empty / too-short city', () => {
    expect(localsRequestSchema.safeParse({ city: '' }).success).toBe(false)
    expect(localsRequestSchema.safeParse({ city: 'a' }).success).toBe(false)
  })

  it('rejects an over-long city', () => {
    const r = localsRequestSchema.safeParse({ city: 'x'.repeat(61) })
    expect(r.success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const r = localsRequestSchema.parse({ city: '  Madurai  ' })
    expect(r.city).toBe('Madurai')
  })
})

describe('localsResponseSchema', () => {
  const local = {
    id: 'ammu-flower-seller',
    name: 'Ammu',
    age: 58,
    trade: 'Flower seller',
    emoji: '🌼',
    greeting: 'Vaanga, vaanga! The jasmine is freshest before sunrise.',
    story:
      'Every morning before the temple bells, I thread jasmine outside the East Tower gate, the way my mother did before me.',
    phrase: {
      local: 'வணக்கம்',
      translit: 'Vanakkam',
      english: 'Hello / greetings',
    },
  }
  const secondLocal = { ...local, id: 'ravi-boatman', name: 'Ravi', trade: 'Boatman' }

  it('accepts a well-formed cast of 2-4 locals', () => {
    const r = localsResponseSchema.safeParse({ city: 'Madurai', locals: [local, secondLocal] })
    expect(r.success).toBe(true)
  })

  it('rejects fewer than 2 locals', () => {
    expect(localsResponseSchema.safeParse({ city: 'Madurai', locals: [local] }).success).toBe(false)
    expect(localsResponseSchema.safeParse({ city: 'Madurai', locals: [] }).success).toBe(false)
  })

  it('rejects more than 4 locals', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ ...local, id: `local-${i}` }))
    expect(localsResponseSchema.safeParse({ city: 'Madurai', locals: many }).success).toBe(false)
  })

  it('requires every persona field', () => {
    const { phrase, ...withoutPhrase } = local
    expect(localPersonaSchema.safeParse(withoutPhrase).success).toBe(false)

    const { greeting, ...withoutGreeting } = local
    expect(localPersonaSchema.safeParse(withoutGreeting).success).toBe(false)
  })

  it('requires every phrase field', () => {
    const broken = { ...local, phrase: { local: 'வணக்கம்', translit: 'Vanakkam' } }
    expect(localPersonaSchema.safeParse(broken).success).toBe(false)
  })

  it('requires the city on the response', () => {
    expect(localsResponseSchema.safeParse({ locals: [local, secondLocal] }).success).toBe(false)
  })
})

describe('buildLocalsPrompt', () => {
  it('embeds the requested city', () => {
    const prompt = buildLocalsPrompt({ city: 'Shillong' })
    expect(prompt).toContain('Shillong')
  })

  it('carries the anti-fabrication instruction', () => {
    const prompt = buildLocalsPrompt({ city: 'Shillong' })
    expect(prompt.toLowerCase()).toContain('never')
    expect(prompt.toLowerCase()).toContain('fictional')
  })
})
