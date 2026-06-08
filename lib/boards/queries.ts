import { unstable_noStore as noStore } from 'next/cache'
import { ensureOrganizationBoards } from '@/lib/boards/seed'
import { getOrgContext } from '@/lib/boards/org-context'
import { computeNegociacoesAnalytics, type NegociacoesAnalytics } from '@/lib/boards/analytics'
import { isClosedGroupName, isWonGroupName } from '@/lib/boards/won-group'
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
    supabase.from('profiles').select('id, full_name, avatar_url').eq('organization_id', organizationId),
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

  const groups = [...data.groups].sort((a, b) => a.position - b.position)

  const itemsByGroup: Record<string, typeof data.items> = {}
  for (const group of groups) {
    itemsByGroup[group.id] = []
  }

  for (const item of data.items) {
    if (itemsByGroup[item.group_id]) {
      itemsByGroup[item.group_id].push(item)
    }
  }

  return { ...data, groups, itemsByGroup }
}

export async function getDashboardBoardStats() {
  noStore()
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

  const [{ data: items }, { data: columns }, { data: groups }] = await Promise.all([
    supabase.from('board_items').select('id, name, group_id').eq('board_id', board.id),
    supabase.from('board_columns').select('*').eq('board_id', board.id),
    supabase.from('board_groups').select('*').eq('board_id', board.id).order('position'),
  ])

  const valueCol = (columns ?? []).find(c => c.type === 'currency')
  const sortedGroups = [...(groups ?? [])].sort((a, b) => a.position - b.position)
  const groupById = new Map(sortedGroups.map(g => [g.id, g]))

  const itemIds = (items ?? []).map(i => i.id)
  let values: BoardItemValue[] = []
  if (itemIds.length > 0) {
    const { data: rawValues } = await supabase
      .from('board_item_values')
      .select('*')
      .in('item_id', itemIds)
    values = (rawValues ?? []) as BoardItemValue[]
  }

  const isClosedGroup = (groupId: string) => {
    const group = groupById.get(groupId)
    return group ? isClosedGroupName(group.name) : false
  }

  const openItems = (items ?? []).filter(i => !isClosedGroup(i.group_id))
  const wonItems = (items ?? []).filter(i => {
    const group = groupById.get(i.group_id)
    return group ? isWonGroupName(group.name) : false
  })

  let pipelineValue = 0
  for (const item of openItems) {
    const val = values.find(v => v.item_id === item.id && v.column_id === valueCol?.id)
    pipelineValue += Number((val?.value as { amount?: number })?.amount ?? 0)
  }

  const chartData = sortedGroups.map(group => {
    const groupItems = (items ?? []).filter(i => i.group_id === group.id)
    const stageValue = groupItems.reduce((sum, item) => {
      const val = values.find(v => v.item_id === item.id && v.column_id === valueCol?.id)
      return sum + Number((val?.value as { amount?: number })?.amount ?? 0)
    }, 0)
    return { name: group.name, count: groupItems.length, value: stageValue, color: group.color }
  })

  return {
    openCount: openItems.length,
    pipelineValue,
    wonCount: wonItems.length,
    conversionRate: openItems.length + wonItems.length > 0
      ? Math.round((wonItems.length / (openItems.length + wonItems.length)) * 100)
      : 0,
    chartData,
    recentItems: (items ?? []).slice(0, 5),
  }
}

export async function getNegociacoesAnalytics(): Promise<NegociacoesAnalytics | null> {
  noStore()
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

  const [{ data: items }, { data: columns }] = await Promise.all([
    supabase
      .from('board_items')
      .select('id, created_at, closed_at')
      .eq('board_id', board.id)
      .not('closed_at', 'is', null),
    supabase.from('board_columns').select('*').eq('board_id', board.id),
  ])

  const valueCol = (columns ?? []).find(c => c.name === 'Valor da negociação' && c.type === 'currency')
  const productCol = (columns ?? []).find(c => c.name === 'Produto' && c.type === 'tags')
  const sellerCol = (columns ?? []).find(c => c.name === 'Responsável' && c.type === 'person')
  const productOptions = (productCol?.settings as { options?: { id: string; label: string; color: string }[] })?.options ?? []
  const productById = new Map(productOptions.map(o => [o.id, o]))
  const productColors = Object.fromEntries(productOptions.map(o => [o.label, o.color]))

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('organization_id', organizationId)

  const itemIds = (items ?? []).map(i => i.id)
  if (itemIds.length === 0) {
    return computeNegociacoesAnalytics([], productColors, members ?? [])
  }

  const { data: values } = await supabase
    .from('board_item_values')
    .select('*')
    .in('item_id', itemIds)

  const wonDeals = (items ?? []).map(item => {
    const amountVal = (values ?? []).find(
      v => v.item_id === item.id && v.column_id === valueCol?.id
    )
    const productVal = (values ?? []).find(
      v => v.item_id === item.id && v.column_id === productCol?.id
    )
    const sellerVal = (values ?? []).find(
      v => v.item_id === item.id && v.column_id === sellerCol?.id
    )
    const optionIds = (productVal?.value as { option_ids?: string[] })?.option_ids ?? []
    const productLabels = optionIds
      .map(id => productById.get(id)?.label)
      .filter((label): label is string => Boolean(label))
    const sellerIds = (sellerVal?.value as { user_ids?: string[] })?.user_ids ?? []

    return {
      id: item.id,
      amount: Number((amountVal?.value as { amount?: number })?.amount ?? 0),
      createdAt: item.created_at,
      closedAt: item.closed_at as string,
      productLabels,
      sellerIds,
    }
  })

  return computeNegociacoesAnalytics(wonDeals, productColors, members ?? [])
}
