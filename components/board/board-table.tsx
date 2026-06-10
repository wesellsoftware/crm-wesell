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
import { moveItemToGroup, reorderGroups, reorderItems } from '@/app/actions/boards'
import { fireConfettiSideCannons } from '@/lib/confetti-side-cannons'
import { isWonGroupName } from '@/lib/boards/won-group'
import { BoardGroupSection } from './board-group'
import { AddGroupButton } from './add-group-button'
import { BoardItemDrawer } from './board-item-drawer'

function sortGroupsByPosition(groups: BoardGroup[]) {
  return [...groups].sort((a, b) => a.position - b.position)
}

function getGroupItems(items: BoardItem[], groupId: string) {
  return items
    .filter(i => i.group_id === groupId)
    .sort((a, b) => a.position - b.position)
}

function findItemGroupId(items: BoardItem[], itemId: string) {
  return items.find(i => i.id === itemId)?.group_id
}

function resolveTargetGroupId(items: BoardItem[], overId: string) {
  if (overId.startsWith('group:')) return overId.slice('group:'.length)
  return findItemGroupId(items, overId) ?? null
}

function applyItemsByGroup(
  groups: BoardGroup[],
  allItems: BoardItem[],
  itemsByGroup: Record<string, BoardItem[]>
) {
  const itemMap = new Map(allItems.map(item => [item.id, item]))
  const next: BoardItem[] = []

  for (const group of groups) {
    const groupItems = itemsByGroup[group.id] ?? []
    groupItems.forEach((item, position) => {
      const source = itemMap.get(item.id) ?? item
      next.push({ ...source, group_id: group.id, position })
    })
  }

  return next
}

function mergeServerItems(serverItems: BoardItem[], localItems: BoardItem[]) {
  const localById = new Map(localItems.map(item => [item.id, item]))

  return serverItems.map(serverItem => {
    const local = localById.get(serverItem.id)
    if (!local) return serverItem

    if (local.group_id !== serverItem.group_id || local.position !== serverItem.position) {
      return { ...serverItem, group_id: local.group_id, position: local.position }
    }

    return serverItem
  })
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
  onColumnUpdate?: (columnId: string, updates: Partial<BoardColumn>) => void
  onColumnDelete?: (columnId: string) => void
  onColumnsReorder?: (columnIds: string[]) => void
  onColumnWidthChange?: (columnId: string, width: number) => void
  onColumnWidthPersist?: (columnId: string, width: number) => void
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
  onColumnsReorder?: (columnIds: string[]) => void
  onColumnWidthChange?: (columnId: string, width: number) => void
  onColumnWidthPersist?: (columnId: string, width: number) => void
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
  onColumnsReorder,
  onColumnWidthChange,
  onColumnWidthPersist,
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
    setLocalItems(prev => mergeServerItems(items, prev))
  }, [items])

  useEffect(() => {
    setSelectedItem(prev => {
      if (!prev) return null
      return localItems.find(item => item.id === prev.id) ?? prev
    })
  }, [localItems])

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
    const dragType = event.active.data.current?.type
    if (dragType === 'group') {
      handleGroupDragEnd(event)
    } else if (dragType === 'item') {
      handleItemDragEnd(event)
    }
  }

  function handleGroupDragEnd(event: DragEndEvent) {
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

  function handleItemDragEnd(event: DragEndEvent) {
    if (searchQuery) return
    if (event.active.data.current?.type !== 'item') return

    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeGroupId = findItemGroupId(localItems, activeId)
    const targetGroupId = resolveTargetGroupId(localItems, overId)

    if (!activeGroupId || !targetGroupId) return

    const activeItem = localItems.find(i => i.id === activeId)
    if (!activeItem) return

    if (activeGroupId === targetGroupId) {
      if (activeId === overId) return

      const groupItems = getGroupItems(localItems, targetGroupId)
      const oldIndex = groupItems.findIndex(i => i.id === activeId)
      const newIndex = groupItems.findIndex(i => i.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(groupItems, oldIndex, newIndex)
      handleItemsReorder(targetGroupId, reordered.map(i => i.id))
      return
    }

    const sourceItems = getGroupItems(localItems, activeGroupId).filter(i => i.id !== activeId)
    const targetItems = getGroupItems(localItems, targetGroupId).filter(i => i.id !== activeId)

    let insertIndex = targetItems.length
    if (!overId.startsWith('group:')) {
      const overIndex = getGroupItems(localItems, targetGroupId).findIndex(i => i.id === overId)
      if (overIndex >= 0) insertIndex = overIndex
    }

    const nextTargetItems = [...targetItems]
    nextTargetItems.splice(insertIndex, 0, { ...activeItem, group_id: targetGroupId })

    const itemsByGroup: Record<string, BoardItem[]> = {
      [activeGroupId]: sourceItems,
      [targetGroupId]: nextTargetItems,
    }
    for (const group of localGroups) {
      if (!(group.id in itemsByGroup)) {
        itemsByGroup[group.id] = getGroupItems(localItems, group.id).filter(i => i.id !== activeId)
      }
    }

    setLocalItems(applyItemsByGroup(localGroups, localItems, itemsByGroup))

    const targetGroup = localGroups.find(g => g.id === targetGroupId)
    const wasInWon = localGroups.some(
      g => g.id === activeGroupId && isWonGroupName(g.name)
    )
    if (targetGroup && isWonGroupName(targetGroup.name) && !wasInWon) {
      fireConfettiSideCannons()
    }

    startItemReorder(async () => {
      const moveResult = await moveItemToGroup(activeId, targetGroupId, slug)
      if (moveResult?.error) {
        setLocalItems(prev =>
          prev.map(item =>
            item.id === activeId ? { ...item, group_id: activeGroupId } : item
          )
        )
        return
      }

      await reorderItems(targetGroupId, nextTargetItems.map(i => i.id), slug)
      if (sourceItems.length > 0) {
        await reorderItems(activeGroupId, sourceItems.map(i => i.id), slug)
      }
    })
  }

  function handleItemDeleted(itemId: string) {
    setLocalItems(prev => prev.filter(item => item.id !== itemId))
    setSelectedItem(null)
  }

  function handleItemRestored(item: BoardItem) {
    setLocalItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev
      return [...prev, item].sort((a, b) => a.position - b.position)
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

  function handleItemUpdate(itemId: string, updates: Partial<BoardItem>) {
    setLocalItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, ...updates } : item))
    )
    setSelectedItem(prev =>
      prev?.id === itemId ? { ...prev, ...updates } : prev
    )
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
              onColumnUpdate={onColumnUpdate}
              onColumnDelete={onColumnDelete}
              onColumnsReorder={onColumnsReorder}
              onColumnWidthChange={onColumnWidthChange}
              onColumnWidthPersist={onColumnWidthPersist}
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
        onDeleted={handleItemDeleted}
        onRestored={handleItemRestored}
        onValueUpdate={handleValueUpdate}
        onItemUpdate={handleItemUpdate}
      />
    </div>
  )
}
