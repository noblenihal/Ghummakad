import { describe, it, expect } from 'vitest'
import {
  discoverRequestSchema,
  discoverResponseSchema,
  destinationSchema,
} from './schemas'

describe('discoverRequestSchema', () => {
  it('accepts a reasonable vibe', () => {
    const r = discoverRequestSchema.safeParse({ vibe: 'quiet hills and old temples' })
    expect(r.success).toBe(true)
  })

  it('rejects an empty / too-short vibe', () => {
    expect(discoverRequestSchema.safeParse({ vibe: '' }).success).toBe(false)
    expect(discoverRequestSchema.safeParse({ vibe: 'a' }).success).toBe(false)
  })

  it('rejects an over-long vibe', () => {
    const r = discoverRequestSchema.safeParse({ vibe: 'x'.repeat(301) })
    expect(r.success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const r = discoverRequestSchema.parse({ vibe: '  misty mornings  ' })
    expect(r.vibe).toBe('misty mornings')
  })
})

describe('discoverResponseSchema', () => {
  const destination = {
    name: 'Ziro Valley',
    region: 'Arunachal Pradesh',
    hook: 'Rice fields, pine hills and the quietest festival in the country.',
    whyItMatches: 'Slow, green and blissfully uncrowded.',
    bestMonths: 'March–May, September',
  }

  it('accepts 1–3 well-formed destinations', () => {
    expect(discoverResponseSchema.safeParse({ destinations: [destination] }).success).toBe(true)
  })

  it('rejects an empty destination list', () => {
    expect(discoverResponseSchema.safeParse({ destinations: [] }).success).toBe(false)
  })

  it('rejects more than 3 destinations', () => {
    const many = Array.from({ length: 4 }, () => destination)
    expect(discoverResponseSchema.safeParse({ destinations: many }).success).toBe(false)
  })

  it('requires every destination field', () => {
    const { bestMonths, ...partial } = destination
    expect(destinationSchema.safeParse(partial).success).toBe(false)
  })
})
