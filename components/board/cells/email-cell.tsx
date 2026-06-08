'use client'

import { useState } from 'react'

interface EmailCellProps {
  value: string
  onChange: (value: string) => void
}

export function EmailCell({ value, onChange }: EmailCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        type="email"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onChange(draft) }}
        onKeyDown={e => e.key === 'Enter' && (setEditing(false), onChange(draft))}
        className="w-full glass-input rounded px-2 py-1 outline-none font-mono text-xs text-we-blue"
      />
    )
  }

  if (value && !editing) {
    return (
      <a
        href={`mailto:${value}`}
        onClick={e => e.stopPropagation()}
        className="font-mono text-xs text-we-blue hover:underline px-1"
      >
        {value}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true) }}
      className="text-we-paper/25 text-xs px-1 hover:bg-white/[0.05] rounded"
    >
      +
    </button>
  )
}
