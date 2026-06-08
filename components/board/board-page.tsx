'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import type { BoardColumn, BoardData } from '@/lib/boards/types'
import { reorderColumns, updateColumnSettings } from '@/app/actions/boards'
import { sortColumnsByPosition } from '@/lib/boards/column-layout'
import { PageTitle } from '@/components/page-title'
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
  currentUserId?: string | null
}

export function BoardPageClient({ data, currentUserId }: BoardPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [autoAddGroupId, setAutoAddGroupId] = useState<string | null>(null)
  const [localColumns, setLocalColumns] = useState(() => sortColumnsByPosition(data.columns))
  const [, startColumnTransition] = useTransition()
  const { board, groups, items, values, members, relatedItems } = data
  const itemLabel = ITEM_LABELS[board.slug] ?? 'item'

  useEffect(() => {
    setLocalColumns(sortColumnsByPosition(data.columns))
  }, [data.columns])

  function handleColumnUpdate(columnId: string, updates: Partial<BoardColumn>) {
    setLocalColumns(prev =>
      prev.map(col => (col.id === columnId ? { ...col, ...updates } : col))
    )
  }

  function handleColumnDelete(columnId: string) {
    setLocalColumns(prev => prev.filter(col => col.id !== columnId))
  }

  function handleColumnsReorder(columnIds: string[]) {
    setLocalColumns(prev => {
      const map = new Map(prev.map(col => [col.id, col]))
      return columnIds.map((id, index) => ({
        ...map.get(id)!,
        position: index,
      }))
    })
    startColumnTransition(() => {
      void reorderColumns(board.id, columnIds, board.slug)
    })
  }

  function handleColumnWidthChange(columnId: string, width: number) {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === columnId
          ? { ...col, settings: { ...col.settings, width } }
          : col
      )
    )
  }

  function handleColumnWidthPersist(columnId: string, width: number) {
    setLocalColumns(prev => {
      const next = prev.map(col =>
        col.id === columnId
          ? { ...col, settings: { ...col.settings, width } }
          : col
      )
      const column = next.find(col => col.id === columnId)
      if (column) {
        startColumnTransition(() => {
          void updateColumnSettings(columnId, column.settings, board.slug)
        })
      }
      return next
    })
  }

  function handleCreateClick() {
    if (groups.length > 0) {
      setAutoAddGroupId(groups[0].id)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 pb-2 shrink-0 border-b border-white/[0.06]">
        <PageTitle>{board.name}</PageTitle>
        <div className="flex items-center gap-4 mt-2">
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
        ) : localColumns.length === 0 ? (
          <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
            <p className="font-body text-we-paper/50">Nenhuma coluna configurada.</p>
          </div>
        ) : (
          <BoardTable
            boardId={board.id}
            slug={board.slug}
            groups={groups}
            columns={localColumns}
            items={items}
            values={values}
            members={members}
            relatedItems={relatedItems}
            searchQuery={searchQuery}
            autoAddGroupId={autoAddGroupId}
            onAutoAddDone={() => setAutoAddGroupId(null)}
            onColumnUpdate={handleColumnUpdate}
            onColumnDelete={handleColumnDelete}
            onColumnsReorder={handleColumnsReorder}
            onColumnWidthChange={handleColumnWidthChange}
            onColumnWidthPersist={handleColumnWidthPersist}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  )
}
