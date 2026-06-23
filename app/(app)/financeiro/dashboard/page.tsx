import { PageTitle } from '@/components/page-title'
import { FinCompareSelector } from '@/components/financeiro/fin-compare-selector'
import { FinMonthSelector } from '@/components/financeiro/fin-month-selector'
import { FinCashProjectionChart } from '@/components/financeiro/fin-cash-projection-chart'
import { FinRevenueBreakdownChart } from '@/components/financeiro/fin-revenue-breakdown-chart'
import { FinRevenueByCategoryChart } from '@/components/financeiro/fin-revenue-by-category-chart'
import { FinAlertsSection } from '@/components/financeiro/fin-alerts-section'
import { FinDashboardKpis } from '@/components/financeiro/fin-dashboard-kpis'
import { getFinDashboardData, getFinAlertsData } from '@/lib/financeiro/queries'
import { formatPeriodLabel, parsePeriod } from '@/lib/financeiro/period'
import type { MetricComparisonBase } from '@/lib/financeiro/types'

type SearchParams = { compare?: string; period?: string }

function parseCompare(v?: string): MetricComparisonBase {
  if (v === 'prev' || v === 'yoy') return v
  return 'avg3'
}

export default async function FinanceiroDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const compare = parseCompare(params.compare)
  const period = parsePeriod(params.period)

  const [data, alerts] = await Promise.all([
    getFinDashboardData(compare, period),
    getFinAlertsData(),
  ])

  const periodLabel = formatPeriodLabel(period)

  return (
    <div className="p-8 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <PageTitle>Financeiro</PageTitle>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            Visão gerencial — {periodLabel}{data.projected ? ' (previsto)' : ''}
          </p>
        </div>
        <FinCompareSelector current={compare} period={period} />
      </div>

      <FinMonthSelector period={period} compare={compare} />

      <FinDashboardKpis
        scorecards={data.scorecards}
        monthResult={data.monthResult}
        periodLabel={periodLabel}
        projected={data.projected}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <div>
            <p className="font-body text-sm font-semibold text-we-paper/70">Projeção de caixa</p>
            <p className="font-body text-xs text-we-paper/35 mt-0.5">
              Por competência · 6 meses antes do mês selecionado · 6 meses de projeção futura
            </p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <FinCashProjectionChart data={data.cashProjection} selectedPeriod={period} />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <div>
            <p className="font-body text-sm font-semibold text-we-paper/70">Receita por natureza</p>
            <p className="font-body text-xs text-we-paper/35 mt-0.5">
              {data.projected ? 'Previsto' : 'Realizado'} em {periodLabel}
            </p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <FinRevenueBreakdownChart
              recorrente={data.revenueBreakdown.recorrente}
              pontual={data.revenueBreakdown.pontual}
            />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <div>
            <p className="font-body text-sm font-semibold text-we-paper/70">Receita por categoria</p>
            <p className="font-body text-xs text-we-paper/35 mt-0.5">
              {data.projected ? 'Previsto' : 'Realizado'} em {periodLabel}
            </p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <FinRevenueByCategoryChart data={data.revenueByCategory} />
          </div>
        </div>
      </div>

      <div>
        <p className="font-body text-sm font-semibold text-we-paper/50 uppercase tracking-wide mb-3">
          Alertas
        </p>
        <FinAlertsSection data={alerts} />
      </div>
    </div>
  )
}
