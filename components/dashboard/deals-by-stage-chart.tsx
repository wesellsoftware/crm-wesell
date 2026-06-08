'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const breeSerif = "'Bree Serif', Georgia, serif"
const CHART_FONT_SIZE = 16

export type StageChartData = {
  name: string
  count: number
  value: number
  color: string
}

export function DealsByStageChart({ data }: { data: StageChartData[] }) {
  const hasData = data.some(d => d.count > 0)

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-base text-we-paper/25">Nenhum negócio aberto ainda</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(237,237,235,0.45)', fontSize: CHART_FONT_SIZE, fontFamily: breeSerif }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgba(237,237,235,0.35)', fontSize: CHART_FONT_SIZE, fontFamily: breeSerif }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: 'rgba(26,22,38,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 8,
            fontSize: CHART_FONT_SIZE,
            fontFamily: breeSerif,
          }}
          labelStyle={{ color: '#EDEDEB', marginBottom: 4, fontSize: CHART_FONT_SIZE }}
          itemStyle={{ color: 'rgba(237,237,235,0.70)', fontSize: CHART_FONT_SIZE }}
          formatter={(val, name) => {
            const n = Number(val)
            if (name === 'count') return [`${n} negócio${n !== 1 ? 's' : ''}`, ''] as [string, string]
            return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n), ''] as [string, string]
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.80} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
