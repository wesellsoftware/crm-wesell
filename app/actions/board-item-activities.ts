'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getOrgContext } from '@/lib/boards/org-context'
import { logFeedEvent, resolveItemFeedContext } from '@/lib/feed/log-feed-event'
import type { BoardItemActivity } from '@/lib/boards/types'

const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function revalidateItemBoard(slug: string) {
  revalidatePath(`/boards/${slug}`)
  revalidatePath(`/boards/${slug}/kanban`)
  revalidatePath('/atividades')
}

async function attachActivityUsers(
  supabase: SupabaseClient,
  rows: Array<{
    id: string
    item_id: string
    user_id: string | null
    type: string
    body: string | null
    metadata: unknown
    created_at: string
  }>
): Promise<BoardItemActivity[]> {
  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))] as string[]

  let profilesById = new Map<string, BoardItemActivity['user']>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    profilesById = new Map(
      (profiles ?? []).map(p => [p.id, p as BoardItemActivity['user']])
    )
  }

  return rows.map(row => ({
    id: row.id,
    item_id: row.item_id,
    user_id: row.user_id,
    type: row.type as BoardItemActivity['type'],
    body: row.body,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
    user: row.user_id ? profilesById.get(row.user_id) ?? null : null,
  }))
}

export async function getItemActivities(itemId: string): Promise<BoardItemActivity[]> {
  const ctx = await getOrgContext()
  if (!ctx) return []

  const { data, error } = await ctx.supabase
    .from('board_item_activities')
    .select('id, item_id, user_id, type, body, metadata, created_at')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getItemActivities error:', error.message)
    return []
  }

  return attachActivityUsers(ctx.supabase, data ?? [])
}

export async function createItemComment(itemId: string, body: string, slug: string) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comentário vazio' }

  const { data, error } = await ctx.supabase
    .from('board_item_activities')
    .insert({
      item_id: itemId,
      user_id: ctx.user.id,
      type: 'comment',
      body: trimmed,
      metadata: { format: 'html' },
    })
    .select('id, item_id, user_id, type, body, metadata, created_at')
    .single()

  if (error) return { error: error.message }

  const feedContext = await resolveItemFeedContext(ctx.supabase, itemId)
  if (feedContext) {
    await logFeedEvent(ctx.supabase, {
      organizationId: feedContext.organizationId,
      userId: ctx.user.id,
      category: 'board',
      eventType: 'comment',
      summary: `comentou em ${feedContext.itemName} (${feedContext.boardName})`,
      body: trimmed,
      entityType: 'board_item',
      entityId: itemId,
      metadata: {
        board_slug: feedContext.boardSlug,
        board_name: feedContext.boardName,
        item_name: feedContext.itemName,
        format: 'html',
      },
    })
  }

  const [activity] = await attachActivityUsers(ctx.supabase, [data])

  revalidateItemBoard(slug)
  return { success: true, activity }
}

export async function updateItemComment(
  activityId: string,
  body: string,
  slug: string
) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comentário vazio' }

  const { error } = await ctx.supabase
    .from('board_item_activities')
    .update({
      body: trimmed,
      metadata: { format: 'html', edited_at: new Date().toISOString() },
    })
    .eq('id', activityId)
    .eq('user_id', ctx.user.id)
    .eq('type', 'comment')

  if (error) return { error: error.message }

  revalidateItemBoard(slug)
  return { success: true }
}

export async function uploadActivityImage(formData: FormData) {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Não autenticado' }

  const file = formData.get('file')
  const itemId = formData.get('itemId') as string

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione uma imagem válida.' }
  }
  if (!itemId) return { error: 'Item inválido.' }
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return { error: 'Formato não suportado. Use JPG, PNG, WebP ou GIF.' }
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { error: 'A imagem deve ter no máximo 5 MB.' }
  }

  const { data: item } = await ctx.supabase
    .from('board_items')
    .select('id')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Item não encontrado.' }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `${ctx.organizationId}/${itemId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await ctx.supabase.storage
    .from('board-activities')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = ctx.supabase.storage
    .from('board-activities')
    .getPublicUrl(path)

  return { success: true, url: publicUrl }
}
