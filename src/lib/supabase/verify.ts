import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { serverEnv } from '../env'

// Service-role client used ONLY to verify a caller's bearer token → user.
// The service-role key bypasses RLS, so it must never leave the server.
let cached: SupabaseClient | null = null

function serviceClient(): SupabaseClient {
  if (cached) return cached
  const { supabaseUrl, serviceRoleKey } = serverEnv()
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase is not configured on the server.')
  }
  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return cached
}

export type AuthResult = { user: User } | { error: string; status: number }

/** Verify the Authorization: Bearer <token> header and resolve to a user. */
export async function verifyRequest(req: Request): Promise<AuthResult> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return { error: 'Missing auth token. Please sign in.', status: 401 }
  }
  try {
    const { data, error } = await serviceClient().auth.getUser(token)
    if (error || !data?.user) {
      return { error: 'Invalid or expired session. Please sign in again.', status: 401 }
    }
    return { user: data.user }
  } catch {
    return { error: 'Auth is not configured on the server.', status: 500 }
  }
}
