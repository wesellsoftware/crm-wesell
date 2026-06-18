'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { deleteItem, moveItemToGroup, restoreItem, updateItemName } from '@/app/actions/boards'
import type {
  BoardColumn,
  BoardGroup,
  BoardItem,
  BoardItemValue,
  CellValue,
  OrgMember,
  RelatedItem,
} from '@/lib/boards/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'
import { fireConfettiSideCannons } from '@/lib/confetti-side-cannons'
import { isWonGroupName } from '@/lib/boards/won-group'
import { CellRenderer, getItemValue } from './cells/cell-renderer'
import { CellPopover, cellPopoverOptionClass } from './cells/cell-popover'
import { DrawerSaveProvider, useDrawerSaveNotify } from './drawer-save-context'
import { ItemActivityFeed } from './item-activity-feed'

function upsertLocalValue(
  prev: BoardItemValue[],
  itemId: string,
  columnId: string,
  value: CellValue
): BoardItemValue[] {
  const existing = prev.find(v => v.item_id === itemId && v.column_id === columnId)
  if (existing) {
    return prev.map(v =>
      v.item_id === itemId && v.column_id === columnId ? { ...v, value } : v
    )
  }
  return [...prev, { id: crypto.randomUUID(), item_id: itemId, column_id: columnId, value }]
}

function EditableGroupField({
  groups,
  groupId,
  onChange,
}: {
  groups: BoardGroup[]
  groupId: string
  onChange: (groupId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const group = groups.find(g => g.id === groupId)

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="font-body text-xs text-we-paper/40 flex items-center gap-1.5 hover:text-we-paper/60 hover:bg-white/[0.04] rounded px-1 -mx-1 py-0.5 transition-colors"
      >
        {group ? (
          <>
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: group.color }}
            />
            {group.name}
          </>
        ) : (
          'Selecionar grupo'
        )}
      </button>
      <CellPopover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef}>
        {groups.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              onChange(g.id)
              setOpen(false)
            }}
            className={cn(
              cellPopoverOptionClass,
              'flex items-center gap-2',
              g.id === groupId ? 'bg-white/[0.08] text-we-paper' : 'text-we-paper/70 hover:bg-white/[0.06]'
            )}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: g.color }}
            />
            {g.name}
          </button>
        ))}
      </CellPopover>
    </div>
  )
}

interface BoardItemDrawerProps {
  item: BoardItem | null
  slug: string
  columns: BoardColumn[]
  values: BoardItemValue[]
  members: OrgMember[]
  relatedItems: RelatedItem[]
  groups: BoardGroup[]
  currentUserId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (itemId: string) => void
  onRestored?: (item: BoardItem) => void
  onValueUpdate?: (itemId: string, columnId: string, value: CellValue) => void
  onItemUpdate?: (itemId: string, updates: Partial<BoardItem>) => void
}

export function BoardItemDrawer(props: BoardItemDrawerProps) {
  if (!props.item) return null

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="right"
        className="glass-modal w-[40vw] max-w-[40vw] border-l border-white/[0.08] bg-we-ink/95 p-0 flex flex-col gap-0 text-we-paper"
      >
        <DrawerSaveProvider>
          <BoardItemDrawerContent {...props} item={props.item} />
        </DrawerSaveProvider>
      </SheetContent>
    </Sheet>
  )
}

