import type { SupabaseClient } from '@supabase/supabase-js'
import type { BoardItemActivityType } from '@/lib/boards/types'

export async function logBoardItemActivity(
  supabase: SupabaseClient,
  params: {
    itemId: string
    userId: string
    type: BoardItemActivityType
    body?: string | null
    metadata?: Record<string, unknown>
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
  }
}
