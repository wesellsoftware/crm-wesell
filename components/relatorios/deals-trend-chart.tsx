'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

export type MonthlyData = {
  month: string
  won: number
  lost: number
  value: number
}

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

export function DealsTrendChart({ data }: { data: MonthlyData[] }) {
  if (!data.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: CHART_FONT_SIZE, color: 'rgba(237,237,235,0.45)' }} />
        <Bar dataKey="won" name="Ganhos" fill="#45F47F" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        <Bar dataKey="lost" name="Perdidos" fill="#F44545" fillOpacity={0.60} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export type StageValueData = { name: string; value: number; count: number; color: string }

export function PipelineValueChart({ data }: { data: StageValueData[] }) {
  if (!data.some(d => d.value > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" {...axisProps}
          tickFormatter={v => new Intl.NumberFormat('pt-BR', { notation: 'compact', currency: 'BRL' }).format(v)}
        />
        <YAxis type="category" dataKey="name" {...axisProps} width={120} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v) => [
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0)),
            'Valor',
          ] as [string, string]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <rect key={i} fill={entry.color} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <p className="font-mono text-base text-we-paper/25">Sem dados suficientes</p>
    </div>
  )
}
