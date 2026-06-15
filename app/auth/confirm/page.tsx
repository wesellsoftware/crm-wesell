'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { establishSessionFromUrlHash } from '@/lib/auth/client-hash-session'
import { isPendingInvite } from '@/lib/auth/invite'

function getPostHashRedirect(type: string | null, user: Parameters<typeof isPendingInvite>[0]) {
  if (type === 'recovery') {
    return user && isPendingInvite(user) ? '/convite' : '/nova-senha'
  }
  if (user && isPendingInvite(user)) return '/convite'
  return '/dashboard'
}

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleAuthRedirect() {
      const supabase = createClient()
      const result = await establishSessionFromUrlHash(supabase)

      if (result.status === 'session') {
        router.replace(getPostHashRedirect(result.type, result.user))
        return
      }

      if (result.status === 'hash_error') {
        const description = result.description ?? ''
        router.replace(
          `/login?error_code=${encodeURIComponent(result.errorCode)}&error_description=${encodeURIComponent(description)}`
        )
        return
      }

      if (result.status === 'no_hash' || result.status === 'failed') {
        router.replace('/login?error_code=auth_error&error_description=Sess%C3%A3o+inv%C3%A1lida.+Abra+o+link+do+e-mail+novamente.')
      }
    }

    void handleAuthRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)' }}>
      <p className="font-body text-white/70">Autenticando…</p>
    </div>
  )
}
