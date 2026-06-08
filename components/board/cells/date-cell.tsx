'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface DateCellProps {
  value: string
  onChange: (value: string) => void
}

export function DateCell({ value, onChange }: DateCellProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={value}
        onBlur={e => { setEditing(false); if (e.target.value !== value) onChange(e.target.value) }}
        onKeyDown={e => e.key === 'Escape' && setEditing(false)}
        className="glass-input rounded px-1 outline-none font-mono text-xs text-we-paper/70"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="font-mono text-xs text-we-paper/70 hover:bg-white/[0.05] px-1 py-0.5 rounded"
    >
      {value ? formatDate(value) : '+'}
    </button>
  )
}
