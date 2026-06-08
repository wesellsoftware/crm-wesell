'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StatusOption } from '@/lib/boards/types'

interface TagsCellProps {
  value: string[]
  options: StatusOption[]
  onChange: (optionIds: string[]) => void
}

export function TagsCell({ value, options, onChange }: TagsCellProps) {
  const [open, setOpen] = useState(false)
  const selected = options.filter(o => value.includes(o.id))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex flex-wrap gap-1 px-1 py-0.5 rounded hover:bg-white/[0.05] min-h-[28px]"
      >
        {selected.length === 0 ? (
          <span className="text-we-paper/25 text-xs">+</span>
        ) : (
          selected.map(opt => (
            <span
              key={opt.id}
              className="px-2 py-0.5 rounded-md text-[10px] font-body text-white"
              style={{ backgroundColor: opt.color }}
            >
              {opt.label}
            </span>
          ))
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 glass-dark rounded-lg p-1.5 min-w-[160px] shadow-xl border border-white/10">
            {options.map(opt => {
              const isSelected = value.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? value.filter(id => id !== opt.id)
                      : [...value, opt.id]
                    onChange(next)
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded-md text-xs font-body text-white mb-0.5 last:mb-0',
                    isSelected && 'ring-2 ring-white/30'
                  )}
                  style={{ backgroundColor: opt.color }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
