'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { DreCategoryBreakdown } from '@/lib/financeiro/types'

const CATEGORY_COLORS = [
  '#4342F5',
  '#D7FE65',
  '#45F47F',
  '#7845F4',
  '#45D4F4',
  '#F4A545',
  '#F44545',
]

type Props = {
  data: DreCategoryBreakdown[]
}

export function FinRevenueByCategoryChart({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.amount, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-sm text-we-paper/25">Sem receitas no mês</p>
      </div>
    )
  }

  const chartData = data
    .filter(d => d.amount > 0)
    .map((d, i) => ({
      name: d.category_name,
      value: d.amount,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={40}
          outerRadius={64}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map(entry => (
            <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(26,22,38,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'inherit',
          }}
          labelStyle={{ color: '#EDEDEB' }}
          formatter={v => [formatCurrency(Number(v))]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: 'rgba(237,237,235,0.55)', fontFamily: 'inherit' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
