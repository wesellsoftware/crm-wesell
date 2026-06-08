'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { StatusOption } from '@/lib/boards/types'
import { CellPopover, cellPopoverOptionClass } from './cell-popover'

interface TagsCellProps {
  value: string[]
  options: StatusOption[]
  onChange: (optionIds: string[]) => void
}

export function TagsCell({ value, options, onChange }: TagsCellProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = options.filter(o => value.includes(o.id))

  return (
    <div>
      <button
        ref={triggerRef}
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
      <CellPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
      >
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
                cellPopoverOptionClass,
                'text-white',
                isSelected && 'ring-2 ring-white/30'
              )}
              style={{ backgroundColor: opt.color }}
            >
              {opt.label}
            </button>
          )
        })}
      </CellPopover>
    </div>
  )
}
