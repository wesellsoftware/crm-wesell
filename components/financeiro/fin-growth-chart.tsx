'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { GrowthPoint } from '@/lib/financeiro/types'

const CHART_HEIGHT = 260

function fmtCompact(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)
}

function fmtMonth(period: string) {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: 'rgba(237,237,235,0.35)', fontSize: 11, fontFamily: 'inherit' },
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(26,22,38,0.95)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'inherit',
  },
  labelStyle: { color: '#EDEDEB', marginBottom: 4 },
  itemStyle: { color: 'rgba(237,237,235,0.70)' },
}

type ChartRow = {
  label: string
  faturamento: number
  avg3m: number | undefined
}

export function FinGrowthChart({ data }: { data: GrowthPoint[] }) {
  const hasRevenue = data.some(d => d.faturamento > 0)

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <p className="font-body text-sm text-we-paper/25">Sem dados suficientes</p>
      </div>
    )
  }

  const chartData: ChartRow[] = data.map(d => ({
    label: fmtMonth(d.period),
    faturamento: d.faturamento,
    avg3m: d.avg3m != null ? d.avg3m : undefined,
  }))

  return (
    <div style={{ height: CHART_HEIGHT }}>
      {!hasRevenue && (
        <p className="font-body text-xs text-we-paper/30 mb-2">
          Nenhum faturamento registrado na janela selecionada.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval={0} angle={-35} textAnchor="end" height={52} />
          <YAxis {...axisProps} tickFormatter={fmtCompact} width={60} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: unknown, name: unknown) => [
              fmtCompact(Number(v)),
              name === 'avg3m' ? 'Média 3m' : 'Faturamento',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'inherit', color: 'rgba(237,237,235,0.50)' }}
            formatter={name => (name === 'avg3m' ? 'Média 3m' : 'Faturamento')}
          />
          <Bar
            dataKey="faturamento"
            name="faturamento"
            fill="#4342F5"
            fillOpacity={0.6}
            radius={4}
            maxBarSize={40}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="avg3m"
            name="avg3m"
            stroke="#D7FE65"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
