'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OrgMember } from '@/lib/boards/types'

interface PersonCellProps {
  value: string[]
  members: OrgMember[]
  onChange: (userIds: string[]) => void
}

export function PersonCell({ value, members, onChange }: PersonCellProps) {
  const [open, setOpen] = useState(false)
  const selected = members.filter(m => value.includes(m.id))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-white/[0.05] min-h-[28px]"
      >
        {selected.length === 0 ? (
          <span className="text-we-paper/25 text-xs">+</span>
        ) : (
          selected.map(m => (
            <div
              key={m.id}
              className="size-6 rounded-full bg-we-blue/30 flex items-center justify-center shrink-0"
              title={m.full_name ?? ''}
            >
              <span className="text-[10px] font-semibold text-we-blue">
                {(m.full_name ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          ))
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 glass-dark rounded-lg p-1.5 min-w-[180px] shadow-xl border border-white/10">
            {members.map(m => {
              const isSelected = value.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? value.filter(id => id !== m.id)
                      : [...value, m.id]
                    onChange(next)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body transition-colors',
                    isSelected ? 'bg-we-blue/20 text-we-paper' : 'text-we-paper/60 hover:bg-white/[0.05]'
                  )}
                >
                  <div className="size-5 rounded-full bg-we-blue/30 flex items-center justify-center">
                    <span className="text-[9px] font-semibold text-we-blue">
                      {(m.full_name ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {m.full_name ?? 'Sem nome'}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
