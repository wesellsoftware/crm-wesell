'use server'

import { getOrgContext } from '@/lib/boards/org-context'
import type { FeedCategory, FeedEvent, FeedPage } from '@/lib/feed/types'

const DEFAULT_LIMIT = 50

export async function getOrganizationFeed(options?: {
  cursor?: string
  limit?: number
  category?: FeedCategory
  boardSlug?: string
}): Promise<FeedPage> {
  const ctx = await getOrgContext()
  if (!ctx) return { events: [], nextCursor: null }

  const limit = options?.limit ?? DEFAULT_LIMIT

  let query = ctx.supabase
    .from('organization_feed_events')
    .select(
      'id, organization_id, user_id, category, event_type, summary, body, entity_type, entity_id, metadata, created_at'
    )
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.boardSlug) {
    query = query.eq('metadata->>board_slug', options.boardSlug)
  }

  if (options?.cursor) {
    const [createdAt, id] = options.cursor.split('|')
    if (createdAt && id) {
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
      )
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('getOrganizationFeed error:', error.message)
    return { events: [], nextCursor: null }
  }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows

  const userIds = [...new Set(pageRows.map(r => r.user_id).filter(Boolean))] as string[]
  let profilesById = new Map<string, FeedEvent['user']>()

  if (userIds.length > 0) {
    const { data: profiles } = await ctx.supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    profilesById = new Map(
      (profiles ?? []).map(p => [p.id, p as FeedEvent['user']])
    )
  }

  const events: FeedEvent[] = pageRows.map(row => ({
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    category: row.category as FeedCategory,
    event_type: row.event_type as FeedEvent['event_type'],
    summary: row.summary,
    body: row.body,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
    user: row.user_id ? profilesById.get(row.user_id) ?? null : null,
  }))

  const last = pageRows[pageRows.length - 1]
  const nextCursor = hasMore && last ? `${last.created_at}|${last.id}` : null

  return { events, nextCursor }
}
