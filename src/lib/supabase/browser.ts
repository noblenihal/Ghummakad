import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Browser client. Uses the public URL + anon key (both safe to expose). The
// anon key only grants what Row-Level Security policies allow.
let cached: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Supabase public env vars are missing (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).')
  }
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return cached
}
