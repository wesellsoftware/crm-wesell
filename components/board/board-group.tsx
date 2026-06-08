'use client'

import { useMemo, useState, useTransition, type ComponentPropsWithoutRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BoardColumn, BoardGroup, BoardItem, BoardItemValue, CellValue, OrgMember, RelatedItem } from '@/lib/boards/types'
import { CellRenderer, getItemValue } from './cells/cell-renderer'
import { AddItemRow } from './add-item-row'
import { BoardGroupFooter } from './board-group-footer'
import { updateGroup, updateItemName } from '@/app/actions/boards'
import { MoveToContactsButton } from './move-to-contacts-button'
import { MoveToNegociacoesButton } from './move-to-negociacoes-button'
import { BoardColumnHeader } from './board-column-header'
import { GroupHeader } from './group-header'

interface BoardGroupSectionProps {
  group: BoardGroup
  columns: BoardColumn[]
  items: BoardItem[]
  values: BoardItemValue[]
  slug: string
  boardId: string
  members: OrgMember[]
  relatedItems: RelatedItem[]
  localValues: BoardItemValue[]
  onValueUpdate: (itemId: string, columnId: string, value: CellValue) => void
  searchQuery: string
  autoAddOpen?: boolean
  onAutoAddDone?: () => void
  onGroupUpdate: (groupId: string, updates: Partial<BoardGroup>) => void
  onGroupDelete: (groupId: string) => void
  onItemsReorder: (groupId: string, itemIds: string[]) => void
  onColumnUpdate?: (columnId: string, updates: Partial<BoardColumn>) => void
  onColumnDelete?: (columnId: string) => void
  dragHandleProps?: ComponentPropsWithoutRef<'button'>
  onItemOpen?: (item: BoardItem) => void
}

interface SortableItemRowProps {
  item: BoardItem
  group: BoardGroup
  columns: BoardColumn[]
  values: BoardItemValue[]
  localValues: BoardItemValue[]
  slug: string
  members: OrgMember[]
  relatedItems: RelatedItem[]
  onValueUpdate: (itemId: string, columnId: string, value: CellValue) => void
  editingNames: Record<string, string>
  setEditingNames: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onNameEdit: (itemId: string, name: string) => void
  canReorder: boolean
  onItemOpen?: (item: BoardItem) => void
}

function SortableItemRow({
  item,
  group,
  columns,
  values,
  localValues,
  slug,
  members,
  relatedItems,
  onValueUpdate,
  editingNames,
  setEditingNames,
  onNameEdit,
  canReorder,
  onItemOpen,
}: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', groupId: group.id },
    disabled: !canReorder,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  const draft = editingNames[item.id] ?? item.name
  const isEditing = item.id in editingNames
  const opensDetail = !!onItemOpen

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group/row',
        opensDetail && 'cursor-pointer'
      )}
      onClick={opensDetail ? () => onItemOpen?.(item) : undefined}
    >
      <td className="px-2 py-2 border-r border-white/[0.03]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          {canReorder && (
            <button
              type="button"
              className="p-0.5 rounded text-we-paper/20 hover:text-we-paper/50 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover/row:opacity-100 transition-opacity"
              aria-label="Arrastar para reordenar"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={12} />
            </button>
          )}
          <div
            className="w-1 h-8 rounded-full shrink-0"
            style={{ backgroundColor: group.color }}
          />
        </div>
      </td>
      {columns.map(col => {
        if (col.is_primary) {
          return (
            <td key={col.id} className="px-3 py-2 border-r border-white/[0.03]">
              {isEditing ? (
                <input
                  autoFocus
                  value={draft}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setEditingNames(prev => ({ ...prev, [item.id]: e.target.value }))}
                  onBlur={() => {
                    const name = editingNames[item.id] ?? item.name
                    setEditingNames(prev => {
                      const next = { ...prev }
                      delete next[item.id]
                      return next
                    })
                    if (name !== item.name) onNameEdit(item.id, name)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const name = editingNames[item.id] ?? item.name
                      setEditingNames(prev => {
                        const next = { ...prev }
                        delete next[item.id]
                        return next
                      })
                      if (name !== item.name) onNameEdit(item.id, name)
                    }
                  }}
                  className="w-full glass-input rounded px-2 py-1 outline-none font-body text-sm text-we-paper font-medium focus:ring-1 focus:ring-we-blue/40"
                />
              ) : (
                <button
                  type="button"
                  onClick={opensDetail ? undefined : () => setEditingNames(prev => ({ ...prev, [item.id]: item.name }))}
                  onDoubleClick={opensDetail ? e => {
                    e.stopPropagation()
                    setEditingNames(prev => ({ ...prev, [item.id]: item.name }))
                  } : undefined}
                  className="font-body text-sm text-we-paper/90 font-medium px-1 py-0.5 rounded text-left w-full hover:text-we-paper"
                >
                  {item.name}
                </button>
              )}
            </td>
          )
        }
        return (
          <td
            key={col.id}
            className="px-3 py-2 border-r border-white/[0.03] last:border-r-0"
            onClick={e => e.stopPropagation()}
          >
            <CellRenderer
              column={col}
              itemId={item.id}
              value={getItemValue(localValues.length ? localValues : values, item.id, col.id)}
              slug={slug}
              members={members}
              relatedItems={relatedItems}
              onUpdate={onValueUpdate}
            />
          </td>
        )
      })}
      {slug === 'leads' && (
        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-1.5">
            <MoveToNegociacoesButton itemId={item.id} />
            <MoveToContactsButton itemId={item.id} />
          </div>
        </td>
      )}
    </tr>
  )
}

