'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { CashProjectionPoint } from '@/lib/financeiro/types'

const FONT_SIZE = 11

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: 'rgba(237,237,235,0.35)', fontSize: FONT_SIZE, fontFamily: 'inherit' },
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

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; name: string; payload: CashProjectionPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  const projected = point.isProjected

  return (
    <div
      style={{
        background: 'rgba(26,22,38,0.95)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'inherit',
      }}
    >
      <p style={{ color: '#EDEDEB', marginBottom: 4 }}>
        {label}
        {projected && (
          <span style={{ color: 'rgba(237,237,235,0.45)', marginLeft: 6 }}>(projetado)</span>
        )}
      </p>
      {payload.map(entry => (
        <p key={entry.dataKey} style={{ color: 'rgba(237,237,235,0.70)', margin: '2px 0' }}>
          {entry.name}: {fmt(Number(entry.value))}
        </p>
      ))}
    </div>
  )
}

export function FinCashProjectionChart({ data }: { data: CashProjectionPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-sm text-we-paper/25">Sem dados suficientes</p>
      </div>
    )
  }

  const currentLabel = data.find(d => d.isProjected)?.label

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval={0} angle={-45} textAnchor="end" height={50} />
        <YAxis {...axisProps} tickFormatter={fmt} width={56} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'inherit', color: 'rgba(237,237,235,0.50)' }}
          formatter={name => (name === 'ganhos' ? 'Ganhos' : 'Despesas')}
        />
        {currentLabel && (
          <ReferenceLine
            x={currentLabel}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="4 3"
          />
        )}
        <Line
          type="monotone"
          dataKey="ganhos"
          name="ganhos"
          stroke="#45F47F"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="despesas"
          name="despesas"
          stroke="#F44545"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
