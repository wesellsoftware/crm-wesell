'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BoardData } from '@/lib/boards/types'
import { BoardToolbar } from './board-toolbar'
import { BoardTable } from './board-table'

const ITEM_LABELS: Record<string, string> = {
  leads: 'lead',
  contatos: 'contato',
  negociacoes: 'oportunidade',
  contas: 'conta',
}

interface BoardPageClientProps {
  data: BoardData
}

export function BoardPageClient({ data }: BoardPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [autoAddGroupId, setAutoAddGroupId] = useState<string | null>(null)
  const { board, groups, columns, items, values, members, relatedItems } = data
  const itemLabel = ITEM_LABELS[board.slug] ?? 'item'

  function handleCreateClick() {
    if (groups.length > 0) {
      setAutoAddGroupId(groups[0].id)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-0 shrink-0 border-b border-white/[0.06]">
        <h1 className="font-display text-2xl text-we-paper">{board.name}</h1>
        <div className="flex items-center gap-4 mt-3">
          <span className="font-body text-sm text-we-blue border-b-2 border-we-blue pb-2 font-medium">
            Quadro principal
          </span>
          {board.slug === 'negociacoes' && (
            <Link
              href="/boards/negociacoes/kanban"
              className="font-body text-sm text-we-paper/45 hover:text-we-paper/70 pb-2 transition-colors"
            >
              Pipeline
            </Link>
          )}
        </div>
      </div>

      <BoardToolbar
        slug={board.slug}
        boardId={board.id}
        itemLabel={itemLabel}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={handleCreateClick}
      />

      <div className="flex-1 px-6 py-4">
        {groups.length === 0 ? (
          <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
            <p className="font-body text-we-paper/50">Nenhum grupo neste board.</p>
            <p className="font-body text-we-paper/35 text-sm">Recarregue a página para tentar novamente.</p>
          </div>
        ) : columns.length === 0 ? (
          <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
            <p className="font-body text-we-paper/50">Nenhuma coluna configurada.</p>
          </div>
        ) : (
          <BoardTable
            boardId={board.id}
            slug={board.slug}
            groups={groups}
            columns={columns}
            items={items}
            values={values}
            members={members}
            relatedItems={relatedItems}
            searchQuery={searchQuery}
            autoAddGroupId={autoAddGroupId}
            onAutoAddDone={() => setAutoAddGroupId(null)}
          />
        )}
      </div>
    </div>
  )
}