export function BoardGroupSection({
  group,
  columns,
  items,
  values,
  slug,
  boardId,
  members,
  relatedItems,
  localValues,
  onValueUpdate,
  searchQuery,
  autoAddOpen,
  onAutoAddDone,
  onGroupUpdate,
  onGroupDelete,
  onItemsReorder,
  onColumnUpdate,
  onColumnDelete,
  dragHandleProps,
  onItemOpen,
}: BoardGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(group.collapsed)
  const [, startTransition] = useTransition()
  const [editingNames, setEditingNames] = useState<Record<string, string>>({})

  const canReorder = !searchQuery

  const groupItems = useMemo(
    () =>
      items
        .filter(i => i.group_id === group.id)
        .sort((a, b) => a.position - b.position)
        .filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [items, group.id, searchQuery]
  )

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => { void updateGroup(group.id, { collapsed: next }, slug) })
  }

  function handleNameEdit(itemId: string, name: string) {
    startTransition(() => { void updateItemName(itemId, name, slug) })
  }

  function handleItemDragEnd(event: DragEndEvent) {
    if (event.active.data.current?.type !== 'item') return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groupItems.findIndex(i => i.id === active.id)
    const newIndex = groupItems.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(groupItems, oldIndex, newIndex)
    onItemsReorder(group.id, reordered.map(i => i.id))
  }

  const itemRows = groupItems.map(item => (
    <SortableItemRow
      key={item.id}
      item={item}
      group={group}
      columns={columns}
      values={values}
      localValues={localValues}
      slug={slug}
      members={members}
      relatedItems={relatedItems}
      onValueUpdate={onValueUpdate}
      editingNames={editingNames}
      setEditingNames={setEditingNames}
      onNameEdit={handleNameEdit}
      canReorder={canReorder}
      onItemOpen={onItemOpen}
    />
  ))

  return (
    <div className="mb-5">
      <GroupHeader
        group={group}
        slug={slug}
        itemCount={groupItems.length}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onUpdate={updates => onGroupUpdate(group.id, updates)}
        onDelete={() => onGroupDelete(group.id)}
        dragHandleProps={dragHandleProps}
      />

      {!collapsed && (
        <div className="glass rounded-xl overflow-x-auto glass-scrollbar">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="w-10 px-2 py-2.5 border-r border-white/[0.04]" />
                {columns.map(col => (
                  <th
                    key={col.id}
                    className={cn(
                      'px-3 py-2.5 text-left font-body text-xs text-we-paper/45 font-medium whitespace-nowrap border-r border-white/[0.04] last:border-r-0',
                      col.is_primary && 'min-w-[180px]'
                    )}
                  >
                    <BoardColumnHeader
                      column={col}
                      slug={slug}
                      onUpdate={onColumnUpdate}
                      onDelete={onColumnDelete}
                    />
                  </th>
                ))}
                {slug === 'leads' && (
                  <th className="px-3 py-2.5 text-left font-body text-xs text-we-paper/45 font-medium">
                    Ação
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {canReorder ? (
                <DndContext
                  sensors={itemSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleItemDragEnd}
                >
                  <SortableContext
                    items={groupItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {itemRows}
                  </SortableContext>
                </DndContext>
              ) : (
                itemRows
              )}
              <AddItemRow
                boardId={boardId}
                groupId={group.id}
                slug={slug}
                colSpan={columns.length + (slug === 'leads' ? 2 : 1)}
                label={`+ Adicionar ${slug === 'leads' ? 'lead' : slug === 'contatos' ? 'contato' : slug === 'contas' ? 'conta' : 'oportunidade'}`}
                autoOpen={autoAddOpen}
                onAutoOpenDone={onAutoAddDone}
              />
            </tbody>
            <BoardGroupFooter
              groupItems={groupItems}
              columns={columns}
              values={localValues.length ? localValues : values}
              extraCols={slug === 'leads' ? 1 : 0}
            />
          </table>
        </div>
      )}
    </div>
  )
}
