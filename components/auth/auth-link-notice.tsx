'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { hasAuthTokensInHash } from '@/lib/auth/client-hash-session'
import { mapAuthUrlError } from '@/lib/auth/errors'

export function AuthLinkNotice() {
  const searchParams = useSearchParams()
  const [hashMessage, setHashMessage] = useState<string | null>(null)

  useEffect(() => {
    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    if (!rawHash) return

    const params = new URLSearchParams(rawHash)
    const errorCode = params.get('error_code') ?? params.get('error')
    if (!errorCode) return

    const description = params.get('error_description')
    setHashMessage(mapAuthUrlError(errorCode, description))
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  const queryError = searchParams.get('error')
  const queryErrorCode = searchParams.get('error_code')
  const queryDescription = searchParams.get('error_description')

  const message =
    hashMessage ??
    (queryErrorCode || queryError
      ? mapAuthUrlError(queryErrorCode ?? queryError, queryDescription)
      : null)

  if (!message || hasAuthTokensInHash()) return null

  return (
    <div className="mb-5 px-4 py-3 rounded-[8px] bg-we-red/10 border border-we-red/20">
      <p className="font-body text-sm text-we-red">{message}</p>
      {queryErrorCode === 'otp_expired' || hashMessage?.includes('expirou') ? (
        <p className="font-body text-xs text-we-ink/55 mt-2">
          Se você foi convidado, peça ao administrador da equipe para reenviar o convite em Configurações → Membros.
        </p>
      ) : null}
    </div>
  )
}
