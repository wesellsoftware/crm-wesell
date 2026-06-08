import { createClient } from '@/lib/supabase/server'
import { DealsTrendChart, PipelineValueChart } from '@/components/relatorios/deals-trend-chart'
import { formatCurrency } from '@/lib/utils'

function last6Months(): { key: string; label: string }[] {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    })
  }
  return months
}

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const months = last6Months()
  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [
    { data: closedDeals },
    { data: stages },
    { data: openDeals },
  ] = await Promise.all([
    supabase.from('deals')
      .select('id, status, value, updated_at')
      .in('status', ['won', 'lost'])
      .gte('updated_at', since.toISOString()),
    supabase.from('stages').select('id, name, color').order('position'),
    supabase.from('deals')
      .select('stage_id, value')
      .eq('status', 'open'),
  ])

  // Build monthly trend
  const trend = months.map(({ key, label }) => {
    const monthDeals = (closedDeals ?? []).filter(d => {
      const month = new Date(d.updated_at).toISOString().slice(0, 7)
      return month === key
    })
    return {
      month: label,
      won: monthDeals.filter(d => d.status === 'won').length,
      lost: monthDeals.filter(d => d.status === 'lost').length,
      value: monthDeals.filter(d => d.status === 'won').reduce((s, d) => s + Number(d.value), 0),
    }
  })

  // Pipeline by stage
  const pipelineByStage = (stages ?? []).map(stage => {
    const deals = (openDeals ?? []).filter(d => d.stage_id === stage.id)
    return {
      name: stage.name,
      value: deals.reduce((s, d) => s + Number(d.value), 0),
      count: deals.length,
      color: stage.color,
    }
  })

  // Summary KPIs
  const totalWon = (closedDeals ?? []).filter(d => d.status === 'won')
  const totalLost = (closedDeals ?? []).filter(d => d.status === 'lost')
  const wonValue = totalWon.reduce((s, d) => s + Number(d.value), 0)
  const convRate = totalWon.length + totalLost.length > 0
    ? Math.round((totalWon.length / (totalWon.length + totalLost.length)) * 100)
    : 0
  const avgDeal = totalWon.length > 0 ? wonValue / totalWon.length : 0

  return (
    <div className="p-8 space-y-7">
      <div>
        <h1 className="font-display text-3xl text-we-paper">Relatórios</h1>
        <p className="font-body text-we-paper/45 text-sm mt-0.5">Últimos 6 meses</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Negócios ganhos', value: totalWon.length.toString() },
          { label: 'Receita fechada', value: formatCurrency(wonValue) },
          { label: 'Taxa de conversão', value: `${convRate}%` },
          { label: 'Ticket médio', value: formatCurrency(avgDeal) },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-5 space-y-1">
            <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
            <p className="font-display text-3xl text-we-paper">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Negócios ganhos/perdidos por mês</p>
          <div className="flex-1 min-h-[200px]">
            <DealsTrendChart data={trend} />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Valor em pipeline por etapa</p>
          <div className="flex-1 min-h-[200px]">
            <PipelineValueChart data={pipelineByStage} />
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="glass rounded-xl p-6">
        <p className="font-body text-sm font-semibold text-we-paper/70 mb-4">Detalhe mensal</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Mês', 'Ganhos', 'Perdidos', 'Taxa', 'Receita'].map(h => (
                  <th key={h} className="pb-3 text-left font-body text-xs text-we-paper/40 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {trend.map(row => {
                const total = row.won + row.lost
                const rate = total > 0 ? Math.round((row.won / total) * 100) : 0
                return (
                  <tr key={row.month}>
                    <td className="py-3 font-mono text-xs text-we-paper/60">{row.month}</td>
                    <td className="py-3 font-mono text-xs text-we-green">{row.won}</td>
                    <td className="py-3 font-mono text-xs text-we-red">{row.lost}</td>
                    <td className="py-3 font-mono text-xs text-we-paper/60">{total > 0 ? `${rate}%` : '—'}</td>
                    <td className="py-3 font-mono text-xs text-we-lime">{row.value > 0 ? formatCurrency(row.value) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
