'use client'

import { MoreHorizontal, Settings2 } from 'lucide-react'
import type { BoardColumn } from '@/lib/boards/types'
import { EditLabelsDialog } from './edit-labels-dialog'

interface BoardColumnHeaderProps {
  column: BoardColumn
  slug: string
}

export function BoardColumnHeader({ column, slug }: BoardColumnHeaderProps) {
  const isLabelColumn = column.type === 'status' || column.type === 'tags'

  return (
    <div className="flex items-center gap-1">
      <span>{column.name}</span>
      {isLabelColumn && (
        <EditLabelsDialog column={column} slug={slug} />
      )}
    </div>
  )
}
