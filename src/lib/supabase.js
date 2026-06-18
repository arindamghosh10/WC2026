import { createClient } from '@supabase/supabase-js'

// Both clients are created LAZILY (only when first used), not at module
// import time. This matters because Next.js statically analyzes/imports
// route files during the build step — if createClient() ran at the top
// level, it would execute during build collection too, and fail loudly
// if env vars aren't threaded through that exact phase the same way they
// are at request time. Lazy creation avoids that entirely.

let _supabase = null
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase public env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

let _supabaseAdmin = null
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Backward-compatible export: components currently do
//   import { supabase } from '@/lib/supabase'
// This Proxy defers the real getSupabase() call until a property on
// `supabase` is actually accessed (e.g. supabase.from(...)), preserving
// that existing import style without re-introducing eager init.
export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getSupabase()[prop]
  }
})