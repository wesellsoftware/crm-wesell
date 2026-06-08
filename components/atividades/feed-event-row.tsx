import Link from 'next/link'
import {
  CircleDot,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Webhook,
} from 'lucide-react'
import { MemberAvatar } from '@/components/board/cells/member-avatar'
import { RichTextContent } from '@/components/board/rich-text-content'
import {
  FEED_CATEGORY_COLORS,
  formatRelativeTime,
  getFeedEventIconType,
} from '@/lib/feed/format-feed-event'
import { FEED_CATEGORY_LABELS, type FeedEvent } from '@/lib/feed/types'

const FEED_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  comment: MessageSquare,
  name_change: Pencil,
  group_change: Layers,
  field_update: CircleDot,
  deleted: Trash2,
  webhook: Webhook,
  default: RefreshCw,
}

interface FeedEventRowProps {
  event: FeedEvent
}

export function FeedEventRow({ event }: FeedEventRowProps) {
  const iconType = getFeedEventIconType(event.event_type)
  const Icon = FEED_ICONS[iconType] ?? FEED_ICONS.default
  const userName = event.user?.full_name ?? 'Sistema'
  const boardSlug = event.metadata.board_slug as string | undefined
  const boardName = event.metadata.board_name as string | undefined
  const categoryColor = FEED_CATEGORY_COLORS[event.category] ?? '#4342F5'
  const showBody = !!event.body && (event.event_type === 'comment' || event.metadata.format === 'html')

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="relative shrink-0 mt-0.5">
        {event.user ? (
          <MemberAvatar member={event.user} size="sm" title={userName} />
        ) : (
          <div className="size-7 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
            <Icon size={12} className="text-we-paper/45" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] px-2 py-0.5 rounded-full mt-0.5 shrink-0"
            style={{
              background: `${categoryColor}22`,
              color: categoryColor,
            }}
          >
            {FEED_CATEGORY_LABELS[event.category]}
          </span>

          <p className="font-body text-sm text-we-paper/80 leading-relaxed flex-1 min-w-0">
            <span className="font-medium text-we-paper/90">{userName}</span>{' '}
            {event.summary}
            <span className="text-we-paper/35 ml-1.5 font-mono text-[11px]">
              {formatRelativeTime(event.created_at)}
            </span>
          </p>
        </div>

        {boardSlug && boardName && (
          <Link
            href={`/boards/${boardSlug}`}
            className="inline-block font-mono text-[10px] text-we-green/70 hover:text-we-green transition-colors mt-1"
          >
            {boardName}
          </Link>
        )}

        {showBody && (
          <div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <RichTextContent html={event.body!} />
          </div>
        )}
      </div>
    </div>
  )
}
