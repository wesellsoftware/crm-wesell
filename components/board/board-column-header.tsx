'use client'

import { useEffect, useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import type { BoardColumn } from '@/lib/boards/types'
import { deleteColumn, renameColumn } from '@/app/actions/boards'
import { canDeleteBoardColumn, canRenameBoardColumn } from '@/lib/boards/fixed-columns'
import { EditLabelsDialog } from './edit-labels-dialog'
import { cn } from '@/lib/utils'

interface BoardColumnHeaderProps {
  column: BoardColumn
  slug: string
  onUpdate?: (columnId: string, updates: Partial<BoardColumn>) => void
  onDelete?: (columnId: string) => void
}

export function BoardColumnHeader({ column, slug, onUpdate, onDelete }: BoardColumnHeaderProps) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(column.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const isLabelColumn = column.type === 'status' || column.type === 'tags'
  const isRenamable = canRenameBoardColumn(slug, column.name)
  const isDeletable = !column.is_primary && canDeleteBoardColumn(slug, column.name)

  useEffect(() => {
    setDraftName(column.name)
  }, [column.name])

  function saveName() {
    const name = draftName.trim()
    setEditingName(false)
    if (!name || name === column.name) {
      setDraftName(column.name)
      return
    }
    onUpdate?.(column.id, { name })
    startTransition(async () => {
      const result = await renameColumn(column.id, name, slug)
      if (result.error) {
        setDraftName(column.name)
        onUpdate?.(column.id, { name: column.name })
      }
    })
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteColumn(column.id, slug)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      onDelete?.(column.id)
    })
  }

  return (
    <span className="flex items-center gap-1 group/col w-full">
      {editingName && isRenamable ? (
        <input
          autoFocus
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={saveName}
          onKeyDown={e => {
            if (e.key === 'Enter') saveName()
            if (e.key === 'Escape') {
              setDraftName(column.name)
              setEditingName(false)
            }
          }}
          onClick={e => e.stopPropagation()}
          className="h-6 min-w-[80px] max-w-[160px] glass-input rounded px-1.5 outline-none font-body text-xs focus:ring-1 focus:ring-we-blue/40"
        />
      ) : (
        <button
          type="button"
          onClick={isRenamable ? () => setEditingName(true) : undefined}
          className={cn(
            'text-left truncate',
            isRenamable && 'hover:text-we-paper/70 transition-colors'
          )}
          title={isRenamable ? 'Clique para renomear' : undefined}
        >
          {column.name}
        </button>
      )}

      {isLabelColumn && <EditLabelsDialog column={column} slug={slug} />}

      {isDeletable && (
        <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0">
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <span className="font-body text-[10px] text-we-paper/50">Excluir?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="font-body text-[10px] text-we-red hover:text-we-red/80 px-1 py-0.5 rounded hover:bg-we-red/10 transition-colors"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                className="font-body text-[10px] text-we-paper/50 hover:text-we-paper/70 px-1 py-0.5 rounded transition-colors"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-0.5 rounded text-we-paper/30 hover:text-we-red hover:bg-we-red/10 transition-colors"
              title="Excluir coluna"
            >
              <Trash2 size={11} />
            </button>
          )}
        </span>
      )}

      {deleteError && (
        <span className="font-body text-[10px] text-we-red/80 shrink-0">{deleteError}</span>
      )}
    </span>
  )
}
