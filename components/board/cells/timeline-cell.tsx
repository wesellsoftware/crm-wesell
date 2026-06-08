'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface TimelineCellProps {
  start: string
  end: string
  onChange: (start: string, end: string) => void
}

export function TimelineCell({ start, end, onChange }: TimelineCellProps) {
  const [editing, setEditing] = useState(false)
  const [draftStart, setDraftStart] = useState(start)
  const [draftEnd, setDraftEnd] = useState(end)

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="date"
          autoFocus
          value={draftStart}
          onChange={e => setDraftStart(e.target.value)}
          className="bg-transparent border-none outline-none font-mono text-[10px] text-we-paper/70 w-[90px]"
        />
        <span className="text-we-paper/30">–</span>
        <input
          type="date"
          value={draftEnd}
          onChange={e => setDraftEnd(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (draftStart !== start || draftEnd !== end) onChange(draftStart, draftEnd)
          }}
          className="bg-transparent border-none outline-none font-mono text-[10px] text-we-paper/70 w-[90px]"
        />
      </div>
    )
  }

  const label = start && end
    ? `${formatDate(start)} – ${formatDate(end)}`
    : start
      ? formatDate(start)
      : null

  return (
    <button
      type="button"
      onClick={() => { setDraftStart(start); setDraftEnd(end); setEditing(true) }}
      className="px-2 py-0.5 rounded-full bg-white/[0.08] font-mono text-[10px] text-we-paper/70 hover:bg-white/[0.12] transition-colors"
    >
      {label ?? '+'}
    </button>
  )
}
