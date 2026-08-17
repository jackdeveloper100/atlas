/**
 * Supabase Client Service (Backend)
 *
 * CRITICAL: This service exports TWO clients with different purposes.
 *
 * 1. supabase — service-role client (bypasses RLS)
 *    Use for: admin.createUser, admin.deleteUser, audit_log writes,
 *             subscriptions writes, Stripe webhook processing,
 *             verifying JWT tokens (auth.getUser).
 *    NEVER expose this key to frontend or logs.
 *
 * 2. supabaseAuth — anon-key client (RLS enforced)
 *    Use for: auth.signInWithPassword ONLY.
 *    The anon key is the public API key. It is safe to use server-side
 *    for user-facing auth flows. signInWithPassword MUST NOT use the
 *    service-role client (persistSession:false breaks user sign-in).
 */

const { createClient } = require('@supabase/supabase-js');

// ── Network-level timeout guard ──────────────────────────────────────────
// supabase-js issues plain fetch() calls with no timeout of their own. On a
// long-lived server process, a pooled keep-alive socket can silently go dead
// (dropped by a NAT/proxy without a FIN/RST) — the next request reusing that
// socket then hangs forever, with nothing to bound it until the frontend's
// own 60s axios timeout gives up. Every DB/storage/auth call in this backend
// goes through one of the two clients below, so bounding fetch here is the
// single place that protects all of them at once, rather than adding an
// ad-hoc timeout race at every call site.
const SUPABASE_FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url, options = {}) {
  if (options.signal) {
    // Caller already supplied its own AbortSignal (e.g. explicit
    // .abortSignal() usage) — respect it instead of overriding.
    return fetch(url, options);
  }
  return fetch(url, { ...options, signal: AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS) });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing required environment variable: SUPABASE_ANON_KEY (needed for signInWithPassword)'
  );
}

// Safe startup diagnostics — never log actual key values
console.log('[supabase.service] SUPABASE_URL configured:', !!supabaseUrl);
console.log('[supabase.service] SUPABASE_SERVICE_ROLE_KEY configured:', !!supabaseServiceRoleKey);
console.log('[supabase.service] SUPABASE_ANON_KEY configured:', !!supabaseAnonKey);

// ── Admin client (service-role key — bypasses RLS) ──────────────────────
// Use for: admin.createUser, admin.deleteUser, auth.getUser (JWT verify),
//          direct DB writes that bypass RLS (audit_log, subscriptions).
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

// ── Auth client (anon key — RLS enforced) ───────────────────────────────
// Use EXCLUSIVELY for: auth.signInWithPassword.
// signInWithPassword requires a client that can manage session state.
// The service-role client with persistSession:false cannot do this.
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

module.exports = { supabase, supabaseAuth };
