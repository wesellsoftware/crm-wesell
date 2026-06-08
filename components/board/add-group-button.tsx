'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { createGroup } from '@/app/actions/boards'
import { DEFAULT_STATUS_COLORS } from '@/lib/boards/column-types'
import type { BoardGroup } from '@/lib/boards/types'

interface AddGroupButtonProps {
  boardId: string
  slug: string
  groupCount: number
  onGroupCreated: (group: BoardGroup) => void
}

export function AddGroupButton({ boardId, slug, groupCount, onGroupCreated }: AddGroupButtonProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_STATUS_COLORS[0])
  const [, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createGroup(boardId, name.trim(), color, slug)
      if (result.group) {
        onGroupCreated(result.group as BoardGroup)
      }
      setName('')
      setColor(DEFAULT_STATUS_COLORS[groupCount % DEFAULT_STATUS_COLORS.length])
      setAdding(false)
    })
  }

  function handleCancel() {
    setName('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <label className="relative shrink-0 cursor-pointer" title="Cor do grupo">
          <div
            className="size-5 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="sr-only"
          />
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => { if (!name.trim()) handleCancel() }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') handleCancel()
          }}
          placeholder="Nome do grupo…"
          className="glass-input rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-we-blue/40 font-body text-sm text-we-paper/80 placeholder:text-we-paper/30"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setColor(DEFAULT_STATUS_COLORS[groupCount % DEFAULT_STATUS_COLORS.length])
        setAdding(true)
      }}
      className="flex items-center gap-1.5 font-body text-sm text-we-paper/35 hover:text-we-blue transition-colors mt-2 px-1"
    >
      <Plus size={14} />
      Adicionar novo grupo
    </button>
  )
}
