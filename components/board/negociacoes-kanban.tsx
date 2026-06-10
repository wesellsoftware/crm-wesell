'use client'

import { useEffect, useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { formatCurrency } from '@/lib/utils'
import { moveItemToGroup } from '@/app/actions/boards'
import { fireConfettiSideCannons } from '@/lib/confetti-side-cannons'
import { isWonGroupName } from '@/lib/boards/won-group'
import type {
  BoardColumn,
  BoardGroup,
  BoardItem,
  BoardItemValue,
  CellValue,
  OrgMember,
  RelatedItem,
} from '@/lib/boards/types'
import { AvatarGroup } from '@/components/ui/avatar'
import { PageTitle } from '@/components/page-title'
import { MemberAvatar } from './cells/member-avatar'
import { BoardItemDrawer } from './board-item-drawer'
import { BoardTrashSheet } from './board-trash-sheet'

function getResponsibleMembers(
  itemId: string,
  values: BoardItemValue[],
  personColumnId: string | undefined,
  members: OrgMember[]
): OrgMember[] {
  if (!personColumnId) return []
  const personVal = values.find(
    v => v.item_id === itemId && v.column_id === personColumnId
  )?.value as { user_ids?: string[] } | undefined
  const ids = personVal?.user_ids ?? []
  return members.filter(m => ids.includes(m.id))
}

function KanbanDealCard({
  item,
  value,
  contactName,
  responsibleMembers,
  onOpen,
  suppressClick,
}: {
  item: BoardItem
  value?: number
  contactName?: string
  responsibleMembers: OrgMember[]
  onOpen: (item: BoardItem) => void
  suppressClick?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging && !suppressClick) onOpen(item)
      }}
      className={`glass rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing hover:bg-white/[0.06] transition-colors ${isDragging ? 'opacity-40' : ''}`}
    >
      <p className="font-body text-sm text-we-paper/90 font-medium">{item.name}</p>
      {contactName && <p className="font-body text-xs text-we-paper/45">{contactName}</p>}
      {responsibleMembers.length > 0 && (
        <AvatarGroup className="*:data-[slot=avatar]:ring-[#2F2935]">
          {responsibleMembers.map(m => (
            <MemberAvatar
              key={m.id}
              member={m}
              size="sm"
              title={m.full_name ?? ''}
            />
          ))}
        </AvatarGroup>
      )}
      {value ? <p className="font-mono text-xs text-we-green">{formatCurrency(value)}</p> : null}
    </div>
  )
}

