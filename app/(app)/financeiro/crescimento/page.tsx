import { TrendingUp, BarChart3, RefreshCw, Activity } from 'lucide-react'
import { PageTitle } from '@/components/page-title'
import { FinGrowthChart } from '@/components/financeiro/fin-growth-chart'
import { FinWindowSelector } from '@/components/financeiro/fin-window-selector'
import { getFinGrowthData } from '@/lib/financeiro/queries'
import { formatCurrency } from '@/lib/utils'
import type { GrowthKpiContext, GrowthWindow } from '@/lib/financeiro/types'

type SearchParams = { window?: string }

function parseWindow(v?: string): GrowthWindow {
  if (v === '6m' || v === 'ytd' || v === 'all') return v
  return '12m'
}

function fmtPct(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(decimals)}%`
}

function fmtMonthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function pctColor(v: number | null): string {
  if (v === null) return 'text-we-paper/30'
  return v >= 0 ? 'text-emerald-400' : 'text-red-400'
}

function momHint(ctx: GrowthKpiContext | null, value: number | null): string {
  if (!ctx) return 'Primeiro mês de operação — sem mês anterior para comparar'
  const base = `${fmtMonthLabel(ctx.basePeriod)}: ${formatCurrency(ctx.baseAmount)}`
  const current = `${fmtMonthLabel(ctx.currentPeriod)}: ${formatCurrency(ctx.currentAmount)}`
  if (value === null) {
    if (ctx.baseAmount <= 0 && ctx.currentAmount > 0) {
      return `${base} → ${current}. Mês anterior sem faturamento — variação % indisponível`
    }
    if (ctx.baseAmount <= 0 && ctx.currentAmount <= 0) {
      return `${base} → ${current}. Ambos os meses sem faturamento`
    }
  }
  return `${base} → ${current}`
}

function cagrHint(
  value: number | null,
  ctx: GrowthKpiContext | null,
  monthsRemaining: number | null,
): string {
  if (monthsRemaining !== null) {
    return `Requer 12 meses desde mar/26. Faltam ${monthsRemaining} ${monthsRemaining === 1 ? 'mês' : 'meses'} (disponível em mar/27).`
  }
  if (!ctx) return 'Sem faturamento suficiente no período para calcular'
  return `${fmtMonthLabel(ctx.basePeriod)} (${formatCurrency(ctx.baseAmount)}) → ${fmtMonthLabel(ctx.currentPeriod)} (${formatCurrency(ctx.currentAmount)}), anualizado`
}

function momTableHint(row: { faturamento: number; mom: number | null }, prevFat: number | null): string | null {
  if (row.mom !== null) return null
  if (prevFat === null) return 'Primeiro mês de operação'
  if (prevFat <= 0 && row.faturamento > 0) return 'Mês anterior sem faturamento'
  if (prevFat <= 0 && row.faturamento <= 0) return 'Sem faturamento nos dois meses'
  return null
}

export default async function CrescimentoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const window = parseWindow(params.window)
  const data = await getFinGrowthData(window)

  const kpis = [
    {
      label: 'Crescimento MoM',
      value: fmtPct(data.currentMoM),
      color: pctColor(data.currentMoM),
      icon: TrendingUp,
      hint: momHint(data.momContext, data.currentMoM),
    },
    {
      label: 'Crescimento QoQ',
      value: fmtPct(data.currentQoQ),
      color: pctColor(data.currentQoQ),
      icon: BarChart3,
      hint: 'Faturamento do trimestre atual vs trimestre anterior',
    },
    {
      label: 'Crescimento YoY',
      value: fmtPct(data.currentYoY),
      color: pctColor(data.currentYoY),
      icon: RefreshCw,
      hint: 'Mês atual vs mesmo mês do ano passado (indisponível no 1º ano)',
    },
    {
      label: 'CAGR',
      value:
        data.cagrMonthsRemaining !== null
          ? `${data.cagrMonthsRemaining}m restantes`
          : data.cagr !== null
            ? fmtPct(data.cagr)
            : '—',
      color: data.cagr !== null ? pctColor(data.cagr) : 'text-we-paper/30',
      icon: Activity,
      hint: cagrHint(data.cagr, data.cagrContext, data.cagrMonthsRemaining),
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <PageTitle>Crescimento</PageTitle>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            Evolução do faturamento —{' '}
            {formatCurrency(data.acumulado)} acumulado na janela
          </p>
        </div>
        <FinWindowSelector current={window} basePath="/financeiro/crescimento" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, icon: Icon, hint }) => (
          <div key={label} className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
              <div className="size-7 rounded-lg flex items-center justify-center bg-white/[0.06]">
                <Icon size={14} className="text-we-paper/50" />
              </div>
            </div>
            <p className={`font-body text-3xl leading-none font-semibold ${color}`}>{value}</p>
            <p className="font-body text-xs text-we-paper/35 leading-relaxed">{hint}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6 flex flex-col gap-3 min-h-[340px]">
        <div>
          <p className="font-body text-sm font-semibold text-we-paper/70">Faturamento mensal</p>
          <p className="font-body text-xs text-we-paper/35 mt-0.5">
            Barras = faturamento por competência · Linha = média móvel 3m · desde mar/26
          </p>
        </div>
        <FinGrowthChart data={data.series} />
      </div>

      {data.series.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="py-3 pl-4 text-left font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">Período</th>
                <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">Faturamento</th>
                <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">MoM</th>
                <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">Média 3m</th>
              </tr>
            </thead>
            <tbody>
              {[...data.series].reverse().map((row, idx, reversed) => {
                const prevRow = reversed[idx + 1] ?? null
                const tableHint = momTableHint(row, prevRow?.faturamento ?? null)

                return (
                  <tr key={row.period} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 pl-4 font-body text-sm text-we-paper/70">{fmtMonthLabel(row.period)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-sm text-we-paper/80">{formatCurrency(row.faturamento)}</td>
                    <td
                      className={`py-2.5 pr-4 text-right font-body text-sm ${pctColor(row.mom)}`}
                      title={tableHint ?? undefined}
                    >
                      {fmtPct(row.mom)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-sm text-we-paper/50">
                      {row.avg3m !== null ? formatCurrency(row.avg3m) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 font-body text-xs text-we-paper/30 border-t border-white/[0.04]">
            MoM = variação % vs mês anterior. Exibe &quot;—&quot; quando o mês anterior teve R$ 0 (divisão impossível).
          </p>
        </div>
      )}
    </div>
  )
}
