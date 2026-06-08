import { createClient } from '@/lib/supabase/server'
import { getDashboardBoardStats } from '@/lib/boards/queries'
import { DealsByStageChart } from '@/components/dashboard/deals-by-stage-chart'
import { formatCurrency } from '@/lib/utils'
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

  const boardStats = await getDashboardBoardStats()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id ?? '')
    .single()

  const { data: recentActivities } = await supabase
    .from('activities')
    .select('id, type, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const today = new Date()
  const openCount = boardStats?.openCount ?? 0
  const pipelineValue = boardStats?.pipelineValue ?? 0
  const wonCount = boardStats?.wonCount ?? 0
  const conversionRate = boardStats?.conversionRate ?? 0
  const chartData = boardStats?.chartData ?? []

  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  const kpis = [
    { label: 'Oportunidades ativas', value: openCount.toString(), icon: Target, color: '#4342F5' },
    { label: 'Valor em pipeline', value: formatCurrency(pipelineValue), icon: TrendingUp, color: '#45F47F' },
    { label: 'Fechados/Ganhos', value: wonCount.toString(), icon: Calendar, color: '#D7FE65' },
    { label: 'Taxa de conversão', value: `${conversionRate}%`, icon: Activity, color: '#7845F4' },
  ]

  return (
    <div className="p-8 space-y-7">
      <div>
        <h1 className="font-display text-4xl text-we-paper">
          {greeting}, {firstName}.
        </h1>
        <p className="font-body text-we-paper/45 mt-1 text-sm">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

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
            <p className="font-body text-3xl text-we-paper leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-6 flex flex-col gap-3 min-h-[280px]">
          <p className="font-body text-sm font-semibold text-we-paper/70">Negociações por etapa</p>
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
              {recentActivities.map((act) => (
                <li key={act.id} className="flex items-start gap-3">
                  <span
                    className="mt-1 size-2 rounded-full shrink-0"
                    style={{ background: activityTypeColor(act.type) }}
                  />
                  <div className="min-w-0">
                    <p className="font-body text-sm text-we-paper/80 truncate">{act.title}</p>
                    <p className="font-mono text-[11px] text-we-paper/35">
                      {activityTypeLabel(act.type)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
