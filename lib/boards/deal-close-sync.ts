import type { SupabaseClient } from '@supabase/supabase-js'

const WON_STAGE_LABEL = 'fechado/ganho'

export function isWonStageLabel(label: string): boolean {
  return label.trim().toLowerCase() === WON_STAGE_LABEL
}

export async function syncDealClosedAt(
  supabase: SupabaseClient,
  itemId: string,
  isWon: boolean
): Promise<void> {
  if (isWon) {
    const { data: item } = await supabase
      .from('board_items')
      .select('closed_at')
      .eq('id', itemId)
      .single()

    if (!item?.closed_at) {
      await supabase
        .from('board_items')
        .update({ closed_at: new Date().toISOString() })
        .eq('id', itemId)
    }
  } else {
    await supabase
      .from('board_items')
      .update({ closed_at: null })
      .eq('id', itemId)
  }
}
