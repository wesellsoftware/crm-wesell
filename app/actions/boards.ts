'use server'

import { revalidatePath } from 'next/cache'
import { getOrgContext } from '@/lib/boards/org-context'
import { getRelationItems as fetchRelationItems } from '@/lib/boards/queries'
import { isWonGroupName } from '@/lib/boards/won-group'
import {
  isWonStageLabel,
  syncDealWonState,
} from '@/lib/boards/deal-close-sync'
import { canDeleteBoardColumn, canRenameBoardColumn } from '@/lib/boards/fixed-columns'
import { canDeleteBoardGroup } from '@/lib/boards/fixed-groups'
import { logBoardItemActivity } from '@/lib/boards/log-activity'
import type {
  BoardColumn,
  CellValue,
  ColumnSettings,
  ColumnType,
} from '@/lib/boards/types'

function revalidateBoard(slug: string) {
  const normalized = slug.replace(/\/kanban$/, '')
  revalidatePath(`/boards/${normalized}`)
  if (normalized === 'negociacoes') {
    revalidatePath('/boards/negociacoes/kanban')
  }
  if (normalized === 'negociacoes') {
    revalidatePath('/dashboard', 'page')
    revalidatePath('/relatorios', 'page')
  }
}

export async function getRelationItems(targetBoardSlug: string) {
  return fetchRelationItems(targetBoardSlug)
}

export async function createGroup(boardId: string, name: string, color: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: last } = await ctx.supabase
    .from('board_groups')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { data: group, error } = await ctx.supabase.from('board_groups').insert({
    board_id: boardId,
    name,
    color,
    position: (last?.position ?? -1) + 1,
  }).select('*').single()

  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true, group }
}

export async function deleteGroup(groupId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: group } = await ctx.supabase
    .from('board_groups')
    .select('board_id, name, board:boards(slug)')
    .eq('id', groupId)
    .single()

  if (!group) return { error: 'Grupo não encontrado' }

  const boardSlug = (group.board as unknown as { slug: string })?.slug ?? slug
  if (!canDeleteBoardGroup(boardSlug, group.name)) {
    return { error: 'Este grupo é fixo e não pode ser excluído' }
  }

  const { count } = await ctx.supabase
    .from('board_groups')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', group.board_id)

  if ((count ?? 0) <= 1) {
    return { error: 'Não é possível excluir o último grupo do quadro' }
  }

  const { error } = await ctx.supabase.from('board_groups').delete().eq('id', groupId)
  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function reorderGroups(boardId: string, groupIds: string[], slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  await Promise.all(
    groupIds.map((id, index) =>
      ctx.supabase.from('board_groups').update({ position: index }).eq('id', id).eq('board_id', boardId)
    )
  )

  revalidateBoard(slug)
  return { success: true }
}

