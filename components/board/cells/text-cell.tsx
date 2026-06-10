'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDrawerSaveNotify } from '../drawer-save-context'

interface TextCellProps {
  value: string
  onChange: (value: string) => void
}

export function TextCell({ value, onChange }: TextCellProps) {
  const notifySaved = useDrawerSaveNotify()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft !== value) onChange(draft)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setEditing(false)
            if (draft !== value) onChange(draft)
            notifySaved?.()
          }
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className="w-full glass-input rounded px-2 py-1 outline-none font-body text-sm text-we-paper focus:ring-1 focus:ring-we-blue/40"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true) }}
      className={cn(
        'w-full text-left font-body text-sm px-1 py-0.5 rounded hover:bg-white/[0.05] transition-colors',
        value ? 'text-we-paper/80' : 'text-we-paper/25'
      )}
    >
      {value || '—'}
    </button>
  )
}
