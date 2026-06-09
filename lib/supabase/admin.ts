import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_CREDENTIALS_ERROR =
  'Configure SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase → Project Settings → API → service_role).'

export function createAdminClient(): SupabaseClient {
  const client = tryCreateAdminClient()
  if (!client) throw new Error(ADMIN_CREDENTIALS_ERROR)
  return client
}

export function tryCreateAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
