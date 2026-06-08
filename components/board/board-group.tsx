'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BoardColumn, BoardGroup, BoardItem, BoardItemValue, CellValue, OrgMember, RelatedItem } from '@/lib/boards/types'
import { CellRenderer, getItemValue } from './cells/cell-renderer'
import { AddItemRow } from './add-item-row'
import { BoardGroupFooter } from './board-group-footer'
import { updateGroup, updateItemName } from '@/app/actions/boards'
import { MoveToContactsButton } from './move-to-contacts-button'
import { EditLabelsDialog } from './edit-labels-dialog'

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
}: BoardGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(group.collapsed)
  const [, startTransition] = useTransition()
  const [editingNames, setEditingNames] = useState<Record<string, string>>({})

  const groupItems = items
    .filter(i => i.group_id === group.id)
    .filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()))

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(() => { void updateGroup(group.id, { collapsed: next }, slug) })
  }

  function handleNameEdit(itemId: string, name: string) {
    startTransition(() => { void updateItemName(itemId, name, slug) })
  }

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={toggleCollapse}
        className="flex items-center gap-2 mb-2 group/header px-1"
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-we-paper/35" />
        ) : (
          <ChevronDown size={14} className="text-we-paper/35" />
        )}
        <div
          className="w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span className="font-body text-sm font-semibold" style={{ color: group.color }}>
          {group.name}
        </span>
        <span className="font-mono text-[10px] text-we-paper/40 bg-white/[0.07] px-1.5 py-0.5 rounded">
          {groupItems.length}
        </span>
      </button>

      {!collapsed && (
        <div className="glass rounded-xl overflow-x-auto">
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
                    <span className="flex items-center gap-1 group/col">
                      {col.name}
                      {(col.type === 'status' || col.type === 'tags') && (
                        <EditLabelsDialog column={col} slug={slug} />
                      )}
                    </span>
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
              {groupItems.map(item => (
                <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group/row">
                  <td className="px-2 py-2 border-r border-white/[0.03]">
                    <div
                      className="w-1 h-8 rounded-full mx-auto"
                      style={{ backgroundColor: group.color }}
                    />
                  </td>
                  {columns.map(col => {
                    if (col.is_primary) {
                      const draft = editingNames[item.id] ?? item.name
                      const isEditing = item.id in editingNames
                      return (
                        <td key={col.id} className="px-3 py-2 border-r border-white/[0.03]">
                          {isEditing ? (
                            <input
                              autoFocus
                              value={draft}
                              onChange={e => setEditingNames(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onBlur={() => {
                                const name = editingNames[item.id] ?? item.name
                                setEditingNames(prev => {
                                  const next = { ...prev }
                                  delete next[item.id]
                                  return next
                                })
                                if (name !== item.name) handleNameEdit(item.id, name)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const name = editingNames[item.id] ?? item.name
                                  setEditingNames(prev => {
                                    const next = { ...prev }
                                    delete next[item.id]
                                    return next
                                  })
                                  if (name !== item.name) handleNameEdit(item.id, name)
                                }
                              }}
                              className="w-full glass-input rounded px-2 py-1 outline-none font-body text-sm text-we-paper font-medium focus:ring-1 focus:ring-we-blue/40"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingNames(prev => ({ ...prev, [item.id]: item.name }))}
                              className="font-body text-sm text-we-paper/90 font-medium hover:text-we-blue px-1 py-0.5 rounded text-left w-full transition-colors"
                            >
                              {item.name}
                            </button>
                          )}
                        </td>
                      )
                    }
                    return (
                      <td key={col.id} className="px-3 py-2 border-r border-white/[0.03] last:border-r-0">
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
                    <td className="px-3 py-2">
                      <MoveToContactsButton itemId={item.id} />
                    </td>
                  )}
                </tr>
              ))}
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
