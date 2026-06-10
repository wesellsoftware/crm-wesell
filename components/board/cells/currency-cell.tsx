'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useDrawerSaveNotify } from '../drawer-save-context'

interface CurrencyCellProps {
  value: number
  currency: string
  onChange: (amount: number) => void
}

export function CurrencyCell({ value, onChange }: CurrencyCellProps) {
  const notifySaved = useDrawerSaveNotify()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value || ''))

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
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
        className="w-full glass-input rounded px-2 py-1 outline-none font-mono text-xs text-we-paper/80"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(String(value || '')); setEditing(true) }}
      className="font-mono text-xs text-we-paper/80 hover:bg-white/[0.05] px-1 py-0.5 rounded w-full text-left"
    >
      {value ? formatCurrency(value) : '+'}
    </button>
  )
}
