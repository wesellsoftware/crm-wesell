'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type {
  BoardColumn,
  BoardGroup,
  BoardItem,
  BoardItemValue,
  CellValue,
  OrgMember,
  RelatedItem,
} from '@/lib/boards/types'
import { getStatusOption } from '@/lib/boards/column-types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AvatarGroup } from '@/components/ui/avatar'
import { MemberAvatar } from './cells/member-avatar'
import { ItemActivityFeed } from './item-activity-feed'

function getItemValue(
  values: BoardItemValue[],
  itemId: string,
  columnId: string
): CellValue | undefined {
  return values.find(v => v.item_id === itemId && v.column_id === columnId)?.value
}

function formatFieldValue(
  column: BoardColumn,
  value: CellValue | undefined,
  members: OrgMember[],
  relatedItems: RelatedItem[]
): ReactNode {
  if (!value) return <span className="text-we-paper/30">—</span>

  switch (column.type) {
    case 'text':
      return (value as { text?: string }).text || '—'
    case 'status': {
      const opt = getStatusOption(column.settings, (value as { option_id?: string }).option_id ?? '')
      if (!opt) return '—'
      return (
        <span
          className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-body text-white"
          style={{ backgroundColor: opt.color }}
        >
          {opt.label}
        </span>
      )
    }
    case 'person': {
      const ids = (value as { user_ids?: string[] }).user_ids ?? []
      const selectedMembers = members.filter(m => ids.includes(m.id))
      if (!selectedMembers.length) return '—'
      return (
        <div className="flex flex-wrap items-center gap-2">
          <AvatarGroup className="*:data-[slot=avatar]:ring-we-ink/80">
            {selectedMembers.map(m => (
              <MemberAvatar key={m.id} member={m} size="sm" title={m.full_name ?? ''} />
            ))}
          </AvatarGroup>
          <span className="text-we-paper/70">
            {selectedMembers.map(m => m.full_name ?? 'Sem nome').join(', ')}
          </span>
        </div>
      )
    }
    case 'date':
      return formatDate((value as { date?: string }).date ?? '')
    case 'timeline': {
      const { start, end } = value as { start?: string; end?: string }
      if (start && end) return `${formatDate(start)} – ${formatDate(end)}`
      if (start) return formatDate(start)
      return '—'
    }
    case 'number':
      return String((value as { number?: number }).number ?? 0)
    case 'currency':
      return formatCurrency((value as { amount?: number }).amount ?? 0)
    case 'email':
    case 'phone':
    case 'url':
      return (value as { value?: string }).value || '—'
    case 'tags': {
      const ids = (value as { option_ids?: string[] }).option_ids ?? []
      const opts = (column.settings.options ?? []).filter(o => ids.includes(o.id))
      if (!opts.length) return '—'
      return (
        <div className="flex flex-wrap gap-1">
          {opts.map(opt => (
            <span
              key={opt.id}
              className="px-2 py-0.5 rounded-md text-[10px] font-body text-white"
              style={{ backgroundColor: opt.color }}
            >
              {opt.label}
            </span>
          ))}
        </div>
      )
    }
    case 'relation': {
      const ids = (value as { item_ids?: string[] }).item_ids ?? []
      const items = relatedItems.filter(r => ids.includes(r.id))
      if (!items.length) return '—'
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map(r => (
            <Link
              key={r.id}
              href={`/boards/${r.board_slug}`}
              className="px-2 py-0.5 rounded-md bg-white/[0.08] text-xs font-body text-we-blue hover:bg-white/[0.12] transition-colors"
            >
              {r.name}
            </Link>
          ))}
        </div>
      )
    }
    default:
      return '—'
  }
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
}

export function BoardItemDrawer({
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
}: BoardItemDrawerProps) {
  if (!item) return null

  const group = groups.find(g => g.id === item.group_id)
  const displayColumns = columns.filter(c => !c.is_primary)
  const relatedNames = Object.fromEntries(relatedItems.map(r => [r.id, r.name]))
  const createdBy = item.created_by
    ? members.find(m => m.id === item.created_by) ?? null
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-modal w-full sm:max-w-[39.6rem] border-l border-white/[0.08] bg-we-ink/95 p-0 flex flex-col gap-0 text-we-paper"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <SheetTitle className="font-display text-xl text-we-paper pr-8">
            {item.name}
          </SheetTitle>
          {group && (
            <p className="font-body text-xs text-we-paper/40 flex items-center gap-1.5">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 glass-scrollbar">
          <section>
            <h3 className="font-body text-sm font-medium text-we-paper/80 mb-3">Informações</h3>
            <div className="space-y-3">
              {displayColumns.map(col => (
                <div
                  key={col.id}
                  className="flex flex-col gap-1 py-2 border-b border-white/[0.06] last:border-0"
                >
                  <span className="font-body text-xs text-we-paper/45 uppercase tracking-wide">
                    {col.name}
                  </span>
                  <div className="font-body text-sm text-we-paper/85">
                    {formatFieldValue(
                      col,
                      getItemValue(values, item.id, col.id),
                      members,
                      relatedItems
                    )}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-1 pt-2">
                <span className="font-body text-xs text-we-paper/45 uppercase tracking-wide">
                  Criado em
                </span>
                <span className="font-mono text-xs text-we-paper/50">
                  {new Date(item.created_at).toLocaleDateString('pt-BR', {
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

          <section className="border-t border-white/[0.06] pt-4 pb-6">
            <ItemActivityFeed
              item={item}
              slug={slug}
              columns={columns}
              members={members}
              relatedNames={relatedNames}
              createdBy={createdBy}
              currentUserId={currentUserId}
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Backward-compatible alias
export { BoardItemDrawer as DealDetailDialog }
