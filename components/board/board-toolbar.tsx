'use client'

import { useState } from 'react'
import { Search, User, Filter, Plus, Trash2 } from 'lucide-react'
import { AddColumnDialog } from './add-column-dialog'
import { BoardTrashSheet } from './board-trash-sheet'

interface BoardToolbarProps {
  slug: string
  boardId: string
  itemLabel: string
  searchQuery: string
  onSearchChange: (q: string) => void
  onCreateClick?: () => void
  onItemsRestored?: () => void
}

export function BoardToolbar({
  slug,
  boardId,
  itemLabel,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onItemsRestored,
}: BoardToolbarProps) {
  const [trashOpen, setTrashOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] shrink-0">
      <button
        type="button"
        onClick={onCreateClick}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-we-blue text-white text-sm font-body font-medium hover:bg-we-blue/90 transition-colors shadow-sm"
      >
        <Plus size={14} />
        Criar {itemLabel}
      </button>

      <div className="relative max-w-[220px]">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-we-paper/35" />
        <input
          type="search"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Pesquisar…"
          className="w-full h-9 pl-8 pr-3 rounded-lg glass-input text-we-paper/80 placeholder:text-we-paper/30 font-body text-sm focus:outline-none focus:ring-1 focus:ring-we-blue/40"
        />
      </div>

      <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-we-paper/55 hover:bg-white/[0.05] hover:text-we-paper/80 transition-colors text-sm font-body border border-transparent hover:border-white/[0.08]">
        <User size={14} />
        Pessoa
      </button>
      <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-we-paper/55 hover:bg-white/[0.05] hover:text-we-paper/80 transition-colors text-sm font-body border border-transparent hover:border-white/[0.08]">
        <Filter size={14} />
        Filtro
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-we-paper/55 hover:bg-white/[0.05] hover:text-we-paper/80 transition-colors text-sm font-body border border-transparent hover:border-white/[0.08]"
          title="Lixeira"
        >
          <Trash2 size={14} />
          Lixeira
        </button>
        <AddColumnDialog boardId={boardId} slug={slug} />
      </div>

      <BoardTrashSheet
        boardId={boardId}
        slug={slug}
        itemLabel={itemLabel}
        open={trashOpen}
        onOpenChange={setTrashOpen}
        onRestore={onItemsRestored}
      />
    </div>
  )
}