export async function updateGroup(groupId: string, updates: { name?: string; color?: string; collapsed?: boolean }, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase.from('board_groups').update(updates).eq('id', groupId)
  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function createColumn(
  boardId: string,
  name: string,
  type: ColumnType,
  slug: string,
  settings?: ColumnSettings
) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: last } = await ctx.supabase
    .from('board_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { error } = await ctx.supabase.from('board_columns').insert({
    board_id: boardId,
    name,
    type,
    position: (last?.position ?? -1) + 1,
    settings: settings ?? {},
  })

  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function updateColumnSettings(columnId: string, settings: ColumnSettings, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('board_columns')
    .update({ settings })
    .eq('id', columnId)

  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function reorderColumns(boardId: string, columnIds: string[], slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  await Promise.all(
    columnIds.map((id, index) =>
      ctx.supabase.from('board_columns').update({ position: index }).eq('id', id)
    )
  )
  revalidateBoard(slug)
  return { success: true }
}

export async function renameColumn(columnId: string, name: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nome inválido' }

  const { data: column } = await ctx.supabase
    .from('board_columns')
    .select('name, board:boards(slug)')
    .eq('id', columnId)
    .single()

  if (!column) return { error: 'Coluna não encontrada' }

  const boardSlug = (column.board as unknown as { slug: string })?.slug ?? slug
  if (!canRenameBoardColumn(boardSlug, column.name)) {
    return { error: 'Esta coluna é fixa e não pode ser renomeada' }
  }

  const { error } = await ctx.supabase
    .from('board_columns')
    .update({ name: trimmed })
    .eq('id', columnId)

  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function deleteColumn(columnId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: column } = await ctx.supabase
    .from('board_columns')
    .select('board_id, name, is_primary, board:boards(slug)')
    .eq('id', columnId)
    .single()

  if (!column) return { error: 'Coluna não encontrada' }

  if (column.is_primary) {
    return { error: 'A coluna principal não pode ser excluída' }
  }

  const boardSlug = (column.board as unknown as { slug: string })?.slug ?? slug
  if (!canDeleteBoardColumn(boardSlug, column.name)) {
    return { error: 'Esta coluna é fixa e não pode ser excluída' }
  }

  const { error } = await ctx.supabase.from('board_columns').delete().eq('id', columnId)
  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function createItem(boardId: string, groupId: string, name: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: last } = await ctx.supabase
    .from('board_items')
    .select('position')
    .eq('group_id', groupId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { data: item, error } = await ctx.supabase
    .from('board_items')
    .insert({
      board_id: boardId,
      group_id: groupId,
      name,
      position: (last?.position ?? -1) + 1,
      created_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  if (item?.id) {
    await logBoardItemActivity(ctx.supabase, {
      itemId: item.id,
      userId: ctx.user.id,
      type: 'created',
    })
  }
  revalidateBoard(slug)
  return { success: true, itemId: item?.id }
}

export async function updateItemName(itemId: string, name: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: item } = await ctx.supabase
    .from('board_items')
    .select('name')
    .eq('id', itemId)
    .single()

  const { error } = await ctx.supabase.from('board_items').update({ name }).eq('id', itemId)
  if (error) return { error: error.message }

  if (item && item.name !== name) {
    await logBoardItemActivity(ctx.supabase, {
      itemId,
      userId: ctx.user.id,
      type: 'name_change',
      metadata: { old_name: item.name, new_name: name },
    })
  }

  revalidateBoard(slug)
  return { success: true }
}

export async function reorderItems(groupId: string, itemIds: string[], slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  await Promise.all(
    itemIds.map((id, index) =>
      ctx.supabase
        .from('board_items')
        .update({ position: index })
        .eq('id', id)
        .eq('group_id', groupId)
    )
  )

  revalidateBoard(slug)
  return { success: true }
}

export async function moveItemToGroup(itemId: string, groupId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: item } = await ctx.supabase
    .from('board_items')
    .select('group_id')
    .eq('id', itemId)
    .single()

  const { data: groups } = await ctx.supabase
    .from('board_groups')
    .select('id, name')
    .in('id', [item?.group_id, groupId].filter(Boolean) as string[])

  const oldGroup = groups?.find(g => g.id === item?.group_id)
  const newGroup = groups?.find(g => g.id === groupId)

  const updates: { group_id: string; closed_at?: string | null } = { group_id: groupId }

  if (newGroup && isWonGroupName(newGroup.name)) {
    const { data: current } = await ctx.supabase
      .from('board_items')
      .select('closed_at')
      .eq('id', itemId)
      .single()
    if (!current?.closed_at) {
      updates.closed_at = new Date().toISOString()
    }
  } else if (oldGroup && isWonGroupName(oldGroup.name)) {
    updates.closed_at = null
  }

  const { error } = await ctx.supabase.from('board_items').update(updates).eq('id', itemId)
  if (error) return { error: error.message }

  if (item?.group_id !== groupId && newGroup) {
    await logBoardItemActivity(ctx.supabase, {
      itemId,
      userId: ctx.user.id,
      type: 'group_change',
      metadata: {
        old_group_name: oldGroup?.name ?? null,
        new_group_name: newGroup.name,
      },
    })
  }

  revalidateBoard(slug)
  return { success: true }
}

export async function deleteItem(itemId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase.from('board_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function upsertItemValue(itemId: string, columnId: string, value: CellValue, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const [{ data: column }, { data: existing }] = await Promise.all([
    ctx.supabase.from('board_columns').select('id, name, type, settings').eq('id', columnId).single(),
    ctx.supabase
      .from('board_item_values')
      .select('value')
      .eq('item_id', itemId)
      .eq('column_id', columnId)
      .maybeSingle(),
  ])

  const { error } = await ctx.supabase
    .from('board_item_values')
    .upsert({ item_id: itemId, column_id: columnId, value }, { onConflict: 'item_id,column_id' })

  if (error) return { error: error.message }

  const oldValue = existing?.value ?? null
  const valuesChanged = JSON.stringify(oldValue) !== JSON.stringify(value)

  if (valuesChanged && column) {
    await logBoardItemActivity(ctx.supabase, {
      itemId,
      userId: ctx.user.id,
      type: 'field_update',
      metadata: {
        column_id: columnId,
        column_name: column.name,
        column_type: column.type,
        old_value: oldValue,
        new_value: value,
      },
    })
  }

  revalidateBoard(slug)
  return { success: true }
}

export async function moveLeadToContacts(leadItemId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { organizationId, supabase, user } = ctx

  const { data: leadItem } = await supabase
    .from('board_items')
    .select('*, board:boards(slug)')
    .eq('id', leadItemId)
    .single()

  if (!leadItem || (leadItem.board as unknown as { slug: string }).slug !== 'leads') {
    return { error: 'Item não é um lead' }
  }

  const { data: leadValues } = await supabase
    .from('board_item_values')
    .select('*, column:board_columns(name, type)')
    .eq('item_id', leadItemId)

  const valueMap: Record<string, unknown> = {}
  for (const v of leadValues ?? []) {
    const col = v.column as unknown as { name: string; type: string }
    valueMap[col.name] = v.value
  }

  const { data: contactsBoard } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'contatos')
    .single()

  if (!contactsBoard) return { error: 'Board Contatos não encontrado' }

  const { data: contactGroup } = await supabase
    .from('board_groups')
    .select('id')
    .eq('board_id', contactsBoard.id)
    .order('position')
    .limit(1)
    .single()

  if (!contactGroup) return { error: 'Grupo Contatos não encontrado' }

  const { data: contactColumns } = await supabase
    .from('board_columns')
    .select('*')
    .eq('board_id', contactsBoard.id)

  const { data: newContact, error: createError } = await supabase
    .from('board_items')
    .insert({
      board_id: contactsBoard.id,
      group_id: contactGroup.id,
      name: leadItem.name,
      created_by: user.id,
      position: 999,
    })
    .select('id')
    .single()

  if (createError || !newContact) return { error: createError?.message ?? 'Erro ao criar contato' }

  const fieldMapping: Record<string, string> = {
    'Empresa': 'Conta',
    'Cargo': 'Cargo',
    'E-mail': 'E-mail',
  }

  for (const col of contactColumns ?? []) {
    const leadColName = Object.entries(fieldMapping).find(([, v]) => v === col.name)?.[0]
    if (leadColName && valueMap[leadColName]) {
      await supabase.from('board_item_values').insert({
        item_id: newContact.id,
        column_id: col.id,
        value: valueMap[leadColName] as CellValue,
      })
    }
    if (col.name === 'Tipo' && col.type === 'status') {
      const settings = col.settings as { options?: { id: string; label: string }[] }
      const leadOption = settings.options?.find(o => o.label === 'Lead')
      if (leadOption) {
        await supabase.from('board_item_values').insert({
          item_id: newContact.id,
          column_id: col.id,
          value: { option_id: leadOption.id },
        })
      }
    }
  }

  revalidateBoard('leads')
  revalidateBoard('contatos')
  return { success: true, contactId: newContact.id }
}