function KanbanGroupColumn({
  group,
  items,
  values,
  valueColumnId,
  contactColumnId,
  personColumnId,
  members,
  relatedNames,
  onOpenDeal,
}: {
  group: BoardGroup
  items: BoardItem[]
  values: BoardItemValue[]
  valueColumnId?: string
  contactColumnId?: string
  personColumnId?: string
  members: OrgMember[]
  relatedNames: Record<string, string>
  onOpenDeal: (item: BoardItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })

  function getVal(itemId: string, colId?: string) {
    if (!colId) return undefined
    return values.find(v => v.item_id === itemId && v.column_id === colId)?.value
  }

  const total = items.reduce((sum, item) => {
    const v = getVal(item.id, valueColumnId) as { amount?: number } | undefined
    return sum + (v?.amount ?? 0)
  }, 0)

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} />
          <span
            className="font-body text-sm font-semibold"
            style={{ color: group.color }}
          >
            {group.name}
          </span>
          <span className="font-mono text-xs text-we-paper/35 bg-white/[0.07] rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <span className="font-mono text-xs text-we-paper/40">{formatCurrency(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 min-h-[120px] rounded-xl p-2 transition-colors"
        style={{
          background: isOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        {items.map(item => {
          const val = getVal(item.id, valueColumnId) as { amount?: number } | undefined
          const contactVal = getVal(item.id, contactColumnId) as { item_ids?: string[] } | undefined
          const contactId = contactVal?.item_ids?.[0]
          const responsibleMembers = getResponsibleMembers(
            item.id,
            values,
            personColumnId,
            members
          )
          return (
            <KanbanDealCard
              key={item.id}
              item={item}
              value={val?.amount}
              contactName={contactId ? relatedNames[contactId] : undefined}
              responsibleMembers={responsibleMembers}
              onOpen={onOpenDeal}
            />
          )
        })}
        {items.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="font-mono text-[11px] text-we-paper/20">Arraste uma oportunidade aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface NegociacoesKanbanProps {
  boardId: string
  groups: BoardGroup[]
  itemsByGroup: Record<string, BoardItem[]>
  values: BoardItemValue[]
  columns: BoardColumn[]
  members: OrgMember[]
  relatedItems: RelatedItem[]
  valueColumnId?: string
  contactColumnId?: string
  personColumnId?: string
  relatedNames: Record<string, string>
  currentUserId?: string | null
}

export function NegociacoesKanban({
  boardId,
  groups,
  itemsByGroup,
  values,
  columns,
  members,
  relatedItems,
  valueColumnId,
  contactColumnId,
  personColumnId,
  relatedNames,
  currentUserId,
}: NegociacoesKanbanProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [localItemsByGroup, setLocalItemsByGroup] = useState(itemsByGroup)
  const [localGroups, setLocalGroups] = useState(groups)
  const [localValues, setLocalValues] = useState(values)
  const didDragRef = useRef(false)

  useEffect(() => {
    setLocalGroups(groups)
    setLocalItemsByGroup(itemsByGroup)
    setLocalValues(values)
  }, [groups, itemsByGroup, values])

  useEffect(() => {
    setSelectedItem(prev => {
      if (!prev) return null
      const updated = Object.values(localItemsByGroup).flat().find(i => i.id === prev.id)
      return updated ?? prev
    })
  }, [localItemsByGroup])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const groupId = over.id as string

    if (!localGroups.some(g => g.id === groupId)) return

    const targetGroup = localGroups.find(g => g.id === groupId)
    const item = Object.values(itemsByGroup).flat().find(i => i.id === itemId)
    const wasInWon = item
      ? localGroups.some(g => g.id === item.group_id && isWonGroupName(g.name))
      : false

    if (targetGroup && isWonGroupName(targetGroup.name) && !wasInWon) {
      fireConfettiSideCannons()
    }

    setLocalItemsByGroup(prev => {
      const next: Record<string, BoardItem[]> = {}
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter(i => i.id !== itemId)
      }
      const item = Object.values(itemsByGroup).flat().find(i => i.id === itemId)
      if (item) {
        next[groupId] = [...(next[groupId] ?? []), { ...item, group_id: groupId }]
      }
      return next
    })

    startTransition(() => { void moveItemToGroup(itemId, groupId, 'negociacoes') })
  }

  function handleItemDeleted(itemId: string) {
    setLocalItemsByGroup(prev => {
      const next: Record<string, BoardItem[]> = {}
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter(i => i.id !== itemId)
      }
      return next
    })
    setSelectedItem(null)
  }

  function handleItemRestored(item: BoardItem) {
    setLocalItemsByGroup(prev => {
      const groupId = item.group_id
      const groupItems = prev[groupId] ?? []
      if (groupItems.some(i => i.id === item.id)) return prev
      return {
        ...prev,
        [groupId]: [...groupItems, item].sort((a, b) => a.position - b.position),
      }
    })
  }

  function handleValueUpdate(itemId: string, columnId: string, value: CellValue) {
    setLocalValues(prev => {
      const existing = prev.find(v => v.item_id === itemId && v.column_id === columnId)
      if (existing) {
        return prev.map(v =>
          v.item_id === itemId && v.column_id === columnId ? { ...v, value } : v
        )
      }
      return [...prev, { id: crypto.randomUUID(), item_id: itemId, column_id: columnId, value }]
    })
  }

  function handleItemUpdate(itemId: string, updates: Partial<BoardItem>) {
    setLocalItemsByGroup(prev => {
      const next: Record<string, BoardItem[]> = {}
      for (const [groupId, groupItems] of Object.entries(prev)) {
        next[groupId] = groupItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }
      if (updates.group_id) {
        const item = Object.values(next).flat().find(i => i.id === itemId)
        if (item) {
          for (const groupId of Object.keys(next)) {
            next[groupId] = next[groupId].filter(i => i.id !== itemId)
          }
          next[updates.group_id] = [...(next[updates.group_id] ?? []), item]
        }
      }
      return next
    })
    setSelectedItem(prev => (prev?.id === itemId ? { ...prev, ...updates } : prev))
  }

  const activeItem = activeId
    ? Object.values(localItemsByGroup).flat().find(i => i.id === activeId)
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-6 pb-2 shrink-0">
        <PageTitle>Negociações</PageTitle>
        <div className="flex items-center gap-4 mt-2 border-b border-white/[0.06]">
          <Link
            href="/boards/negociacoes"
            className="font-body text-sm text-we-paper/40 hover:text-we-paper/60 pb-2 transition-colors"
          >
            Quadro principal
          </Link>
          <span className="font-body text-sm text-we-blue border-b-2 border-we-blue pb-2 -mb-px">
            Pipeline
          </span>
          <button
            type="button"
            onClick={() => setTrashOpen(true)}
            className="ml-auto flex items-center gap-1.5 font-body text-sm text-we-paper/40 hover:text-we-paper/60 pb-2 transition-colors"
          >
            <Trash2 size={14} />
            Lixeira
          </button>
        </div>
      </div>

      {localGroups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8">
          <p className="font-body text-sm text-we-paper/40 text-center max-w-sm">
            Nenhum grupo no quadro principal. Crie grupos em{' '}
            <Link href="/boards/negociacoes" className="text-we-blue hover:underline">
              Quadro principal
            </Link>{' '}
            para exibir colunas aqui.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => {
            didDragRef.current = true
            setActiveId(e.active.id as string)
          }}
          onDragEnd={event => {
            handleDragEnd(event)
            setTimeout(() => { didDragRef.current = false }, 0)
          }}
        >
          <div className="flex-1 overflow-x-auto px-8 py-6">
            <div className="flex gap-4 h-full min-w-max">
              {localGroups.map(group => (
                <KanbanGroupColumn
                  key={group.id}
                  group={group}
                  items={localItemsByGroup[group.id] ?? []}
                  values={values}
                  valueColumnId={valueColumnId}
                  contactColumnId={contactColumnId}
                  personColumnId={personColumnId}
                  members={members}
                  relatedNames={relatedNames}
                  onOpenDeal={item => {
                    if (!didDragRef.current) setSelectedItem(item)
                  }}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeItem && (
              <KanbanDealCard
                item={activeItem}
                responsibleMembers={getResponsibleMembers(
                  activeItem.id,
                  values,
                  personColumnId,
                  members
                )}
                onOpen={() => {}}
                suppressClick
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <BoardItemDrawer
        item={selectedItem}
        slug="negociacoes"
        columns={columns}
        values={localValues.length ? localValues : values}
        members={members}
        relatedItems={relatedItems}
        groups={localGroups}
        currentUserId={currentUserId}
        open={selectedItem !== null}
        onOpenChange={open => { if (!open) setSelectedItem(null) }}
        onDeleted={handleItemDeleted}
        onRestored={handleItemRestored}
        onValueUpdate={handleValueUpdate}
        onItemUpdate={handleItemUpdate}
      />

      <BoardTrashSheet
        boardId={boardId}
        slug="negociacoes"
        itemLabel="oportunidade"
        open={trashOpen}
        onOpenChange={setTrashOpen}
        onRestore={() => router.refresh()}
      />
    </div>
  )
}
