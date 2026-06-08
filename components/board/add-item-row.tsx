'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { createItem } from '@/app/actions/boards'

interface AddItemRowProps {
  boardId: string
  groupId: string
  slug: string
  colSpan: number
  label: string
  autoOpen?: boolean
  onAutoOpenDone?: () => void
}

export function AddItemRow({ boardId, groupId, slug, colSpan, label, autoOpen, onAutoOpenDone }: AddItemRowProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (autoOpen) {
      setAdding(true)
      onAutoOpenDone?.()
    }
  }, [autoOpen, onAutoOpenDone])

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      await createItem(boardId, groupId, name.trim(), slug)
      setName('')
      setAdding(false)
    })
  }

  return (
    <tr className="border-b border-white/[0.04]">
      <td colSpan={colSpan} className="px-3 py-2.5">
        {adding ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (!name.trim()) setAdding(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') { setName(''); setAdding(false) }
            }}
            placeholder="Digite o nome e pressione Enter…"
            className="w-full max-w-sm glass-input rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-we-blue/40 font-body text-sm text-we-paper/80 placeholder:text-we-paper/30"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 font-body text-sm text-we-paper/35 hover:text-we-blue transition-colors px-1"
          >
            <Plus size={14} />
            {label}
          </button>
        )}
      </td>
    </tr>
  )
}
