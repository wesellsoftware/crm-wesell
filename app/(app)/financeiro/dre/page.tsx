import { PageTitle } from '@/components/page-title'
import { FinDreTable } from '@/components/financeiro/fin-dre-table'
import { FinDrePeriodSelector } from '@/components/financeiro/fin-dre-period-selector'
import { getFinDreData } from '@/lib/financeiro/queries'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, BarChart3, Percent } from 'lucide-react'

type SearchParams = {
  period?: string
  regime?: string
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function pctDisplay(part: number, total: number): string {
  if (!total) return '—'
  return `${((part / total) * 100).toFixed(1)}%`
}

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const period = /^\d{4}-\d{2}$/.test(params.period ?? '') ? params.period! : currentMonth()
  const regime: 'caixa' | 'competencia' =
    params.regime === 'caixa' ? 'caixa' : 'competencia'

  const data = await getFinDreData(period, regime)

  const summaryCards = [
    {
      label: 'Receita Bruta',
      value: data.receitaBruta > 0 ? formatCurrency(data.receitaBruta) : '—',
      icon: TrendingUp,
      color: '#45F47F',
    },
    {
      label: 'Resultado',
      value: data.receitaBruta > 0 ? formatCurrency(data.resultado) : '—',
      icon: BarChart3,
      color: data.resultado >= 0 ? '#45F47F' : '#F44545',
    },
    {
      label: 'Margem de Contribuição',
      value: data.receitaBruta > 0 ? pctDisplay(data.margemContribuicao, data.receitaBruta) : '—',
      icon: Percent,
      color: data.margemContribuicao >= 0 ? '#4342F5' : '#F44545',
    },
    {
      label: 'Margem Líquida',
      value: data.receitaBruta > 0 ? pctDisplay(data.resultado, data.receitaBruta) : '—',
      icon: TrendingDown,
      color: data.resultado >= 0 ? '#D7FE65' : '#F44545',
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <PageTitle>DRE Gerencial</PageTitle>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            Demonstrativo de resultado — visão gerencial
          </p>
        </div>
        <FinDrePeriodSelector period={period} regime={regime} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}22` }}
              >
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className={`font-body text-2xl leading-none ${data.receitaBruta === 0 ? 'text-we-paper/30' : 'text-we-paper'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* DRE table */}
      <FinDreTable data={data} />

      {/* Footer note */}
      <p className="font-body text-xs text-we-paper/25 text-center">
        % RB = percentual sobre a Receita Bruta &nbsp;·&nbsp;
        {regime === 'caixa'
          ? 'Regime Realizado: transações com vencimento no período que já foram pagas/recebidas.'
          : 'Regime de Competência: receitas recebidas e despesas com vencimento no período (despesas podem estar pendentes).'}
      </p>
    </div>
  )
}
