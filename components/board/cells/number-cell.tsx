'use client'

import { useState } from 'react'
import { useDrawerSaveNotify } from '../drawer-save-context'

interface NumberCellProps {
  value: number
  onChange: (value: number) => void
}

export function NumberCell({ value, onChange }: NumberCellProps) {
  const notifySaved = useDrawerSaveNotify()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value || ''))

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        max={10}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const num = Number(draft) || 0
          if (num !== value) onChange(num)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setEditing(false)
            const num = Number(draft) || 0
            if (num !== value) onChange(num)
            notifySaved?.()
          }
        }}
        className="w-12 bg-transparent border-none outline-none font-mono text-xs text-we-paper/80 text-center"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(String(value || '')); setEditing(true) }}
      className="size-7 rounded-md flex items-center justify-center font-mono text-xs font-semibold hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: value > 0 ? `rgba(67, 66, 245, ${0.15 + value * 0.15})` : 'rgba(255,255,255,0.04)',
        color: value > 0 ? '#4342F5' : 'rgba(237,237,235,0.25)',
      }}
    >
      {value || '+'}
    </button>
  )
}
