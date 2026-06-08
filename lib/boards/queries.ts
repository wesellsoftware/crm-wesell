import { ensureOrganizationBoards } from '@/lib/boards/seed'
import { getOrgContext } from '@/lib/boards/org-context'
import type {
  Board,
  BoardColumn,
  BoardData,
  BoardGroup,
  BoardItem,
  BoardItemValue,
  CellValue,
  OrgMember,
  RelatedItem,
} from '@/lib/boards/types'

export async function getBoardBySlug(slug: string): Promise<BoardData | null> {
  const ctx = await getOrgContext()
  if (!ctx) return null

  const { supabase, organizationId } = ctx
  const seedResult = await ensureOrganizationBoards(organizationId)
  if (seedResult.error) {
    console.error('Board seed error:', seedResult.error)
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .single()

  if (boardError) console.error('boards query error:', boardError.message)
  if (!board) return null

  const [
    { data: groups, error: groupsError },
    { data: columns, error: columnsError },
    { data: items, error: itemsError },
    { data: members },
    { data: allBoards },
  ] = await Promise.all([
    supabase.from('board_groups').select('*').eq('board_id', board.id).order('position'),
    supabase.from('board_columns').select('*').eq('board_id', board.id).order('position'),
    supabase.from('board_items').select('*').eq('board_id', board.id).order('position'),
    supabase.from('profiles').select('id, full_name').eq('organization_id', organizationId),
    supabase.from('boards').select('id, slug, name').eq('organization_id', organizationId).order('position'),
  ])

  if (groupsError) console.error('board_groups error:', groupsError.message)
  if (columnsError) console.error('board_columns error:', columnsError.message)
  if (itemsError) console.error('board_items error:', itemsError.message)

  const itemIds = (items ?? []).map(i => i.id)
  let values: BoardItemValue[] = []

  if (itemIds.length > 0) {
    const { data: rawValues } = await supabase
      .from('board_item_values')
      .select('*')
      .in('item_id', itemIds)
    values = (rawValues ?? []) as BoardItemValue[]
  }

  const relatedItemIds = new Set<string>()
  for (const v of values) {
    const val = v.value as CellValue
    if ('item_ids' in val && Array.isArray(val.item_ids)) {
      val.item_ids.forEach(id => relatedItemIds.add(id))
    }
  }

  let relatedItems: RelatedItem[] = []
  if (relatedItemIds.size > 0) {
    const { data: related } = await supabase
      .from('board_items')
      .select('id, name, board:boards(slug)')
      .in('id', Array.from(relatedItemIds))

    relatedItems = (related ?? []).map(r => ({
      id: r.id,
      name: r.name,
      board_slug: (r.board as unknown as { slug: string })?.slug ?? '',
    }))
  }

  return {
    board: board as Board,
    groups: (groups ?? []) as BoardGroup[],
    columns: (columns ?? []) as BoardColumn[],
    items: (items ?? []) as BoardItem[],
    values,
    members: (members ?? []) as OrgMember[],
    relatedItems,
    allBoards: (allBoards ?? []) as Pick<Board, 'id' | 'slug' | 'name'>[],
  }
}

export async function getRelationItems(targetBoardSlug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return []

  const { supabase, organizationId } = ctx
  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', targetBoardSlug)
    .single()

  if (!board) return []

  const { data: items } = await supabase
    .from('board_items')
    .select('id, name')
    .eq('board_id', board.id)
    .order('name')

  return items ?? []
}

export async function getNegociacoesKanbanData() {
  const data = await getBoardBySlug('negociacoes')
  if (!data) return null

  const stageColumn = data.columns.find(c => c.name === 'Etapa' && c.type === 'status')
  const stages = stageColumn?.settings.options ?? []

  const itemsByStage: Record<string, typeof data.items> = {}
  for (const stage of stages) {
    itemsByStage[stage.id] = []
  }
  itemsByStage['__none__'] = []

  for (const item of data.items) {
    const stageValue = data.values.find(
      v => v.item_id === item.id && v.column_id === stageColumn?.id
    )
    const optionId = (stageValue?.value as { option_id?: string })?.option_id
    if (optionId && itemsByStage[optionId]) {
      itemsByStage[optionId].push(item)
    } else {
      itemsByStage['__none__'].push(item)
    }
  }

  return { ...data, stages, itemsByStage, stageColumnId: stageColumn?.id }
}

export async function getDashboardBoardStats() {
  const ctx = await getOrgContext()
  if (!ctx) return null

  const { supabase, organizationId } = ctx
  await ensureOrganizationBoards(organizationId)

  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'negociacoes')
    .single()

  if (!board) return null

  const [{ data: items }, { data: columns }, { data: values }] = await Promise.all([
    supabase.from('board_items').select('id, name, group_id').eq('board_id', board.id),
    supabase.from('board_columns').select('*').eq('board_id', board.id),
    supabase.from('board_item_values').select('*'),
  ])

  const stageCol = (columns ?? []).find(c => c.name === 'Etapa')
  const valueCol = (columns ?? []).find(c => c.type === 'currency')
  const groups = await supabase.from('board_groups').select('*').eq('board_id', board.id).order('position')

  const activeGroup = groups.data?.find(g => g.name === 'Oportunidades ativas')
  const wonGroup = groups.data?.find(g => g.name === 'Fechado/Ganho')

  const activeItems = (items ?? []).filter(i => i.group_id === activeGroup?.id)
  const wonItems = (items ?? []).filter(i => i.group_id === wonGroup?.id)

  let pipelineValue = 0
  for (const item of activeItems) {
    const val = (values ?? []).find(v => v.item_id === item.id && v.column_id === valueCol?.id)
    pipelineValue += Number((val?.value as { amount?: number })?.amount ?? 0)
  }

  const chartData = (stageCol?.settings as { options?: { id: string; label: string; color: string }[] })?.options?.map(opt => {
    const stageItems = (items ?? []).filter(item => {
      const sv = (values ?? []).find(v => v.item_id === item.id && v.column_id === stageCol.id)
      return (sv?.value as { option_id?: string })?.option_id === opt.id
    })
    const stageValue = stageItems.reduce((sum, item) => {
      const val = (values ?? []).find(v => v.item_id === item.id && v.column_id === valueCol?.id)
      return sum + Number((val?.value as { amount?: number })?.amount ?? 0)
    }, 0)
    return { name: opt.label, count: stageItems.length, value: stageValue, color: opt.color }
  }) ?? []

  return {
    openCount: activeItems.length,
    pipelineValue,
    wonCount: wonItems.length,
    conversionRate: activeItems.length + wonItems.length > 0
      ? Math.round((wonItems.length / (activeItems.length + wonItems.length)) * 100)
      : 0,
    chartData,
    recentItems: (items ?? []).slice(0, 5),
  }
}
