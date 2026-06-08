import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ActivityToggle } from '@/components/atividades/activity-toggle'
import { NewActivityDialog } from '@/components/atividades/new-activity-dialog'
import { PageTitle } from '@/components/page-title'
import { Calendar, CheckCircle2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  call: 'Ligação', email: 'E-mail', meeting: 'Reunião', task: 'Tarefa', note: 'Nota',
}
const TYPE_COLORS: Record<string, string> = {
  call: '#4342F5', email: '#45F47F', meeting: '#D7FE65', task: '#7845F4', note: 'rgba(237,237,235,0.4)',
}

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string }>
}) {
  const { tipo, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select('id, type, title, description, due_at, completed_at, created_at, deal:deals(id, title), contact:contacts(id, name)')
    .order('due_at', { ascending: true, nullsFirst: false })

  if (tipo) query = query.eq('type', tipo)
  if (status === 'done') query = query.not('completed_at', 'is', null)
  if (status === 'pending') query = query.is('completed_at', null)

  const [
    { data: activities },
    { data: deals },
    { data: contacts },
  ] = await Promise.all([
    query,
    supabase.from('deals').select('id, title').eq('status', 'open').order('title'),
    supabase.from('contacts').select('id, name').order('name'),
  ])

  const pendingCount = (activities ?? []).filter(a => !a.completed_at).length

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Atividades</PageTitle>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <NewActivityDialog deals={deals ?? []} contacts={contacts ?? []} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Type filter */}
        {[{ value: '', label: 'Todos' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))].map(({ value, label }) => {
          const active = tipo === value || (!tipo && value === '')
          return (
            <Link
              key={value}
              href={`/atividades?${new URLSearchParams({ ...(value ? { tipo: value } : {}), ...(status ? { status } : {}) }).toString()}`}
              className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-we-blue/20 border-we-blue/40 text-we-blue'
                  : 'glass-input border-white/[0.10] text-we-paper/50 hover:text-we-paper/70'
              }`}
            >
              {label}
            </Link>
          )
        })}

        <div className="w-px h-6 bg-white/[0.08] self-center mx-1" />

        {[{ value: '', label: 'Todas' }, { value: 'pending', label: 'Pendentes' }, { value: 'done', label: 'Concluídas' }].map(({ value, label }) => {
          const active = status === value || (!status && value === '')
          return (
            <Link
              key={value}
              href={`/atividades?${new URLSearchParams({ ...(tipo ? { tipo } : {}), ...(value ? { status: value } : {}) }).toString()}`}
              className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-we-purple/20 border-we-purple/40 text-we-purple'
                  : 'glass-input border-white/[0.10] text-we-paper/50 hover:text-we-paper/70'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {!activities?.length ? (
        <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-white/[0.06] flex items-center justify-center">
            <CheckCircle2 size={20} className="text-we-paper/30" />
          </div>
          <p className="font-body text-we-paper/50">Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <div className="glass rounded-xl divide-y divide-white/[0.06]">
          {activities.map(act => {
            const deal = act.deal as unknown as { id: string; title: string } | null
            const contact = act.contact as unknown as { id: string; name: string } | null

            return (
              <div key={act.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <ActivityToggle id={act.id} completed={!!act.completed_at} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full mt-0.5"
                      style={{ background: `${TYPE_COLORS[act.type]}22`, color: TYPE_COLORS[act.type] }}
                    >
                      {TYPE_LABELS[act.type] ?? act.type}
                    </span>
                    <p className={`font-body text-sm ${act.completed_at ? 'text-we-paper/40 line-through' : 'text-we-paper/80'}`}>
                      {act.title}
                    </p>
                  </div>
                  {act.description && (
                    <p className="font-body text-xs text-we-paper/45 mt-0.5 truncate">{act.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {act.due_at && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-we-paper/35">
                        <Calendar size={10} />
                        {new Date(act.due_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {deal && (
                      <Link href={`/negocios/${deal.id}`} className="font-mono text-[10px] text-we-blue/70 hover:text-we-blue transition-colors truncate">
                        {deal.title}
                      </Link>
                    )}
                    {contact && (
                      <Link href={`/contatos/${contact.id}`} className="font-mono text-[10px] text-we-paper/35 hover:text-we-paper/60 transition-colors">
                        {contact.name}
                      </Link>
                    )}
                  </div>
                </div>

                {act.completed_at && (
                  <span className="font-mono text-[10px] text-we-green/50 shrink-0 mt-1">
                    {new Date(act.completed_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
