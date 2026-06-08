'use server'

import { revalidatePath } from 'next/cache'
import { getOrgContext } from '@/lib/boards/org-context'
import { getRelationItems as fetchRelationItems } from '@/lib/boards/queries'
import type {
  BoardColumn,
  CellValue,
  ColumnSettings,
  ColumnType,
} from '@/lib/boards/types'

function revalidateBoard(slug: string) {
  revalidatePath(`/boards/${slug}`)
  revalidatePath(`/boards/${slug}/kanban`)
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

  const { error } = await ctx.supabase.from('board_groups').insert({
    board_id: boardId,
    name,
    color,
    position: (last?.position ?? -1) + 1,
  })

  if (error) return { error: error.message }
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
  revalidateBoard(slug)
  return { success: true, itemId: item?.id }
}

export async function updateItemName(itemId: string, name: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase.from('board_items').update({ name }).eq('id', itemId)
  if (error) return { error: error.message }
  revalidateBoard(slug)
  return { success: true }
}

export async function moveItemToGroup(itemId: string, groupId: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase.from('board_items').update({ group_id: groupId }).eq('id', itemId)
  if (error) return { error: error.message }
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

  const { error } = await ctx.supabase
    .from('board_item_values')
    .upsert({ item_id: itemId, column_id: columnId, value }, { onConflict: 'item_id,column_id' })

  if (error) return { error: error.message }
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

export async function moveDealStage(itemId: string, optionId: string) {
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
    .select('id')
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

  const wonStage = await ctx.supabase
    .from('board_columns')
    .select('settings')
    .eq('id', stageCol.id)
    .single()

  const options = (wonStage.data?.settings as { options?: { id: string; label: string }[] })?.options ?? []
  const isWon = options.find(o => o.id === optionId)?.label === 'Fechado/Ganho'

  if (isWon) {
    const { data: wonGroup } = await ctx.supabase
      .from('board_groups')
      .select('id')
      .eq('board_id', board.id)
      .eq('name', 'Fechado/Ganho')
      .single()

    if (wonGroup) {
      await ctx.supabase.from('board_items').update({ group_id: wonGroup.id }).eq('id', itemId)
    }
  }

  revalidateBoard('negociacoes')
  revalidateBoard('negociacoes/kanban')
  return { success: true }
}
