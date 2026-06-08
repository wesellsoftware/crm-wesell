import { formatCurrency } from '@/lib/utils'
import type { NegociacoesAnalytics } from '@/lib/boards/analytics'

export function NegociacoesKpis({ analytics }: { analytics: NegociacoesAnalytics }) {
  const cards = [
    {
      label: 'Ticket médio',
      value: analytics.wonCount > 0 ? formatCurrency(analytics.avgTicket) : '—',
      hint: analytics.wonCount > 0 ? `${analytics.wonCount} negócio${analytics.wonCount !== 1 ? 's' : ''} ganho${analytics.wonCount !== 1 ? 's' : ''}` : 'Sem ganhos fechados',
    },
    {
      label: 'Média receita/mês',
      value: analytics.wonCount > 0 ? formatCurrency(analytics.avgMonthlyRevenue) : '—',
      hint: 'Média das receitas mensais dos ganhos',
    },
    {
      label: 'Ciclo de vendas médio',
      value: analytics.wonCount > 0 ? `${analytics.avgSalesCycleDays} dias` : '—',
      hint: 'Da criação até Fechado/Ganho',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, hint }) => (
        <div key={label} className="glass rounded-xl p-5 space-y-1">
          <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
          <p className="font-display text-3xl text-we-paper">{value}</p>
          <p className="font-body text-xs text-we-paper/35">{hint}</p>
        </div>
      ))}
    </div>
  )
}
