// Generate the self-hosted-Supabase secrets for a fresh deploy, with no
// external dependencies. Prints shell-ready lines you can paste into .env.local.
//
//   node scripts/gen-keys.mjs
//
// Produces: POSTGRES_PASSWORD, JWT_SECRET, and the anon + service_role JWTs
// (HS256, signed with JWT_SECRET) that GoTrue and PostgREST verify.
import { createHmac, randomBytes } from 'node:crypto'

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encHeader = b64url(JSON.stringify(header))
  const encPayload = b64url(JSON.stringify(payload))
  const data = `${encHeader}.${encPayload}`
  const sig = b64url(createHmac('sha256', secret).update(data).digest())
  return `${data}.${sig}`
}

const jwtSecret = process.env.JWT_SECRET || randomBytes(32).toString('hex')
const postgresPassword = process.env.POSTGRES_PASSWORD || randomBytes(18).toString('base64url')

const iat = 1700000000 // fixed, well in the past
const exp = iat + 60 * 60 * 24 * 365 * 10 // ~10 years
const base = { iss: 'supabase', iat, exp }

const anonKey = sign({ ...base, role: 'anon' }, jwtSecret)
const serviceKey = sign({ ...base, role: 'service_role' }, jwtSecret)

process.stdout.write(
  [
    `POSTGRES_PASSWORD=${postgresPassword}`,
    `JWT_SECRET=${jwtSecret}`,
    `SUPABASE_ANON_KEY=${anonKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`,
    '',
  ].join('\n'),
)
