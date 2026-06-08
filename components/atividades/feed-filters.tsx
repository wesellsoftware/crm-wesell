import Link from 'next/link'
import type { FeedCategory } from '@/lib/feed/types'
import { FEED_CATEGORY_LABELS } from '@/lib/feed/types'

const FILTER_OPTIONS: { value: FeedCategory | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'board', label: FEED_CATEGORY_LABELS.board },
  { value: 'task', label: FEED_CATEGORY_LABELS.task },
  { value: 'settings', label: FEED_CATEGORY_LABELS.settings },
  { value: 'integration', label: FEED_CATEGORY_LABELS.integration },
]

interface FeedFiltersProps {
  category?: FeedCategory
}

export function FeedFilters({ category }: FeedFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map(({ value, label }) => {
        const active = category === value || (!category && value === '')
        const href = value ? `/atividades?categoria=${value}` : '/atividades'

        return (
          <Link
            key={value || 'all'}
            href={href}
            className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? value === 'board'
                  ? 'bg-we-green/20 border-we-green/40 text-we-green'
                  : 'bg-we-blue/20 border-we-blue/40 text-we-blue'
                : 'glass-input border-white/[0.10] text-we-paper/50 hover:text-we-paper/70'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
