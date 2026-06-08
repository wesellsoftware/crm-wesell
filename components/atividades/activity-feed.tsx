'use client'

import { useState, useTransition } from 'react'
import { Activity } from 'lucide-react'
import { getOrganizationFeed } from '@/app/actions/feed'
import { FeedEventRow } from './feed-event-row'
import type { FeedCategory, FeedEvent } from '@/lib/feed/types'

interface ActivityFeedProps {
  initialEvents: FeedEvent[]
  initialCursor: string | null
  category?: FeedCategory
}

export function ActivityFeed({ initialEvents, initialCursor, category }: ActivityFeedProps) {
  const [events, setEvents] = useState(initialEvents)
  const [cursor, setCursor] = useState(initialCursor)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    if (!cursor || isPending) return

    startTransition(async () => {
      const page = await getOrganizationFeed({ cursor, category })
      setEvents(prev => [...prev, ...page.events])
      setCursor(page.nextCursor)
    })
  }

  if (events.length === 0) {
    return (
      <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
        <div className="size-12 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Activity size={20} className="text-we-paper/30" />
        </div>
        <p className="font-body text-we-paper/50">Nenhuma movimentação encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl divide-y divide-white/[0.06]">
        {events.map(event => (
          <FeedEventRow key={event.id} event={event} />
        ))}
      </div>

      {cursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="font-body text-sm px-5 py-2 rounded-[8px] glass-input border border-white/[0.10] text-we-paper/60 hover:text-we-paper/80 hover:bg-white/[0.03] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
