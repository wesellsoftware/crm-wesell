import Link from 'next/link'
import { AlertCircle, Clock, UserX, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { FinAlertsData, FinAlertItem, FinInadimplenteClient } from '@/lib/financeiro/types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function AllClear({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2">
      <CheckCircle2 size={18} className="text-emerald-400/60" />
      <p className="font-body text-xs text-we-paper/35 text-center">{label}</p>
    </div>
  )
}

function AlertItem({ item, href }: { item: FinAlertItem; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 py-1.5 group"
      >
        <div className="min-w-0">
          <p className="font-body text-xs text-we-paper/70 truncate group-hover:text-we-paper transition-colors">
            {item.description}
          </p>
          {item.client_name && (
            <p className="font-body text-xs text-we-paper/35 truncate">{item.client_name}</p>
          )}
          <p className="font-body text-xs text-we-paper/30">{formatDate(item.due_date)}</p>
        </div>
        <span className="font-mono text-xs shrink-0">{formatCurrency(item.amount)}</span>
      </Link>
    </li>
  )
}

function InadimplenteItem({ client, href }: { client: FinInadimplenteClient; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 py-1.5 group">
        <div className="min-w-0">
          <p className="font-body text-xs text-we-paper/70 truncate group-hover:text-we-paper transition-colors">
            {client.client_name}
          </p>
          <p className="font-body text-xs text-we-paper/30">
            {client.count} lançamento{client.count !== 1 ? 's' : ''} vencido{client.count !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="font-mono text-xs text-orange-400 shrink-0">
          {formatCurrency(client.total_overdue)}
        </span>
      </Link>
    </li>
  )
}

export function FinAlertsSection({ data }: { data: FinAlertsData }) {
  const { overdueReceivables, upcomingPayables, inadimplentes } = data

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* A receber vencidos */}
      <div className="glass rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <p className="font-body text-sm font-semibold text-we-paper/70">A receber vencidos</p>
          </div>
          {overdueReceivables.total > 0 && (
            <span className="text-xs font-mono text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
              {overdueReceivables.total}
            </span>
          )}
        </div>

        {overdueReceivables.total > 0 && (
          <p className="font-body text-xs text-we-paper/35">
            Total em aberto:{' '}
            <span className="text-red-400 font-mono">{formatCurrency(overdueReceivables.totalAmount)}</span>
          </p>
        )}

        <div className="flex-1">
          {overdueReceivables.items.length === 0 ? (
            <AllClear label="Nenhum recebimento vencido" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {overdueReceivables.items.map(item => (
                <AlertItem
                  key={item.id}
                  item={{ ...item, amount: item.amount }}
                  href="/financeiro/lancamentos?tab=receita&status=atrasado"
                />
              ))}
            </ul>
          )}
        </div>

        {overdueReceivables.total > 5 && (
          <Link
            href="/financeiro/lancamentos?tab=receita&status=atrasado"
            className="font-body text-xs text-we-paper/35 hover:text-we-paper/60 transition-colors"
          >
            Ver mais {overdueReceivables.total - 5} →
          </Link>
        )}
      </div>

      {/* A pagar próximos 14 dias */}
      <div className="glass rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <p className="font-body text-sm font-semibold text-we-paper/70">A pagar em 14 dias</p>
          </div>
          {upcomingPayables.total > 0 && (
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {upcomingPayables.total}
            </span>
          )}
        </div>

        {upcomingPayables.total > 0 && (
          <p className="font-body text-xs text-we-paper/35">
            Total previsto:{' '}
            <span className="text-amber-400 font-mono">{formatCurrency(upcomingPayables.totalAmount)}</span>
          </p>
        )}

        <div className="flex-1">
          {upcomingPayables.items.length === 0 ? (
            <AllClear label="Nenhum pagamento nos próximos 14 dias" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {upcomingPayables.items.map(item => (
                <AlertItem
                  key={item.id}
                  item={item}
                  href="/financeiro/lancamentos?tab=despesa&status=pendente"
                />
              ))}
            </ul>
          )}
        </div>

        {upcomingPayables.total > 5 && (
          <Link
            href="/financeiro/lancamentos?tab=despesa&status=pendente"
            className="font-body text-xs text-we-paper/35 hover:text-we-paper/60 transition-colors"
          >
            Ver mais {upcomingPayables.total - 5} →
          </Link>
        )}
      </div>

      {/* Clientes inadimplentes */}
      <div className="glass rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX size={13} className="text-orange-400 shrink-0" />
            <p className="font-body text-sm font-semibold text-we-paper/70">Clientes inadimplentes</p>
          </div>
          {inadimplentes.total > 0 && (
            <span className="text-xs font-mono text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">
              {inadimplentes.total}
            </span>
          )}
        </div>

        <div className="flex-1">
          {inadimplentes.clients.length === 0 ? (
            <AllClear label="Nenhum cliente inadimplente" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {inadimplentes.clients.map(client => (
                <InadimplenteItem
                  key={client.client_id}
                  client={client}
                  href="/financeiro/lancamentos?tab=receita&status=atrasado"
                />
              ))}
            </ul>
          )}
        </div>

        {inadimplentes.total > 5 && (
          <Link
            href="/financeiro/lancamentos?tab=receita&status=atrasado"
            className="font-body text-xs text-we-paper/35 hover:text-we-paper/60 transition-colors"
          >
            Ver mais {inadimplentes.total - 5} clientes →
          </Link>
        )}
      </div>
    </div>
  )
}