function BoardItemDrawerContent({
  item,
  slug,
  columns,
  values,
  members,
  relatedItems,
  groups,
  currentUserId,
  open,
  onOpenChange,
  onDeleted,
  onRestored,
  onValueUpdate,
  onItemUpdate,
}: BoardItemDrawerProps & { item: BoardItem }) {
  const notifySaved = useDrawerSaveNotify()
  const { showToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<BoardItemValue[]>(values)
  const [localItem, setLocalItem] = useState<BoardItem | null>(item)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  useEffect(() => {
    setLocalItem(item)
    setEditingName(false)
    setNameDraft(item?.name ?? '')
  }, [item?.id, item?.name, open])

  useEffect(() => {
    setConfirmDelete(false)
    setDeleteError(null)
  }, [item.id, open])

  if (!localItem) return null

  const itemId = localItem.id
  const displayColumns = columns.filter(c => !c.is_primary)
  const relatedNames = Object.fromEntries(relatedItems.map(r => [r.id, r.name]))
  const createdBy = localItem.created_by
    ? members.find(m => m.id === localItem.created_by) ?? null
    : null
  const resolvedValues = localValues.length ? localValues : values

  function handleValueUpdate(updatedItemId: string, columnId: string, value: CellValue) {
    setLocalValues(prev => upsertLocalValue(prev, updatedItemId, columnId, value))
    onValueUpdate?.(updatedItemId, columnId, value)
  }

  function handleNameSave(viaEnter = false) {
    if (!localItem) return
    setEditingName(false)
    const name = nameDraft.trim()
    if (!name || name === localItem.name) {
      setNameDraft(localItem.name)
      if (viaEnter) notifySaved?.()
      return
    }
    setLocalItem(prev => (prev ? { ...prev, name } : prev))
    onItemUpdate?.(itemId, { name })
    startTransition(() => { void updateItemName(itemId, name, slug) })
    if (viaEnter) notifySaved?.()
  }

  function handleGroupChange(groupId: string) {
    if (!localItem || groupId === localItem.group_id) return

    const targetGroup = groups.find(g => g.id === groupId)
    const wasInWon = groups.some(
      g => g.id === localItem.group_id && isWonGroupName(g.name)
    )
    if (targetGroup && isWonGroupName(targetGroup.name) && !wasInWon) {
      fireConfettiSideCannons()
    }

    setLocalItem(prev => (prev ? { ...prev, group_id: groupId } : prev))
    onItemUpdate?.(itemId, { group_id: groupId })
    startTransition(() => { void moveItemToGroup(itemId, groupId, slug) })
  }

  function handleDelete() {
    if (!localItem) return
    setDeleteError(null)
    const deletedItem = { ...localItem }
    startTransition(async () => {
      const result = await deleteItem(itemId, slug)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      onDeleted?.(itemId)
      setConfirmDelete(false)
      onOpenChange(false)
      showToast({
        message: `"${deletedItem.name}" excluído`,
        action: {
          label: 'Desfazer',
          onClick: async () => {
            const restoreResult = await restoreItem(itemId, slug)
            if (restoreResult.error) return
            onRestored?.(deletedItem)
          },
        },
      })
    })
  }

  return (
    <>
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <SheetTitle className="sr-only">{localItem.name}</SheetTitle>
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={() => handleNameSave()}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNameSave(true)
                if (e.key === 'Escape') {
                  setNameDraft(localItem.name)
                  setEditingName(false)
                }
              }}
              className="w-full glass-input rounded px-2 py-1.5 outline-none font-display text-xl text-we-paper font-medium focus:ring-1 focus:ring-we-blue/40 pr-8"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameDraft(localItem.name)
                setEditingName(true)
              }}
              className="font-display text-xl text-we-paper text-left w-full pr-8 rounded px-1 -mx-1 py-0.5 hover:bg-white/[0.05] transition-colors"
            >
              {localItem.name}
            </button>
          )}
          {groups.length > 0 && (
            <EditableGroupField
              groups={groups}
              groupId={localItem.group_id}
              onChange={handleGroupChange}
            />
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 glass-scrollbar">
          <section>
            <h3 className="font-body text-sm font-medium text-we-paper/80 mb-3">Informações</h3>
            <div className="space-y-3">
              {displayColumns.map(col => (
                <div
                  key={col.id}
                  className="flex flex-col gap-1.5 py-2 border-b border-white/[0.06] last:border-0"
                >
                  <span className="font-body text-xs text-we-paper/45 uppercase tracking-wide">
                    {col.name}
                  </span>
                  <div
                    className="font-body text-sm text-we-paper/85 min-h-[28px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <CellRenderer
                      column={col}
                      itemId={itemId}
                      value={getItemValue(resolvedValues, itemId, col.id)}
                      slug={slug}
                      members={members}
                      relatedItems={relatedItems}
                      onUpdate={handleValueUpdate}
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-1 pt-2">
                <span className="font-body text-xs text-we-paper/45 uppercase tracking-wide">
                  Criado em
                </span>
                <span className="font-mono text-xs text-we-paper/50">
                  {new Date(localItem.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {slug === 'negociacoes' && (
              <div className="pt-3">
                <Link
                  href="/boards/negociacoes/kanban"
                  className="font-body text-xs text-we-blue hover:underline"
                >
                  Ver no pipeline →
                </Link>
              </div>
            )}
          </section>

          <section className="border-t border-white/[0.06] pt-4">
            <ItemActivityFeed
              item={localItem}
              slug={slug}
              columns={columns}
              members={members}
              relatedNames={relatedNames}
              createdBy={createdBy}
              currentUserId={currentUserId}
            />
          </section>

          <section className="border-t border-white/[0.06] pt-4 pb-6">
            {confirmDelete ? (
              <div className="rounded-lg border border-we-red/20 bg-we-red/5 p-4 space-y-3">
                <p className="font-body text-sm text-we-paper/80">
                  Mover <span className="font-medium text-we-paper">{localItem.name}</span> para a lixeira?
                </p>
                <p className="font-body text-xs text-we-paper/45">
                  Você poderá restaurar este item na lixeira do board.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-md bg-we-red/90 text-white text-xs font-body hover:bg-we-red transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Movendo…' : 'Mover para lixeira'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-md text-xs font-body text-we-paper/50 hover:text-we-paper/70 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-we-paper/40 hover:text-we-red hover:bg-we-red/10 transition-colors text-sm font-body"
              >
                <Trash2 size={14} />
                Excluir item
              </button>
            )}
            {deleteError && (
              <p className="mt-2 font-body text-xs text-we-red/80">{deleteError}</p>
            )}
          </section>
        </div>
    </>
  )
}

// Backward-compatible alias
export { BoardItemDrawer as DealDetailDialog }
