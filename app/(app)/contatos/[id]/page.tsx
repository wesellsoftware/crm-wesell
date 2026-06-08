import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function ContatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: contact },
    { data: deals },
    { data: activities },
  ] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', id).single(),
    supabase.from('deals')
      .select('id, title, value, status, expected_close_date, stage:stages(name, color)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('activities')
      .select('id, type, title, description, due_at, completed_at, created_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!contact) notFound()

  const statusLabel: Record<string, string> = { open: 'Aberto', won: 'Ganho', lost: 'Perdido' }
  const statusColor: Record<string, string> = {
    open: 'text-we-blue bg-we-blue/15',
    won: 'text-we-green bg-we-green/15',
    lost: 'text-we-red bg-we-red/15',
  }
  const activityIcon: Record<string, string> = {
    call: '📞', email: '✉️', meeting: '🤝', task: '✅', note: '📝',
  }

  return (
    <div className="p-8 space-y-7 max-w-4xl">
      {/* Back */}
      <Link href="/contatos" className="inline-flex items-center gap-1.5 font-body text-sm text-we-paper/45 hover:text-we-paper/70 transition-colors">
        <ArrowLeft size={14} />
        Contatos
      </Link>

      {/* Header */}
      <div className="glass rounded-xl p-6 flex items-start gap-5">
        <div className="size-16 rounded-full bg-we-blue/20 flex items-center justify-center shrink-0">
          <span className="font-display text-3xl text-we-blue">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl text-we-paper">{contact.name}</h1>
          {contact.company && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 size={13} className="text-we-paper/40" />
              <span className="font-body text-sm text-we-paper/55">{contact.company}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-3">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 font-mono text-xs text-we-paper/50 hover:text-we-blue transition-colors">
                <Mail size={12} /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 font-mono text-xs text-we-paper/50 hover:text-we-blue transition-colors">
                <Phone size={12} /> {contact.phone}
              </a>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-[11px] text-we-paper/30">Cadastrado em</p>
          <p className="font-mono text-xs text-we-paper/50 mt-0.5">
            {new Date(contact.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {contact.notes && (
        <div className="glass rounded-xl p-5">
          <p className="font-body text-xs text-we-paper/40 uppercase tracking-wide mb-2">Notas</p>
          <p className="font-body text-sm text-we-paper/70 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Deals */}
        <div className="glass rounded-xl p-5 space-y-4">
          <p className="font-body text-sm font-semibold text-we-paper/70">
            Negócios <span className="font-mono text-xs text-we-paper/35 font-normal ml-1">({deals?.length ?? 0})</span>
          </p>
          {!deals?.length ? (
            <p className="font-body text-xs text-we-paper/30 py-4 text-center">Nenhum negócio vinculado</p>
          ) : (
            <div className="space-y-2">
              {deals.map(deal => {
                const stage = deal.stage as unknown as { name: string; color: string } | null
                return (
                  <Link key={deal.id} href={`/negocios/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.07] transition-colors">
                    <div className="min-w-0">
                      <p className="font-body text-sm text-we-paper/80 truncate">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {stage && <span className="size-1.5 rounded-full" style={{ background: stage.color }} />}
                        <span className="font-mono text-[11px] text-we-paper/40">{stage?.name ?? '—'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono text-xs text-we-lime">{formatCurrency(Number(deal.value))}</p>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${statusColor[deal.status] ?? ''}`}>
                        {statusLabel[deal.status] ?? deal.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Activities */}
        <div className="glass rounded-xl p-5 space-y-4">
          <p className="font-body text-sm font-semibold text-we-paper/70">
            Atividades <span className="font-mono text-xs text-we-paper/35 font-normal ml-1">({activities?.length ?? 0})</span>
          </p>
          {!activities?.length ? (
            <p className="font-body text-xs text-we-paper/30 py-4 text-center">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-2">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-[8px] bg-white/[0.04]">
                  <span className="text-sm leading-none mt-0.5 shrink-0">{activityIcon[act.type] ?? '·'}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-body text-sm truncate ${act.completed_at ? 'text-we-paper/40 line-through' : 'text-we-paper/80'}`}>
                      {act.title}
                    </p>
                    {act.description && (
                      <p className="font-body text-xs text-we-paper/40 truncate mt-0.5">{act.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {act.due_at && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-we-paper/35">
                          <Calendar size={10} />
                          {new Date(act.due_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {act.completed_at && (
                        <span className="font-mono text-[10px] text-we-green/60">Concluída</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
