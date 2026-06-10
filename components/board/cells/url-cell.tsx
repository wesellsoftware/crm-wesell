'use client'

import { useState } from 'react'
import { useDrawerSaveNotify } from '../drawer-save-context'

interface UrlCellProps {
  value: string
  onChange: (value: string) => void
}

export function UrlCell({ value, onChange }: UrlCellProps) {
  const notifySaved = useDrawerSaveNotify()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        type="url"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onChange(draft) }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setEditing(false)
            if (draft !== value) onChange(draft)
            notifySaved?.()
          }
        }}
        className="w-full glass-input rounded px-2 py-1 outline-none font-mono text-xs text-we-blue"
      />
    )
  }

  if (value) {
    const href = value.startsWith('http') ? value : `https://${value}`
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="font-mono text-xs text-we-blue hover:underline px-1 truncate block max-w-[160px]"
      >
        {value.replace(/^https?:\/\//, '')}
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
