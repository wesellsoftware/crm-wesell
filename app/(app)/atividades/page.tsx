import { getOrganizationFeed } from '@/app/actions/feed'
import { ActivityFeed } from '@/components/atividades/activity-feed'
import { FeedFilters } from '@/components/atividades/feed-filters'
import { PageTitle } from '@/components/page-title'
import type { FeedCategory } from '@/lib/feed/types'

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const category = categoria as FeedCategory | undefined

  const { events, nextCursor } = await getOrganizationFeed({ category })

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <PageTitle>Atividades</PageTitle>
        <p className="font-body text-we-green/70 text-sm mt-0.5">
          Últimas movimentações do CRM
        </p>
      </div>

      <FeedFilters category={category} />

      <ActivityFeed
        initialEvents={events}
        initialCursor={nextCursor}
        category={category}
      />
    </div>
  )
}
