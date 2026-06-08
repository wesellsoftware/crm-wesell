'use client'

import { useState } from 'react'
import type { BoardColumn, BoardGroup, BoardItem, BoardItemValue, CellValue, OrgMember, RelatedItem } from '@/lib/boards/types'
import { BoardGroupSection } from './board-group'
import { AddGroupButton } from './add-group-button'

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
}: BoardTableProps) {
  const [localValues, setLocalValues] = useState<BoardItemValue[]>(values)

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
      {groups.map(group => (
        <BoardGroupSection
          key={group.id}
          group={group}
          columns={columns}
          items={items}
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
        />
      ))}
      <AddGroupButton boardId={boardId} slug={slug} />
    </div>
  )
}
