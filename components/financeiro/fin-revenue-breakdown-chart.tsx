'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

type Props = {
  recorrente: number
  pontual: number
}

export function FinRevenueBreakdownChart({ recorrente, pontual }: Props) {
  const total = recorrente + pontual
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-sm text-we-paper/25">Sem receitas no mês</p>
      </div>
    )
  }

  const data = [
    { name: 'Recorrente', value: recorrente, color: '#4342F5' },
    { name: 'Pontual', value: pontual, color: '#D7FE65' },
  ].filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={40}
          outerRadius={64}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry) => (
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
          formatter={(v) => [formatCurrency(Number(v))]}
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
