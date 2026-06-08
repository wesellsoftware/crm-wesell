'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { NegociacoesAnalytics } from '@/lib/boards/analytics'

const CHART_FONT_SIZE = 16

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(26,22,38,0.95)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    fontSize: CHART_FONT_SIZE,
    fontFamily: 'inherit',
  },
  labelStyle: { color: '#EDEDEB', marginBottom: 4, fontSize: CHART_FONT_SIZE },
  itemStyle: { color: 'rgba(237,237,235,0.70)', fontSize: CHART_FONT_SIZE },
}

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: 'rgba(237,237,235,0.35)', fontSize: CHART_FONT_SIZE, fontFamily: 'inherit' },
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function RevenueByProductChart({
  data,
}: {
  data: NegociacoesAnalytics['revenueByProduct']
}) {
  const chartData = useMemo(
    () => [...data].sort((a, b) => b.revenue - a.revenue).reverse(),
    [data]
  )

  const chartHeight = Math.max(240, chartData.length * 60)
  const labelWidth = Math.max(
    100,
    ...chartData.map(row => row.product.length * 9)
  )

  if (!data.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="font-mono text-base text-we-paper/25">Sem receita por produto</p>
      </div>
    )
  }

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 96, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            {...axisProps}
            domain={[0, (max: number) => Math.ceil(max * 1.08)]}
            tickFormatter={v => formatCompactCurrency(Number(v))}
          />
          <YAxis
            type="category"
            dataKey="product"
            {...axisProps}
            width={labelWidth}
            tick={{ ...axisProps.tick, fill: 'rgba(237,237,235,0.55)' }}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={v => [formatCurrency(Number(v ?? 0)), 'Receita'] as [string, string]}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={28}>
            <LabelList
              dataKey="revenue"
              position="right"
              formatter={v => formatCurrency(Number(v ?? 0))}
              fill="rgba(237,237,235,0.55)"
              fontSize={CHART_FONT_SIZE}
            />
            {chartData.map(entry => (
              <Cell key={entry.product} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RevenueByProductTable({
  data,
}: {
  data: NegociacoesAnalytics['revenueByProduct']
}) {
  if (!data.length) return null

  const sorted = [...data].sort((a, b) => b.revenue - a.revenue)
  const total = sorted.reduce((sum, row) => sum + row.revenue, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {['Produto', 'Receita', '% do total'].map(h => (
              <th key={h} className="pb-3 text-left font-body text-base text-we-paper/40 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {sorted.map(row => (
            <tr key={row.product}>
              <td className="py-3 font-body text-base text-we-paper/70">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: row.color }}
                  />
                  {row.product}
                </span>
              </td>
              <td className="py-3 font-mono text-base text-we-lime">{formatCurrency(row.revenue)}</td>
              <td className="py-3 font-mono text-base text-we-paper/60">
                {total > 0 ? `${Math.round((row.revenue / total) * 100)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
