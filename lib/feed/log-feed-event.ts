import type { SupabaseClient } from '@supabase/supabase-js'
import type { FeedCategory, FeedEventType } from './types'

export interface LogFeedEventParams {
  organizationId: string
  userId?: string | null
  category: FeedCategory
  eventType: FeedEventType
  summary: string
  body?: string | null
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
  createdAt?: string
}

export async function logFeedEvent(
  supabase: SupabaseClient,
  params: LogFeedEventParams
) {
  const row = {
    organization_id: params.organizationId,
    user_id: params.userId ?? null,
    category: params.category,
    event_type: params.eventType,
    summary: params.summary,
    body: params.body ?? null,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
    ...(params.createdAt ? { created_at: params.createdAt } : {}),
  }

  const { error } = await supabase.from('organization_feed_events').insert(row)

  if (error) {
    console.error('logFeedEvent error:', error.message)
  }
}

export interface ItemFeedContext {
  organizationId: string
  boardSlug: string
  boardName: string
  itemName: string
}

export async function resolveItemFeedContext(
  supabase: SupabaseClient,
  itemId: string
): Promise<ItemFeedContext | null> {
  const { data } = await supabase
    .from('board_items')
    .select('name, board:boards(slug, name, organization_id)')
    .eq('id', itemId)
    .single()

  if (!data) return null

  const board = data.board as unknown as {
    slug: string
    name: string
    organization_id: string
  }

  return {
    organizationId: board.organization_id,
    boardSlug: board.slug,
    boardName: board.name,
    itemName: data.name,
  }
}
