import type { OrgMember } from '@/lib/boards/types'

export type FeedCategory = 'board' | 'task' | 'settings' | 'integration'

export type FeedEventType =
  | 'created'
  | 'comment'
  | 'name_change'
  | 'group_change'
  | 'field_update'
  | 'task_created'
  | 'task_completed'
  | 'stage_created'
  | 'stage_updated'
  | 'stage_deleted'
  | 'stage_reordered'
  | 'org_updated'
  | 'profile_updated'
  | 'webhook_created'
  | 'webhook_toggled'
  | 'webhook_deleted'
  | 'lead_created_external'
  | 'item_converted'
  | 'item_deleted'
  | 'item_restored'
  | 'trash_emptied'
  | 'member_invited'
  | 'member_role_updated'
  | 'member_removed'

export interface FeedEvent {
  id: string
  organization_id: string
  user_id: string | null
  category: FeedCategory
  event_type: FeedEventType
  summary: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  user?: OrgMember | null
}

export interface FeedPage {
  events: FeedEvent[]
  nextCursor: string | null
}

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  board: 'Boards',
  task: 'Tarefas',
  settings: 'Configurações',
  integration: 'Integrações',
}
