import type { BoardColumn, CellValue, OrgMember } from '@/lib/boards/types'
import { getStatusOption } from '@/lib/boards/column-types'
import { formatCurrency, formatDate } from '@/lib/utils'

export function formatRelativeTime(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHour < 24) return `há cerca de ${diffHour} hora${diffHour > 1 ? 's' : ''}`
  if (diffDay < 7) return `há ${diffDay} dia${diffDay > 1 ? 's' : ''}`

  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCellValue(
  column: BoardColumn | undefined,
  value: CellValue | Record<string, unknown> | null | undefined,
  members: OrgMember[],
  relatedNames: Record<string, string>
): string {
  if (!value || !column) return '—'

  switch (column.type) {
    case 'text':
      return (value as { text?: string }).text || '—'
    case 'status': {
      const opt = getStatusOption(column.settings, (value as { option_id?: string }).option_id ?? '')
      return opt?.label ?? '—'
    }
    case 'person': {
      const ids = (value as { user_ids?: string[] }).user_ids ?? []
      const names = members.filter(m => ids.includes(m.id)).map(m => m.full_name ?? 'Sem nome')
      return names.length ? names.join(', ') : '—'
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
      return opts.length ? opts.map(o => o.label).join(', ') : '—'
    }
    case 'relation': {
      const ids = (value as { item_ids?: string[] }).item_ids ?? []
      const names = ids.map(id => relatedNames[id]).filter(Boolean)
      return names.length ? names.join(', ') : '—'
    }
    default:
      return '—'
  }
}

export function formatActivityMessage(
  type: string,
  metadata: Record<string, unknown>,
  columns: BoardColumn[],
  members: OrgMember[],
  relatedNames: Record<string, string>
): { action: string; detail?: string } {
  switch (type) {
    case 'created':
      return { action: 'criou o item' }
    case 'comment':
      return { action: 'comentou' }
    case 'name_change':
      return {
        action: 'renomeou o item',
        detail: metadata.new_name as string | undefined,
      }
    case 'group_change':
      return {
        action: 'moveu para',
        detail: metadata.new_group_name as string | undefined,
      }
    case 'field_update': {
      const column = columns.find(c => c.id === metadata.column_id)
      const columnName = (metadata.column_name as string) ?? column?.name ?? 'campo'
      const newValue = formatCellValue(
        column,
        metadata.new_value as CellValue,
        members,
        relatedNames
      )
      return {
        action: `alterou ${columnName} para`,
        detail: newValue,
      }
    }
    default:
      return { action: 'atualizou o item' }
  }
}
