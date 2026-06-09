import type { BoardItemActivityType } from '@/lib/boards/types'
import type { FeedEventType } from './types'

export { formatRelativeTime } from '@/lib/boards/format-activity'

export function buildBoardFeedSummary(
  type: BoardItemActivityType,
  itemName: string,
  boardName: string,
  metadata: Record<string, unknown> = {}
): string {
  switch (type) {
    case 'created':
      return `criou ${itemName} em ${boardName}`
    case 'comment':
      return `comentou em ${itemName} (${boardName})`
    case 'name_change':
      return `renomeou para ${(metadata.new_name as string) ?? itemName} em ${boardName}`
    case 'group_change':
      return `moveu ${itemName} para ${(metadata.new_group_name as string) ?? '—'} em ${boardName}`
    case 'field_update': {
      const columnName = (metadata.column_name as string) ?? 'campo'
      const detail = metadata.detail as string | undefined
      return detail
        ? `alterou ${columnName} para ${detail} em ${itemName} (${boardName})`
        : `alterou ${columnName} em ${itemName} (${boardName})`
    }
    default:
      return `atualizou ${itemName} em ${boardName}`
  }
}

export function getFeedEventIconType(eventType: FeedEventType): string {
  switch (eventType) {
    case 'created':
    case 'lead_created_external':
    case 'task_created':
    case 'stage_created':
    case 'webhook_created':
      return 'created'
    case 'comment':
      return 'comment'
    case 'name_change':
    case 'profile_updated':
    case 'org_updated':
    case 'stage_updated':
      return 'name_change'
    case 'group_change':
    case 'stage_reordered':
    case 'item_converted':
      return 'group_change'
    case 'field_update':
    case 'task_completed':
      return 'field_update'
    case 'item_deleted':
    case 'trash_emptied':
    case 'stage_deleted':
    case 'webhook_deleted':
      return 'deleted'
    case 'item_restored':
      return 'created'
    case 'webhook_toggled':
      return 'webhook'
    case 'member_invited':
    case 'member_role_updated':
      return 'created'
    case 'member_removed':
      return 'deleted'
    default:
      return 'default'
  }
}

export const FEED_CATEGORY_COLORS: Record<string, string> = {
  board: '#45F47F',
  task: '#7845F4',
  settings: '#45D4F4',
  integration: '#45F47F',
}
