import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, User, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DealStatusActions } from '@/components/negocios/deal-status-actions'

export default async function NegocioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: deal },
    { data: activities },
    { data: stages },
  ] = await Promise.all([
    supabase.from('deals')
      .select('*, stage:stages(id, name, color), contact:contacts(id, name, email, phone)')
      .eq('id', id)
      .single(),
    supabase.from('activities')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('stages').select('id, name, color').order('position'),
  ])

  if (!deal) notFound()

  const stage = deal.stage as unknown as { id: string; name: string; color: string } | null
  const contact = deal.contact as unknown as { id: string; name: string; email: string | null; phone: string | null } | null

  const statusBadge: Record<string, { label: string; cls: string }> = {
    open:  { label: 'Aberto',  cls: 'text-we-blue  bg-we-blue/15' },
    won:   { label: 'Ganho',   cls: 'text-we-green bg-we-green/15' },
    lost:  { label: 'Perdido', cls: 'text-we-red   bg-we-red/15' },
  }
  const badge = statusBadge[deal.status] ?? statusBadge.open

  const activityIcon: Record<string, string> = {
    call: '📞', email: '✉️', meeting: '🤝', task: '✅', note: '📝',
  }

  return (
    <div className="p-8 space-y-7 max-w-4xl">
      {/* Back */}
      <Link href="/funil" className="inline-flex items-center gap-1.5 font-body text-sm text-we-paper/45 hover:text-we-paper/70 transition-colors">
        <ArrowLeft size={14} />
        Funil
      </Link>

      {/* Header card */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-we-paper leading-tight">{deal.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`font-mono text-xs px-2.5 py-1 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
              {stage && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: stage.color }} />
                  <span className="font-body text-sm text-we-paper/55">{stage.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-3xl text-we-lime">{formatCurrency(Number(deal.value))}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.07]">
          {contact && (
            <div>
              <p className="font-mono text-[10px] text-we-paper/35 uppercase tracking-wide">Contato</p>
              <Link href={`/contatos/${contact.id}`} className="flex items-center gap-1.5 mt-1 group">
                <User size={12} className="text-we-paper/40" />
                <span className="font-body text-sm text-we-paper/70 group-hover:text-we-blue transition-colors">{contact.name}</span>
              </Link>
            </div>
          )}
          {deal.expected_close_date && (
            <div>
              <p className="font-mono text-[10px] text-we-paper/35 uppercase tracking-wide">Fechamento</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar size={12} className="text-we-paper/40" />
                <span className="font-body text-sm text-we-paper/70">{formatDate(deal.expected_close_date)}</span>
              </div>
            </div>
          )}
          <div>
            <p className="font-mono text-[10px] text-we-paper/35 uppercase tracking-wide">Criado em</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar size={12} className="text-we-paper/40" />
              <span className="font-body text-sm text-we-paper/70">
                {new Date(deal.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Status actions */}
        {deal.status === 'open' && <DealStatusActions dealId={deal.id} />}
      </div>

      {deal.notes && (
        <div className="glass rounded-xl p-5">
          <p className="font-body text-xs text-we-paper/40 uppercase tracking-wide mb-2">Notas</p>
          <p className="font-body text-sm text-we-paper/70 leading-relaxed whitespace-pre-wrap">{deal.notes}</p>
        </div>
      )}

      {/* Activity timeline */}
      <div className="glass rounded-xl p-5 space-y-4">
        <p className="font-body text-sm font-semibold text-we-paper/70">
          Histórico <span className="font-mono text-xs text-we-paper/35 font-normal ml-1">({activities?.length ?? 0})</span>
        </p>

        {!activities?.length ? (
          <p className="font-body text-xs text-we-paper/30 py-6 text-center">Nenhuma atividade registrada neste negócio</p>
        ) : (
          <div className="space-y-1">
            {activities.map((act, i) => (
              <div key={act.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <span className="text-base leading-none mt-0.5">{activityIcon[act.type] ?? '·'}</span>
                  {i < (activities.length - 1) && (
                    <div className="w-px flex-1 bg-white/[0.06] mt-1 mb-1 min-h-[16px]" />
                  )}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-body text-sm ${act.completed_at ? 'text-we-paper/40 line-through' : 'text-we-paper/80'}`}>
                      {act.title}
                    </p>
                    <span className="font-mono text-[10px] text-we-paper/30 shrink-0 mt-0.5">
                      {new Date(act.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {act.description && (
                    <p className="font-body text-xs text-we-paper/45 mt-0.5">{act.description}</p>
                  )}
                  {act.completed_at && (
                    <p className="font-mono text-[10px] text-we-green/60 mt-1">
                      Concluída em {new Date(act.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
