import { createClient } from '@supabase/supabase-js'

/**
 * Strip characters that are invalid in HTTP fetch headers.
 * Guards against:
 *   - BOM (U+FEFF) from PowerShell / Windows copy-paste into env files
 *   - Carriage returns from CRLF line endings
 *   - Any non-printable / non-ASCII code point that browsers reject in headers
 */
function sanitizeEnvVar(value: string): string {
  return value
    .replace(/\uFEFF/g, '') // strip BOM (byte-order mark)
    .replace(/[\r\n]/g, '') // strip carriage return / newline
    .replace(/[^\x20-\x7E]/g, '') // strip anything outside printable ASCII range
    .trim()
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!rawUrl || !rawKey) {
  throw new Error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required',
  )
}

const supabaseUrl = sanitizeEnvVar(rawUrl)
const supabaseAnonKey = sanitizeEnvVar(rawKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
