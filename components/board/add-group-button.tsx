'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { createGroup } from '@/app/actions/boards'

interface AddGroupButtonProps {
  boardId: string
  slug: string
}

export function AddGroupButton({ boardId, slug }: AddGroupButtonProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      await createGroup(boardId, name.trim(), '#4342F5', slug)
      setName('')
      setAdding(false)
    })
  }

  if (adding) {
    return (
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={() => { if (!name.trim()) setAdding(false) }}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setName(''); setAdding(false) }
        }}
        placeholder="Nome do grupo…"
        className="glass-input rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-we-blue/40 font-body text-sm text-we-paper/80 placeholder:text-we-paper/30"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex items-center gap-1.5 font-body text-sm text-we-paper/35 hover:text-we-blue transition-colors mt-2 px-1"
    >
      <Plus size={14} />
      Adicionar novo grupo
    </button>
  )
}
