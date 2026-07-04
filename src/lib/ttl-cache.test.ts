import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TtlCache } from './ttl-cache'

describe('TtlCache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns a stored value before it expires', () => {
    const cache = new TtlCache<number>(1000)
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
  })

  it('drops a value once its TTL has passed', () => {
    const cache = new TtlCache<number>(1000)
    cache.set('a', 1)
    vi.advanceTimersByTime(1001)
    expect(cache.get('a')).toBeUndefined()
  })

  it('returns undefined for an unknown key', () => {
    const cache = new TtlCache<number>(1000)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('evicts the oldest entry when the max size is exceeded', () => {
    const cache = new TtlCache<number>(1000, 2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3) // evicts 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })
})
