import { createClient } from '@/lib/supabase/server'
import { DealsByStageChart } from '@/components/dashboard/deals-by-stage-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, TrendingUp, Target, Activity } from 'lucide-react'

function activityTypeLabel(type: string) {
  const map: Record<string, string> = {
    call: 'Ligação', email: 'E-mail', meeting: 'Reunião', task: 'Tarefa', note: 'Nota',
  }
  return map[type] ?? type
}

function activityTypeColor(type: string) {
  const map: Record<string, string> = {
    call: '#4342F5', email: '#45F47F', meeting: '#D7FE65', task: '#7845F4', note: 'rgba(237,237,235,0.4)',
  }
  return map[type] ?? 'rgba(237,237,235,0.4)'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const in7days = new Date(today)
  in7days.setDate(today.getDate() + 7)
  const todayStr = today.toISOString().split('T')[0]
  const in7daysStr = in7days.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: openDeals },
    { data: wonMonth },
    { data: wonAll },
    { data: lostAll },
    { data: stages },
    { data: openDealStages },
    { data: recentActivities },
    { data: closingSoon },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user?.id ?? '').single(),
    supabase.from('deals').select('id, value').eq('status', 'open'),
    supabase.from('deals').select('id').eq('status', 'won').gte('updated_at', startOfMonth),
    supabase.from('deals').select('id').eq('status', 'won'),
    supabase.from('deals').select('id').eq('status', 'lost'),
    supabase.from('stages').select('id, name, color, position').order('position'),
    supabase.from('deals').select('stage_id, value').eq('status', 'open'),
    supabase.from('activities')
      .select('id, type, title, created_at, deal:deals(title)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('deals')
      .select('id, title, value, expected_close_date, contact:contacts(name)')
      .eq('status', 'open')
      .not('expected_close_date', 'is', null)
      .gte('expected_close_date', todayStr)
      .lte('expected_close_date', in7daysStr)
      .order('expected_close_date')
      .limit(8),
  ])

  const openCount = openDeals?.length ?? 0
  const pipelineValue = openDeals?.reduce((s, d) => s + Number(d.value), 0) ?? 0
  const wonMonthCount = wonMonth?.length ?? 0
  const totalClosed = (wonAll?.length ?? 0) + (lostAll?.length ?? 0)
  const conversionRate = totalClosed > 0 ? Math.round(((wonAll?.length ?? 0) / totalClosed) * 100) : 0

  const chartData = (stages ?? []).map(stage => {
    const deals = (openDealStages ?? []).filter(d => d.stage_id === stage.id)
    return {
      name: stage.name,
      count: deals.length,
      value: deals.reduce((s, d) => s + Number(d.value), 0),
      color: stage.color,
    }
  })

  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  const kpis = [
    { label: 'Negócios abertos', value: openCount.toString(), icon: Target, color: '#4342F5' },
    { label: 'Valor em pipeline', value: formatCurrency(pipelineValue), icon: TrendingUp, color: '#45F47F' },
    { label: 'Ganhos no mês', value: wonMonthCount.toString(), icon: Calendar, color: '#D7FE65' },
    { label: 'Taxa de conversão', value: `${conversionRate}%`, icon: Activity, color: '#7845F4' },
  ]

  return (
    <div className="p-8 space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-4xl text-we-paper">
          {greeting}, {firstName}.
        </h1>
        <p className="font-body text-we-paper/45 mt-1 text-sm">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}22` }}
              >
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="font-display text-3xl text-we-paper leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Negócios por etapa</p>
          <div className="flex-1 min-h-[200px]">
            <DealsByStageChart data={chartData} />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col gap-4">
          <p className="font-body text-sm font-semibold text-we-paper/70">Atividades recentes</p>
          {!recentActivities?.length ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-we-paper/25">Nenhuma atividade ainda</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((act) => {
                const deal = (act.deal as unknown) as { title: string } | null
                return (
                  <li key={act.id} className="flex items-start gap-3">
                    <span
                      className="mt-1 size-2 rounded-full shrink-0"
                      style={{ background: activityTypeColor(act.type) }}
                    />
                    <div className="min-w-0">
                      <p className="font-body text-sm text-we-paper/80 truncate">{act.title}</p>
                      <p className="font-mono text-[11px] text-we-paper/35">
                        {activityTypeLabel(act.type)}
                        {deal ? ` · ${deal.title}` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Closing soon */}
      <div className="glass rounded-xl p-6">
        <p className="font-body text-sm font-semibold text-we-paper/70 mb-4">
          Fechamento nos próximos 7 dias
        </p>
        {!closingSoon?.length ? (
          <div className="flex items-center justify-center py-6">
            <p className="font-mono text-xs text-we-paper/25">Nenhum negócio com fechamento próximo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="pb-3 text-left font-body text-xs text-we-paper/40 font-normal">Negócio</th>
                  <th className="pb-3 text-left font-body text-xs text-we-paper/40 font-normal">Contato</th>
                  <th className="pb-3 text-right font-body text-xs text-we-paper/40 font-normal">Valor</th>
                  <th className="pb-3 text-right font-body text-xs text-we-paper/40 font-normal">Fechamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {closingSoon.map((deal) => {
                  const contact = (deal.contact as unknown) as { name: string } | null
                  return (
                    <tr key={deal.id}>
                      <td className="py-3 font-body text-we-paper/80 truncate max-w-[200px]">{deal.title}</td>
                      <td className="py-3 font-body text-we-paper/50">{contact?.name ?? '—'}</td>
                      <td className="py-3 text-right font-mono text-xs text-we-paper/70">{formatCurrency(Number(deal.value))}</td>
                      <td className="py-3 text-right font-mono text-xs text-we-lime">{deal.expected_close_date ? formatDate(deal.expected_close_date) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
