'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StatusOption } from '@/lib/boards/types'

interface StatusCellProps {
  value: string | undefined
  options: StatusOption[]
  onChange: (optionId: string) => void
}

export function StatusCell({ value, options, onChange }: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'px-2.5 py-1 rounded-md text-xs font-body font-medium transition-colors min-w-[80px] text-center',
          selected ? 'text-white' : 'text-we-paper/25 bg-white/[0.04] border border-dashed border-white/[0.12]'
        )}
        style={selected ? { backgroundColor: selected.color } : undefined}
      >
        {selected?.label ?? '+'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 glass-dark rounded-lg p-1.5 min-w-[160px] shadow-xl border border-white/10">
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false) }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-body text-white mb-0.5 last:mb-0 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: opt.color }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
