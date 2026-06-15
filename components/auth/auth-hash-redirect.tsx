'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { establishSessionFromUrlHash, hasAuthTokensInHash } from '@/lib/auth/client-hash-session'
import { isPendingInvite } from '@/lib/auth/invite'
import { mapAuthUrlError } from '@/lib/auth/errors'

function getPostHashRedirect(type: string | null, user: Parameters<typeof isPendingInvite>[0]) {
  if (type === 'recovery') {
    return user && isPendingInvite(user) ? '/convite' : '/nova-senha'
  }
  if (user && isPendingInvite(user)) return '/convite'
  return '/dashboard'
}

type AuthHashRedirectProps = {
  onHashError?: (message: string) => void
}

export function AuthHashRedirect({ onHashError }: AuthHashRedirectProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState(hasAuthTokensInHash)

  useEffect(() => {
    async function handleHashAuth() {
      if (!hasAuthTokensInHash()) return

      setProcessing(true)
      const supabase = createClient()
      const result = await establishSessionFromUrlHash(supabase)

      if (result.status === 'session') {
        router.replace(getPostHashRedirect(result.type, result.user))
        return
      }

      if (result.status === 'hash_error') {
        onHashError?.(mapAuthUrlError(result.errorCode, result.description))
      }

      setProcessing(false)
    }

    void handleHashAuth()
  }, [router, onHashError])

  if (!processing) return null

  return (
    <div className="min-h-screen flex items-center justify-center absolute inset-0 z-20"
      style={{ background: 'linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)' }}>
      <p className="font-body text-white/70">Autenticando…</p>
    </div>
  )
}