export async function moveLeadToNegociacoes(leadItemId: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const contactResult = await moveLeadToContacts(leadItemId)
  if (contactResult.error || !contactResult.contactId) {
    return { error: contactResult.error ?? 'Erro ao criar contato' }
  }

  const { organizationId, supabase, user } = ctx

  const { data: leadItem } = await supabase
    .from('board_items')
    .select('name')
    .eq('id', leadItemId)
    .single()

  if (!leadItem) return { error: 'Lead não encontrado' }

  const { data: leadValues } = await supabase
    .from('board_item_values')
    .select('*, column:board_columns(name, type)')
    .eq('item_id', leadItemId)

  const valueMap: Record<string, unknown> = {}
  for (const v of leadValues ?? []) {
    const col = v.column as unknown as { name: string; type: string }
    valueMap[col.name] = v.value
  }

  const { data: negociacoesBoard } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'negociacoes')
    .single()

  if (!negociacoesBoard) return { error: 'Board Negociações não encontrado' }

  const { data: activeGroup } = await supabase
    .from('board_groups')
    .select('id')
    .eq('board_id', negociacoesBoard.id)
    .ilike('name', 'oportunidades ativas')
    .single()

  if (!activeGroup) return { error: 'Grupo Oportunidades ativas não encontrado' }

  const { data: negociacoesColumns } = await supabase
    .from('board_columns')
    .select('*')
    .eq('board_id', negociacoesBoard.id)

  const { data: newDeal, error: createError } = await supabase
    .from('board_items')
    .insert({
      board_id: negociacoesBoard.id,
      group_id: activeGroup.id,
      name: `Negociação ${leadItem.name}`,
      created_by: user.id,
      position: 999,
    })
    .select('id')
    .single()

  if (createError || !newDeal) {
    return { error: createError?.message ?? 'Erro ao criar negociação' }
  }

  for (const col of negociacoesColumns ?? []) {
    if (col.name === 'Cronograma' && col.type === 'timeline' && valueMap['Cronograma']) {
      await supabase.from('board_item_values').insert({
        item_id: newDeal.id,
        column_id: col.id,
        value: valueMap['Cronograma'] as CellValue,
      })
    }
    if (col.name === 'Etapa' && col.type === 'status') {
      const settings = col.settings as { options?: { id: string; label: string }[] }
      const discoveryOption = settings.options?.find(o => o.label === 'Descoberta')
      if (discoveryOption) {
        await supabase.from('board_item_values').insert({
          item_id: newDeal.id,
          column_id: col.id,
          value: { option_id: discoveryOption.id },
        })
      }
    }
    if (col.name === 'Contato' && col.type === 'relation') {
      await supabase.from('board_item_values').insert({
        item_id: newDeal.id,
        column_id: col.id,
        value: { item_ids: [contactResult.contactId] },
      })
    }
  }

  revalidateBoard('negociacoes')
  revalidateBoard('negociacoes/kanban')
  return { success: true, dealId: newDeal.id, contactId: contactResult.contactId }
}

