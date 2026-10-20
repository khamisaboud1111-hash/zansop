import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS entirely. ONLY use this in trusted
 * server contexts that have already verified the request some other way
 * (e.g. the Flutterwave webhook, after checking the verif-hash signature).
 * NEVER import this into any client component or expose the service role
 * key to the browser. Requires SUPABASE_SERVICE_ROLE_KEY as a server-only
 * env var (found in Supabase Dashboard -> Settings -> API -> service_role).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for admin client')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

