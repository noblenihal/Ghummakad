// Centralised access to server-only environment. Throwing here (instead of at
// each call site) keeps the failure mode obvious and the values typed.

export function serverEnv() {
  const geminiKey = process.env.GEMINI_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { geminiKey, supabaseUrl, serviceRoleKey }
}
