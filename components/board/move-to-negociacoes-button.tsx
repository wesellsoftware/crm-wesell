'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { moveLeadToNegociacoes } from '@/app/actions/boards'

interface MoveToNegociacoesButtonProps {
  itemId: string
}

export function MoveToNegociacoesButton({ itemId }: MoveToNegociacoesButtonProps) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await moveLeadToNegociacoes(itemId)
      if (result.success) setDone(true)
    })
  }

  if (done) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-we-blue/20 text-we-blue text-[10px] font-body whitespace-nowrap">
        Movido
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="px-2.5 py-1 rounded-md bg-we-blue text-white text-[10px] font-body hover:bg-we-blue/90 transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
    >
      {pending ? <Loader2 size={10} className="animate-spin" /> : null}
      Mover para Negociações
    </button>
  )
}
