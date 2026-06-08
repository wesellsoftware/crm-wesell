'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  CircleDot,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MemberAvatar } from './cells/member-avatar'
import { RichTextContent } from './rich-text-content'
import { RichTextEditor } from './rich-text-editor'
import {
  createItemComment,
  getItemActivities,
  updateItemComment,
} from '@/app/actions/board-item-activities'
import { formatActivityMessage, formatRelativeTime } from '@/lib/boards/format-activity'
import type {
  BoardColumn,
  BoardItem,
  BoardItemActivity,
  OrgMember,
} from '@/lib/boards/types'

const ACTIVITY_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  comment: MessageSquare,
  name_change: Pencil,
  group_change: Layers,
  field_update: CircleDot,
}

interface ItemActivityFeedProps {
  item: BoardItem
  slug: string
  columns: BoardColumn[]
  members: OrgMember[]
  relatedNames: Record<string, string>
  createdBy?: OrgMember | null
  currentUserId?: string | null
}

function buildSyntheticCreatedActivity(
  item: BoardItem,
  createdBy?: OrgMember | null
): BoardItemActivity {
  return {
    id: `synthetic-created-${item.id}`,
    item_id: item.id,
    user_id: item.created_by,
    type: 'created',
    body: null,
    metadata: {},
    created_at: item.created_at,
    user: createdBy ?? null,
  }
}

function CommentBody({
  activity,
  slug,
  itemId,
  canEdit,
  onUpdated,
}: {
  activity: BoardItemActivity
  slug: string
  itemId: string
  canEdit: boolean
  onUpdated: (updated: BoardItemActivity) => void
}) {
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()

  if (!activity.body) return null

  if (editing) {
    return (
      <div className="mt-2">
        <RichTextEditor
          itemId={itemId}
          initialHtml={activity.body}
          submitLabel="Salvar"
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async html => {
            startTransition(async () => {
              const result = await updateItemComment(activity.id, html, slug)
              if (!result.error) {
                setEditing(false)
                onUpdated({
                  ...activity,
                  body: html,
                  metadata: { ...activity.metadata, format: 'html', edited_at: new Date().toISOString() },
                })
              }
            })
          }}
        />
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 group/comment relative">
      {canEdit && (
        <div className="absolute top-2 right-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label="Ações do comentário" />
              }
            >
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <RichTextContent html={activity.body} />
      {!!activity.metadata.edited_at && (
        <p className="font-mono text-[10px] text-we-paper/30 mt-2">editado</p>
      )}
    </div>
  )
}

function ActivityTimeline({
  activities,
  item,
  slug,
  columns,
  members,
  relatedNames,
  currentUserId,
  onActivityUpdated,
}: {
  activities: BoardItemActivity[]
  item: BoardItem
  slug: string
  columns: BoardColumn[]
  members: OrgMember[]
  relatedNames: Record<string, string>
  currentUserId?: string | null
  onActivityUpdated: (updated: BoardItemActivity) => void
}) {
  if (activities.length === 0) {
    return (
      <p className="font-body text-xs text-we-paper/35 py-4 text-center">
        Nenhuma atividade ainda.
      </p>
    )
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/[0.08]" />
      {activities.map(activity => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? RefreshCw
        const userName = activity.user?.full_name ?? 'Usuário'
        const { action, detail } = formatActivityMessage(
          activity.type,
          activity.metadata,
          columns,
          members,
          relatedNames
        )
        const canEdit =
          activity.type === 'comment' &&
          !!currentUserId &&
          activity.user_id === currentUserId &&
          !activity.id.startsWith('synthetic-') &&
          !activity.id.startsWith('pending-')

        return (
          <div key={activity.id} className="relative pb-5 last:pb-2">
            <div className="absolute -left-6 top-0.5 size-[18px] rounded-full bg-we-ink border border-white/[0.10] flex items-center justify-center">
              <Icon size={10} className="text-we-paper/45" />
            </div>

            <div className="flex items-start gap-2">
              {activity.user && (
                <MemberAvatar member={activity.user} size="sm" title={userName} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs text-we-paper/70 leading-relaxed">
                  <span className="font-medium text-we-paper/85">{userName}</span>{' '}
                  {action}
                  {detail && (
                    <>
                      {' '}
                      <span className="font-medium text-we-paper/90">{detail}</span>
                    </>
                  )}
                  <span className="text-we-paper/35 ml-1.5">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </p>

                {activity.type === 'comment' && (
                  <CommentBody
                    activity={activity}
                    slug={slug}
                    itemId={item.id}
                    canEdit={canEdit}
                    onUpdated={onActivityUpdated}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ItemActivityFeed({
  item,
  slug,
  columns,
  members,
  relatedNames,
  createdBy,
  currentUserId,
}: ItemActivityFeedProps) {
  const [activities, setActivities] = useState<BoardItemActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const currentUser = currentUserId
    ? members.find(m => m.id === currentUserId) ?? null
    : null

  const loadActivities = useCallback(() => {
    setLoading(true)
    startTransition(async () => {
      const data = await getItemActivities(item.id)
      const hasCreated = data.some(a => a.type === 'created')
      setActivities(hasCreated ? data : [...data, buildSyntheticCreatedActivity(item, createdBy)])
      setLoading(false)
    })
  }, [item, createdBy])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  function handleActivityUpdated(updated: BoardItemActivity) {
    setActivities(prev => prev.map(a => (a.id === updated.id ? updated : a)))
  }

  function handleCommentSubmit(html: string) {
    const pendingId = `pending-${Date.now()}`
    const optimistic: BoardItemActivity = {
      id: pendingId,
      item_id: item.id,
      user_id: currentUserId ?? null,
      type: 'comment',
      body: html,
      metadata: { format: 'html' },
      created_at: new Date().toISOString(),
      user: currentUser,
    }

    setActivities(prev => [optimistic, ...prev])

    startTransition(async () => {
      const result = await createItemComment(item.id, html, slug)
      if (result.activity) {
        setActivities(prev => [
          result.activity!,
          ...prev.filter(a => a.id !== pendingId),
        ])
      } else {
        setActivities(prev => prev.filter(a => a.id !== pendingId))
        if (result.error) {
          console.error('Erro ao salvar comentário:', result.error)
        }
      }
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-body text-sm font-medium text-we-paper/80">Atividade</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={loadActivities}
          disabled={loading}
          aria-label="Atualizar atividades"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading && activities.length === 0 ? (
        <p className="font-body text-xs text-we-paper/35 py-4 text-center">Carregando...</p>
      ) : (
        <ActivityTimeline
          activities={activities}
          item={item}
          slug={slug}
          columns={columns}
          members={members}
          relatedNames={relatedNames}
          currentUserId={currentUserId}
          onActivityUpdated={handleActivityUpdated}
        />
      )}

      <div className="mt-6 pt-4 border-t border-white/[0.06]">
        <RichTextEditor
          itemId={item.id}
          placeholder="Adicionar comentário..."
          submitLabel="Comentar"
          onSubmit={handleCommentSubmit}
        />
      </div>
    </div>
  )
}