export async function updateDealEtapa(itemId: string, optionId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: board } = await ctx.supabase
    .from('boards')
    .select('id')
    .eq('organization_id', ctx.organizationId)
    .eq('slug', 'negociacoes')
    .single()

  if (!board) return { error: 'Board não encontrado' }

  const { data: stageCol } = await ctx.supabase
    .from('board_columns')
    .select('id, settings')
    .eq('board_id', board.id)
    .eq('name', 'Etapa')
    .single()

  if (!stageCol) return { error: 'Coluna Etapa não encontrada' }

  const { error } = await ctx.supabase
    .from('board_item_values')
    .upsert(
      { item_id: itemId, column_id: stageCol.id, value: { option_id: optionId } },
      { onConflict: 'item_id,column_id' }
    )

  if (error) return { error: error.message }

  const options = (stageCol.settings as { options?: { id: string; label: string }[] })?.options ?? []
  const selected = options.find(o => o.id === optionId)
  const isWon = selected ? isWonStageLabel(selected.label) : false

  await syncDealWonState(ctx.supabase, itemId, board.id, isWon)

  revalidateBoard(slug)
  return { success: true }
}

export async function moveDealStage(itemId: string, optionId: string) {
  return updateDealEtapa(itemId, optionId, 'negociacoes')
}
