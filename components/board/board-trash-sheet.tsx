'use client'

import { useEffect, useState, useTransition } from 'react'
import { Trash2, RotateCcw, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { emptyBoardTrash, getTrashItems, restoreItem } from '@/app/actions/boards'
import type { DeletedBoardItem } from '@/lib/boards/types'

interface BoardTrashSheetProps {
  boardId: string
  slug: string
  itemLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore?: () => void
}

export function BoardTrashSheet({
  boardId,
  slug,
  itemLabel,
  open,
  onOpenChange,
  onRestore,
}: BoardTrashSheetProps) {
  const [items, setItems] = useState<DeletedBoardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setConfirmEmpty(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    void getTrashItems(boardId).then(result => {
      if (result.error) {
        setError(result.error)
        setItems([])
      } else {
        setItems(result.items)
      }
      setLoading(false)
    })
  }, [open, boardId])

  function handleRestore(itemId: string) {
    setRestoringId(itemId)
    setError(null)
    startTransition(async () => {
      const result = await restoreItem(itemId, slug)
      if (result.error) {
        setError(result.error)
        setRestoringId(null)
        return
      }
      setItems(prev => prev.filter(i => i.id !== itemId))
      setRestoringId(null)
      onRestore?.()
    })
  }

  function handleEmptyTrash() {
    setError(null)
    startTransition(async () => {
      const result = await emptyBoardTrash(boardId, slug)
      if (result.error) {
        setError(result.error)
        setConfirmEmpty(false)
        return
      }
      setItems([])
      setConfirmEmpty(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-modal w-full sm:max-w-md border-l border-white/[0.08] bg-we-ink/95 p-0 flex flex-col gap-0 text-we-paper"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <SheetTitle className="font-display text-xl text-we-paper flex items-center gap-2">
            <Trash2 size={18} className="text-we-paper/50" />
            Lixeira
          </SheetTitle>
          <p className="font-body text-xs text-we-paper/40">
            {items.length === 1
              ? `1 ${itemLabel} excluído`
              : `${items.length} ${itemLabel}s excluídos`}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 glass-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-we-paper/40">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="font-body text-sm text-we-paper/40 text-center py-12">
              A lixeira está vazia.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map(item => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-we-paper/90 truncate">{item.name}</p>
                    <p className="font-body text-xs text-we-paper/40 mt-0.5">{item.group_name}</p>
                    <p className="font-mono text-[10px] text-we-paper/30 mt-1">
                      {new Date(item.deleted_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    disabled={isPending && restoringId === item.id}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-body text-we-blue hover:bg-we-blue/10 transition-colors disabled:opacity-50"
                    title="Restaurar"
                  >
                    {isPending && restoringId === item.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RotateCcw size={13} />
                    )}
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
            {confirmEmpty ? (
              <div className="flex flex-col gap-2">
                <p className="font-body text-xs text-we-paper/60">
                  Excluir permanentemente {items.length}{' '}
                  {items.length === 1 ? itemLabel : `${itemLabel}s`}? Esta ação não pode ser desfeita.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 rounded-lg bg-we-red/90 text-white text-sm font-body hover:bg-we-red transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Excluindo…' : 'Esvaziar lixeira'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmEmpty(false)}
                    disabled={isPending}
                    className="px-3 py-2 rounded-lg text-sm font-body text-we-paper/50 hover:text-we-paper/70 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEmpty(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-we-red/30 text-we-red text-sm font-body hover:bg-we-red/10 transition-colors"
              >
                <Trash2 size={14} />
                Esvaziar lixeira
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="px-5 pb-4 font-body text-xs text-we-red/80">{error}</p>
        )}
      </SheetContent>
    </Sheet>
  )
}
