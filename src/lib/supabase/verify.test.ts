import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase SDK so we can exercise token handling without a network.
const getUser = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}))

import { verifyRequest } from './verify'

function reqWith(headers: Record<string, string>): Request {
  return new Request('http://test/api/discover', { method: 'POST', headers })
}

describe('verifyRequest', () => {
  beforeEach(() => {
    getUser.mockReset()
    process.env.SUPABASE_URL = 'http://caddy'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  })

  it('rejects a request with no Authorization header', async () => {
    const result = await verifyRequest(reqWith({}))
    expect(result).toMatchObject({ status: 401 })
  })

  it('rejects a non-Bearer Authorization header', async () => {
    const result = await verifyRequest(reqWith({ authorization: 'Basic abc' }))
    expect(result).toMatchObject({ status: 401 })
  })

  it('rejects when Supabase reports an invalid token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
    const result = await verifyRequest(reqWith({ authorization: 'Bearer nope' }))
    expect(result).toMatchObject({ status: 401 })
  })

  it('resolves to the user on a valid token', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.c' } }, error: null })
    const result = await verifyRequest(reqWith({ authorization: 'Bearer good' }))
    expect(result).toEqual({ user: { id: 'u1', email: 'a@b.c' } })
  })
})
