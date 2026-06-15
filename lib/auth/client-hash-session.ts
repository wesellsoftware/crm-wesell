import type { SupabaseClient, User } from '@supabase/supabase-js'

export type HashSessionResult =
  | { status: 'session'; user: User; type: string | null }
  | { status: 'hash_error'; errorCode: string; description: string | null }
  | { status: 'no_hash' }
  | { status: 'failed' }

export function parseUrlHash(): URLSearchParams | null {
  if (typeof window === 'undefined') return null

  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  if (!rawHash) return null
  return new URLSearchParams(rawHash)
}

export function hasAuthTokensInHash(): boolean {
  const params = parseUrlHash()
  return Boolean(params?.get('access_token') && params?.get('refresh_token'))
}

export function clearUrlHash() {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export async function establishSessionFromUrlHash(
  supabase: SupabaseClient
): Promise<HashSessionResult> {
  const params = parseUrlHash()

  if (!params) {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user
      ? { status: 'session', user: session.user, type: null }
      : { status: 'no_hash' }
  }

  const errorCode = params.get('error_code') ?? params.get('error')
  if (errorCode) {
    return {
      status: 'hash_error',
      errorCode,
      description: params.get('error_description'),
    }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const type = params.get('type')

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (!error && data.user) {
      clearUrlHash()
      return { status: 'session', user: data.user, type }
    }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    clearUrlHash()
    return { status: 'session', user: session.user, type }
  }

  return { status: 'failed' }
}
