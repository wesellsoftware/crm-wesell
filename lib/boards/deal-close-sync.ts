import type { SupabaseClient } from '@supabase/supabase-js'
import { isWonGroupName } from './won-group'

const WON_STAGE_LABEL = 'fechado/ganho'

export function isWonStageLabel(label: string): boolean {
  return label.trim().toLowerCase() === WON_STAGE_LABEL
}

export async function getWonGroupId(
  supabase: SupabaseClient,
  boardId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('board_groups')
    .select('id, name')
    .eq('board_id', boardId)

  const won = (data ?? []).find(g => isWonGroupName(g.name))
  return won?.id ?? null
}

export async function getActiveGroupId(
  supabase: SupabaseClient,
  boardId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('board_groups')
    .select('id, name')
    .eq('board_id', boardId)
    .order('position')

  const active = (data ?? []).find(g => g.name.trim().toLowerCase() === 'oportunidades ativas')
  return active?.id ?? data?.[0]?.id ?? null
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

export async function syncDealWonState(
  supabase: SupabaseClient,
  itemId: string,
  boardId: string,
  isWon: boolean
): Promise<void> {
  const wonGroupId = await getWonGroupId(supabase, boardId)

  if (isWon && wonGroupId) {
    await supabase.from('board_items').update({ group_id: wonGroupId }).eq('id', itemId)
    await syncDealClosedAt(supabase, itemId, true)
    return
  }

  if (!isWon) {
    const { data: item } = await supabase
      .from('board_items')
      .select('group_id')
      .eq('id', itemId)
      .single()

    const { data: currentGroup } = item?.group_id
      ? await supabase.from('board_groups').select('name').eq('id', item.group_id).single()
      : { data: null }

    if (currentGroup && isWonGroupName(currentGroup.name)) {
      const activeGroupId = await getActiveGroupId(supabase, boardId)
      if (activeGroupId) {
        await supabase.from('board_items').update({ group_id: activeGroupId }).eq('id', itemId)
      }
    }
    await syncDealClosedAt(supabase, itemId, false)
  }
}
