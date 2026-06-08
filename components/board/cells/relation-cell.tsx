'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RelatedItem } from '@/lib/boards/types'
import { getRelationItems } from '@/app/actions/boards'
import { CellPopover, cellPopoverOptionClass } from './cell-popover'

interface RelationCellProps {
  value: string[]
  relatedItems: RelatedItem[]
  targetBoardSlug: string
  slug: string
  onChange: (itemIds: string[]) => void
}

export function RelationCell({ value, relatedItems, targetBoardSlug, onChange }: RelationCellProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (targetBoardSlug) {
      getRelationItems(targetBoardSlug).then(setOptions)
    }
  }, [targetBoardSlug])

  const selected = value.map(id => {
    const fromRelated = relatedItems.find(r => r.id === id)
    if (fromRelated) return fromRelated
    const fromOptions = options.find(o => o.id === id)
    if (fromOptions) {
      return { id: fromOptions.id, name: fromOptions.name, board_slug: targetBoardSlug }
    }
    return null
  }).filter((item): item is RelatedItem => item !== null)

  const unselectedOptions = options.filter(opt => !value.includes(opt.id))

  function removeItem(id: string) {
    onChange(value.filter(itemId => itemId !== id))
  }

  function addItem(id: string) {
    if (!value.includes(id)) {
      onChange([...value, id])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 min-h-[28px]">
      {selected.map(item => (
        <span
          key={item.id}
          className="inline-flex items-center gap-0.5 pl-2 pr-1 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-body text-we-paper/80"
        >
          <Link
            href={`/boards/${item.board_slug}?item=${item.id}`}
            className="hover:text-we-blue transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="p-0.5 rounded hover:bg-white/[0.12] text-we-paper/40 hover:text-we-paper/70 transition-colors"
            title="Remover"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors text-[10px] font-body',
          selected.length === 0 ? 'text-we-paper/25' : 'text-we-paper/45'
        )}
      >
        {selected.length === 0 ? (
          <span>+</span>
        ) : (
          <>
            <Plus size={10} />
            <span>Adicionar</span>
          </>
        )}
      </button>
      <CellPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        maxHeight={200}
        className="glass-scrollbar"
      >
        {unselectedOptions.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => addItem(opt.id)}
            className={`${cellPopoverOptionClass} transition-colors text-we-paper/60 hover:bg-white/[0.05]`}
          >
            {opt.name}
          </button>
        ))}
        {options.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-we-paper/30 font-body">Nenhum item</p>
        )}
        {options.length > 0 && unselectedOptions.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-we-paper/30 font-body">Todos já selecionados</p>
        )}
      </CellPopover>
    </div>
  )
}
