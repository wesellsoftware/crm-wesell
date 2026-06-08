'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { RelatedItem } from '@/lib/boards/types'
import { getRelationItems } from '@/app/actions/boards'

interface RelationCellProps {
  value: string[]
  relatedItems: RelatedItem[]
  targetBoardSlug: string
  slug: string
  onChange: (itemIds: string[]) => void
}

export function RelationCell({ value, relatedItems, targetBoardSlug, onChange }: RelationCellProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (open && targetBoardSlug) {
      getRelationItems(targetBoardSlug).then(setOptions)
    }
  }, [open, targetBoardSlug])

  const selected = relatedItems.filter(r => value.includes(r.id))

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
          selected.map(item => (
            <Link
              key={item.id}
              href={`/boards/${item.board_slug}?item=${item.id}`}
              onClick={e => e.stopPropagation()}
              className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-body text-we-paper/80 hover:bg-white/[0.12] transition-colors"
            >
              {item.name}
            </Link>
          ))
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 glass-dark rounded-lg p-1.5 min-w-[180px] max-h-[200px] overflow-y-auto shadow-xl border border-white/10">
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-body transition-colors ${
                    isSelected ? 'bg-we-blue/20 text-we-paper' : 'text-we-paper/60 hover:bg-white/[0.05]'
                  }`}
                >
                  {opt.name}
                </button>
              )
            })}
            {options.length === 0 && (
              <p className="px-2.5 py-1.5 text-xs text-we-paper/30 font-body">Nenhum item</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
