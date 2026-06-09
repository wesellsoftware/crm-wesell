import { createClient } from '@/lib/supabase/server'
import { getOrganizationFeed } from '@/app/actions/feed'
import { getDashboardBoardStats, getNegociacoesAnalytics } from '@/lib/boards/queries'
import { DealsByStageChart } from '@/components/dashboard/deals-by-stage-chart'
import { PipelineKpis } from '@/components/dashboard/pipeline-kpis'
import { SalesKpis } from '@/components/dashboard/sales-kpis'
import { RevenueByProductChart } from '@/components/relatorios/revenue-by-product-chart'
import { TopSellersRanking } from '@/components/relatorios/top-sellers-ranking'
import { PageTitle } from '@/components/page-title'
import { MemberAvatar } from '@/components/board/cells/member-avatar'
import { formatRelativeTime } from '@/lib/feed/format-feed-event'
import { FEED_CATEGORY_LABELS } from '@/lib/feed/types'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [boardStats, analytics, feedPage] = await Promise.all([
    getDashboardBoardStats(),
    getNegociacoesAnalytics(),
    getOrganizationFeed({ limit: 5 }),
  ])

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id ?? '')
    .single()

  const recentEvents = feedPage.events
  const today = new Date()
  const openCount = boardStats?.openCount ?? 0
  const pipelineValue = boardStats?.pipelineValue ?? 0
  const wonCount = boardStats?.wonCount ?? 0
  const conversionRate = boardStats?.conversionRate ?? 0
  const chartData = boardStats?.chartData ?? []
  const revenueByProduct = analytics?.revenueByProduct ?? []
  const topSellers = analytics?.topSellers ?? []

  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  return (
    <div className="p-8 space-y-7">
      <div>
        <PageTitle>
          {greeting}, {firstName}.
        </PageTitle>
        <p className="font-body text-we-paper/45 mt-1 text-sm">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {analytics && (
        <section className="space-y-3">
          <p className="font-body text-sm font-semibold text-we-paper/70">Indicadores de negociações</p>
          <SalesKpis analytics={analytics} />
        </section>
      )}

      <section className="glass rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <p className="font-body text-sm font-semibold text-we-paper/70">Receita por produto</p>
            <div className="min-h-[240px]">
              <RevenueByProductChart data={revenueByProduct} />
            </div>
          </div>
          <div className="space-y-4">
            <p className="font-body text-sm font-semibold text-we-paper/70">Top vendedores</p>
            <TopSellersRanking data={topSellers} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="font-body text-sm font-semibold text-we-paper/70">Pipeline</p>
        <PipelineKpis
          openCount={openCount}
          pipelineValue={pipelineValue}
          wonCount={wonCount}
          conversionRate={conversionRate}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Negociações por etapa</p>
          <div className="flex-1 min-h-[200px]">
            <DealsByStageChart data={chartData} />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-semibold text-we-paper/70">Atividades recentes</p>
            <Link
              href="/atividades"
              className="font-mono text-[10px] text-we-blue/70 hover:text-we-blue transition-colors"
            >
              Ver todas
            </Link>
          </div>
          {!recentEvents.length ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-we-paper/25">Nenhuma atividade ainda</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentEvents.map(event => {
                const userName = event.user?.full_name ?? 'Sistema'
                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {event.user ? (
                        <MemberAvatar member={event.user} size="sm" title={userName} />
                      ) : (
                        <div className="size-7 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
                          <span className="size-2 rounded-full bg-we-blue/60" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-we-paper/80 line-clamp-2">
                        <span className="font-medium text-we-paper/90">{userName}</span>{' '}
                        {event.summary}
                      </p>
                      <p className="font-mono text-[11px] text-we-paper/35">
                        {FEED_CATEGORY_LABELS[event.category]} · {formatRelativeTime(event.created_at)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
