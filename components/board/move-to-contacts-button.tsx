'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { moveLeadToContacts } from '@/app/actions/boards'

interface MoveToContactsButtonProps {
  itemId: string
}

export function MoveToContactsButton({ itemId }: MoveToContactsButtonProps) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await moveLeadToContacts(itemId)
      if (result.success) setDone(true)
    })
  }

  if (done) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-we-green/20 text-we-green text-[10px] font-body">
        Movido
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="px-2.5 py-1 rounded-md bg-we-green/80 text-white text-[10px] font-body hover:bg-we-green transition-colors disabled:opacity-50 flex items-center gap-1"
    >
      {pending ? <Loader2 size={10} className="animate-spin" /> : null}
      Mover para Contatos
    </button>
  )
}
