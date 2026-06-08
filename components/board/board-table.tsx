'use client'

import { useEffect, useState, useTransition, type ComponentPropsWithoutRef } from 'react'
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
import type { BoardColumn, BoardGroup, BoardItem, BoardItemValue, CellValue, OrgMember, RelatedItem } from '@/lib/boards/types'
import { reorderGroups, reorderItems } from '@/app/actions/boards'
import { BoardGroupSection } from './board-group'
import { AddGroupButton } from './add-group-button'
import { BoardItemDrawer } from './board-item-drawer'

function sortGroupsByPosition(groups: BoardGroup[]) {
  return [...groups].sort((a, b) => a.position - b.position)
}

interface SortableBoardGroupProps {
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
  onItemOpen?: (item: BoardItem) => void
}

function SortableBoardGroup(props: SortableBoardGroupProps) {
  const { group } = props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: { type: 'group' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BoardGroupSection
        {...props}
        dragHandleProps={{ ...attributes, ...listeners } as ComponentPropsWithoutRef<'button'>}
      />
    </div>
  )
}

interface BoardTableProps {
  boardId: string
  slug: string
  groups: BoardGroup[]
  columns: BoardColumn[]
  items: BoardItem[]
  values: BoardItemValue[]
  members: OrgMember[]
  relatedItems: RelatedItem[]
  searchQuery: string
  autoAddGroupId?: string | null
  onAutoAddDone?: () => void
  onColumnUpdate?: (columnId: string, updates: Partial<BoardColumn>) => void
  onColumnDelete?: (columnId: string) => void
  currentUserId?: string | null
}

export function BoardTable({
  boardId,
  slug,
  groups,
  columns,
  items,
  values,
  members,
  relatedItems,
  searchQuery,
  autoAddGroupId,
  onAutoAddDone,
  onColumnUpdate,
  onColumnDelete,
  currentUserId,
}: BoardTableProps) {
  const [localValues, setLocalValues] = useState<BoardItemValue[]>(values)
  const [localItems, setLocalItems] = useState<BoardItem[]>(items)
  const [localGroups, setLocalGroups] = useState(() => sortGroupsByPosition(groups))
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null)
  const [, startReorder] = useTransition()
  const [, startItemReorder] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    setLocalGroups(sortGroupsByPosition(groups))
  }, [groups])

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  function handleGroupUpdate(groupId: string, updates: Partial<BoardGroup>) {
    setLocalGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, ...updates } : g))
    )
  }

  function handleGroupDelete(groupId: string) {
    setLocalGroups(prev => prev.filter(g => g.id !== groupId))
  }

  function handleGroupCreated(group: BoardGroup) {
    setLocalGroups(prev => sortGroupsByPosition([...prev, group]))
  }

  function handleItemsReorder(groupId: string, orderedIds: string[]) {
    setLocalItems(prev =>
      prev.map(item => {
        if (item.group_id !== groupId) return item
        const index = orderedIds.indexOf(item.id)
        return index === -1 ? item : { ...item, position: index }
      })
    )
    startItemReorder(() => {
      void reorderItems(groupId, orderedIds, slug)
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.active.data.current?.type !== 'group') return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localGroups.findIndex(g => g.id === active.id)
    const newIndex = localGroups.findIndex(g => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localGroups, oldIndex, newIndex).map((g, index) => ({
      ...g,
      position: index,
    }))
    setLocalGroups(reordered)

    startReorder(() => {
      void reorderGroups(boardId, reordered.map(g => g.id), slug)
    })
  }

  function handleValueUpdate(itemId: string, columnId: string, value: CellValue) {
    setLocalValues(prev => {
      const existing = prev.find(v => v.item_id === itemId && v.column_id === columnId)
      if (existing) {
        return prev.map(v =>
          v.item_id === itemId && v.column_id === columnId
            ? { ...v, value }
            : v
        )
      }
      return [...prev, { id: crypto.randomUUID(), item_id: itemId, column_id: columnId, value }]
    })
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={localGroups.map(g => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {localGroups.map(group => (
            <SortableBoardGroup
              key={group.id}
              group={group}
              columns={columns}
              items={localItems}
              values={values}
              slug={slug}
              boardId={boardId}
              members={members}
              relatedItems={relatedItems}
              localValues={localValues}
              onValueUpdate={handleValueUpdate}
              searchQuery={searchQuery}
              autoAddOpen={autoAddGroupId === group.id}
              onAutoAddDone={onAutoAddDone}
              onGroupUpdate={handleGroupUpdate}
              onGroupDelete={handleGroupDelete}
              onItemsReorder={handleItemsReorder}
              onColumnUpdate={onColumnUpdate}
              onColumnDelete={onColumnDelete}
              onItemOpen={setSelectedItem}
            />
          ))}
        </SortableContext>
      </DndContext>
      <AddGroupButton
        boardId={boardId}
        slug={slug}
        groupCount={localGroups.length}
        onGroupCreated={handleGroupCreated}
      />

      <BoardItemDrawer
        item={selectedItem}
        slug={slug}
        columns={columns}
        values={localValues.length ? localValues : values}
        members={members}
        relatedItems={relatedItems}
        groups={localGroups}
        currentUserId={currentUserId}
        open={selectedItem !== null}
        onOpenChange={open => { if (!open) setSelectedItem(null) }}
      />
    </div>
  )
}
