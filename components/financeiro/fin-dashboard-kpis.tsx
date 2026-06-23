'use client'

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Repeat2,
  Users,
} from 'lucide-react'
import { FinScorecard } from '@/components/financeiro/fin-scorecard'
import type { DashboardScorecards } from '@/lib/financeiro/types'

type Props = {
  scorecards: DashboardScorecards
  monthResult: number
  periodLabel?: string
}

export function FinDashboardKpis({ scorecards, monthResult, periodLabel }: Props) {
  const resultColor = monthResult >= 0 ? '#45F47F' : '#F44545'
  const monthHint = periodLabel ? ` em ${periodLabel}` : ' neste mês'

  const kpis = [
    {
      label: 'Saldo atual',
      hint: periodLabel
        ? `Acumulado até o fim de ${periodLabel}`
        : 'Soma de receitas pagas – despesas pagas',
      icon: <Wallet size={14} style={{ color: '#4342F5' }} />,
      color: '#4342F5',
      scorecard: scorecards.saldo,
    },
    {
      label: 'Receita do mês',
      hint: `Receitas pagas${monthHint}`,
      icon: <TrendingUp size={14} style={{ color: '#45F47F' }} />,
      color: '#45F47F',
      scorecard: scorecards.receita,
    },
    {
      label: 'Despesa do mês',
      hint: `Pago${monthHint}`,
      icon: <TrendingDown size={14} style={{ color: '#F44545' }} />,
      color: '#F44545',
      scorecard: scorecards.despesa,
    },
    {
      label: 'Resultado do mês',
      hint: `Receita – Despesa${monthHint}`,
      icon: <BarChart3 size={14} style={{ color: resultColor }} />,
      color: resultColor,
      scorecard: scorecards.resultado,
    },
    {
      label: 'MRR',
      hint: `Receitas recorrentes recebidas${monthHint}`,
      icon: <Repeat2 size={14} style={{ color: '#7845F4' }} />,
      color: '#7845F4',
      scorecard: scorecards.mrr,
    },
    {
      label: 'Ticket médio',
      hint: `Receita ÷ clientes faturados${monthHint}`,
      icon: <Users size={14} style={{ color: '#D7FE65' }} />,
      color: '#D7FE65',
      scorecard: scorecards.ticket,
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {kpis.map(kpi => (
        <FinScorecard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}
