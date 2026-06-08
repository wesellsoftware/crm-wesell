'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { StatusOption } from '@/lib/boards/types'
import { CellPopover, cellPopoverOptionClass } from './cell-popover'

interface StatusCellProps {
  value: string | undefined
  options: StatusOption[]
  onChange: (optionId: string) => void
}

export function StatusCell({ value, options, onChange }: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = options.find(o => o.id === value)

  return (
    <div>
      <button
        ref={triggerRef}
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
      <CellPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
      >
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => { onChange(opt.id); setOpen(false) }}
            className={cn(cellPopoverOptionClass, 'text-white hover:opacity-90 transition-opacity')}
            style={{ backgroundColor: opt.color }}
          >
            {opt.label}
          </button>
        ))}
      </CellPopover>
    </div>
  )
}
