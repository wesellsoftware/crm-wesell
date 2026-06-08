import { getDashboardBoardStats } from '@/lib/boards/queries'
import { DealsTrendChart, PipelineValueChart } from '@/components/relatorios/deals-trend-chart'
import { formatCurrency } from '@/lib/utils'

export default async function RelatoriosPage() {
  const boardStats = await getDashboardBoardStats()

  const pipelineByStage = (boardStats?.chartData ?? []).map(s => ({
    name: s.name,
    value: s.value,
    count: s.count,
    color: s.color,
  }))

  const openCount = boardStats?.openCount ?? 0
  const pipelineValue = boardStats?.pipelineValue ?? 0
  const wonCount = boardStats?.wonCount ?? 0
  const conversionRate = boardStats?.conversionRate ?? 0
  const avgDeal = wonCount > 0 ? pipelineValue / Math.max(openCount, 1) : 0

  const trend = [{
    month: 'Atual',
    won: wonCount,
    lost: 0,
    value: pipelineValue,
  }]

  return (
    <div className="p-8 space-y-7">
      <div>
        <h1 className="font-display text-3xl text-we-paper">Relatórios</h1>
        <p className="font-body text-we-paper/45 text-sm mt-0.5">Painel de negociações</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Oportunidades ativas', value: openCount.toString() },
          { label: 'Valor em pipeline', value: formatCurrency(pipelineValue) },
          { label: 'Fechados/Ganhos', value: wonCount.toString() },
          { label: 'Taxa de conversão', value: `${conversionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-5 space-y-1">
            <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
            <p className="font-display text-3xl text-we-paper">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Resumo de negociações</p>
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

      <div className="glass rounded-xl p-6">
        <p className="font-body text-sm font-semibold text-we-paper/70 mb-4">Detalhe por etapa</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Etapa', 'Quantidade', 'Valor'].map(h => (
                  <th key={h} className="pb-3 text-left font-body text-xs text-we-paper/40 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {pipelineByStage.map(row => (
                <tr key={row.name}>
                  <td className="py-3 font-body text-we-paper/70">{row.name}</td>
                  <td className="py-3 font-mono text-xs text-we-paper/60">{row.count}</td>
                  <td className="py-3 font-mono text-xs text-we-lime">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
