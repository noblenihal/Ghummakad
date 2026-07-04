/**
 * Minimal fixed-size cache with per-entry TTL and insertion-order eviction.
 * Used to skip redundant work (e.g. an identical Gemini query within the TTL)
 * without pulling in a dependency. Values stored are genuine results — this
 * reuses real output, it does not fabricate it.
 */
export class TtlCache<V> {
  private readonly store = new Map<string, { value: V; expires: number }>()

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 200,
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key)
    if (!hit) return undefined
    if (hit.expires <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs })
  }
}
