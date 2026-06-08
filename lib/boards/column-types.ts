import type { ColumnType } from './types'

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: 'Texto',
  status: 'Status',
  person: 'Pessoa',
  date: 'Data',
  timeline: 'Cronograma',
  number: 'Número',
  currency: 'Moeda',
  email: 'E-mail',
  phone: 'Telefone',
  url: 'Link',
  tags: 'Tags',
  relation: 'Relação',
}

export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  text: 'T',
  status: '●',
  person: '👤',
  date: '📅',
  timeline: '↔',
  number: '#',
  currency: 'R$',
  email: '@',
  phone: '📞',
  url: '🔗',
  tags: '🏷',
  relation: '↗',
}

export const DEFAULT_STATUS_COLORS = [
  '#4342F5', '#45D4F4', '#D7FE65', '#7845F4', '#F4A545',
  '#45F47F', '#F44545', '#FF6B9D', '#FFB347', '#9B59B6',
]

export function createStatusOption(label: string, color: string, id?: string) {
  return {
    id: id ?? crypto.randomUUID(),
    label,
    color,
  }
}

export function getStatusOption(
  settings: { options?: { id: string; label: string; color: string }[] },
  optionId: string | undefined
) {
  if (!optionId || !settings.options) return null
  return settings.options.find(o => o.id === optionId) ?? null
}

export function emptyValueForType(type: ColumnType): Record<string, unknown> {
  switch (type) {
    case 'text': return { text: '' }
    case 'status': return { option_id: '' }
    case 'person': return { user_ids: [] }
    case 'date': return { date: '' }
    case 'timeline': return { start: '', end: '' }
    case 'number': return { number: 0 }
    case 'currency': return { amount: 0, currency: 'BRL' }
    case 'email':
    case 'phone':
    case 'url': return { value: '' }
    case 'tags': return { option_ids: [] }
    case 'relation': return { item_ids: [] }
  }
}
