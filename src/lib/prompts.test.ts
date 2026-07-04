import { describe, it, expect } from 'vitest'
import { buildDiscoverPrompt } from './prompts'

describe('buildDiscoverPrompt', () => {
  it('embeds the traveller vibe verbatim', () => {
    const prompt = buildDiscoverPrompt({ vibe: 'desert forts at dusk' })
    expect(prompt).toContain('desert forts at dusk')
  })

  it('instructs the model to avoid inventing places', () => {
    const prompt = buildDiscoverPrompt({ vibe: 'anything' })
    expect(prompt.toLowerCase()).toContain('never invent')
  })

  it('caps the suggestion count at 3', () => {
    const prompt = buildDiscoverPrompt({ vibe: 'anything' })
    expect(prompt).toContain('3')
  })
})
