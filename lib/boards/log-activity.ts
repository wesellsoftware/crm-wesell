import type { SupabaseClient } from '@supabase/supabase-js'
import type { BoardItemActivityType } from '@/lib/boards/types'
import { buildBoardFeedSummary } from '@/lib/feed/format-feed-event'
import {
  logFeedEvent,
  resolveItemFeedContext,
  type ItemFeedContext,
} from '@/lib/feed/log-feed-event'

export async function logBoardItemActivity(
  supabase: SupabaseClient,
  params: {
    itemId: string
    userId: string
    type: BoardItemActivityType
    body?: string | null
    metadata?: Record<string, unknown>
    feedContext?: ItemFeedContext
  }
) {
  const { error } = await supabase.from('board_item_activities').insert({
    item_id: params.itemId,
    user_id: params.userId,
    type: params.type,
    body: params.body ?? null,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('logBoardItemActivity error:', error.message)
    return
  }

  try {
    const ctx = params.feedContext ?? (await resolveItemFeedContext(supabase, params.itemId))
    if (!ctx) return

    const metadata = {
      ...(params.metadata ?? {}),
      board_slug: ctx.boardSlug,
      board_name: ctx.boardName,
      item_name: ctx.itemName,
    }

    await logFeedEvent(supabase, {
      organizationId: ctx.organizationId,
      userId: params.userId,
      category: 'board',
      eventType: params.type,
      summary: buildBoardFeedSummary(
        params.type,
        ctx.itemName,
        ctx.boardName,
        params.metadata ?? {}
      ),
      body: params.body ?? null,
      entityType: 'board_item',
      entityId: params.itemId,
      metadata,
    })
  } catch (err) {
    console.error('logBoardItemActivity feed error:', err)
  }
}
