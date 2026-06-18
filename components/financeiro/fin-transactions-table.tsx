'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Circle, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FinTransactionDrawer } from './fin-transaction-drawer'
import { finInputCls, finSelectCls } from './fin-input-styles'
import {
  markTransactionPaid,
  markTransactionUnpaid,
  deleteTransaction,
} from '@/app/actions/financeiro'
import type {
  FinCategory,
  FinNature,
  FinTransaction,
  FinTransactionRow,
  FinTransactionType,
  SelectOption,
} from '@/lib/financeiro/types'
import { getTransactionEffectiveAmount } from '@/lib/financeiro/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = {
  rows: FinTransactionRow[]
  type: FinTransactionType
  categories: FinCategory[]
  banks: SelectOption[]
  clients: SelectOption[]
  projects: SelectOption[]
  initialStatus?: 'pendente' | 'atrasado' | 'pago'
}

function statusOf(t: FinTransactionRow): 'pago' | 'atrasado' | 'pendente' {
  if (t.paid_date) return 'pago'
  const today = new Date().toISOString().split('T')[0]
  if (t.due_date < today) return 'atrasado'
  return 'pendente'
}

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  atrasado: 'Atrasado',
  pendente: 'Pendente',
}

const STATUS_COLOR: Record<string, string> = {
  pago: 'text-emerald-400',
  atrasado: 'text-red-400',
  pendente: 'text-we-paper/50',
}

const NATURE_LABEL: Record<FinNature, string> = {
  recorrente: 'Recorrente',
  pontual: 'Pontual',
  parcelado: 'Parcelado',
}

const NATURE_COLOR: Record<FinNature, string> = {
  recorrente: 'text-violet-300',
  pontual: 'text-we-paper/55',
  parcelado: 'text-sky-300',
}

function natureLabel(t: FinTransactionRow): string {
  if (t.nature === 'parcelado' && t.installment_number && t.installment_count) {
    return `Parcelado (${t.installment_number}/${t.installment_count})`
  }
  return NATURE_LABEL[t.nature]
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function buildPeriodOptions() {
  const now = new Date()
  const opts = [{ value: 'todos', label: 'Todos os períodos' }]
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    opts.push({ value, label })
  }
  return opts
}

const periodOptions = buildPeriodOptions()

export function FinTransactionsTable({ rows, type, categories, banks, clients, projects, initialStatus }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? 'todos')
  const [natureFilter, setNatureFilter] = useState<string>('todos')
  const [periodFilter, setPeriodFilter] = useState<string>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FinTransaction | undefined>()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const filteredCategories = categories.filter(c => c.type === type)

  const filtered = rows.filter(t => {
    const s = statusOf(t)
    if (statusFilter !== 'todos' && s !== statusFilter) return false
    if (natureFilter !== 'todos' && t.nature !== natureFilter) return false
    if (periodFilter !== 'todos') {
      const [y, m] = periodFilter.split('-')
      const prefix = `${y}-${m}`
      if (!t.due_date.startsWith(prefix)) return false
    }
    if (categoryFilter !== 'todos' && t.category_id !== categoryFilter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleEdit(t: FinTransactionRow) {
    setEditTarget(t)
    setDrawerOpen(true)
  }

  function handleNew() {
    setEditTarget(undefined)
    setDrawerOpen(true)
  }

  function handleTogglePaid(t: FinTransactionRow) {
    startTransition(async () => {
      if (t.paid_date) {
        await markTransactionUnpaid(t.id)
      } else {
        await markTransactionPaid(t.id, today)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    startTransition(async () => {
      await deleteTransaction(id)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters + New button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-we-paper/50 pointer-events-none" />
          <Input
            placeholder="Buscar descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn('pl-8 h-8', finInputCls)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={v => setStatusFilter(v ?? 'todos')}
          items={[
            { value: 'todos', label: 'Todos' },
            { value: 'pendente', label: 'Pendente' },
            { value: 'atrasado', label: 'Atrasado' },
            { value: 'pago', label: 'Pago' },
          ]}
        >
          <SelectTrigger className={cn('h-8 w-[140px]', finSelectCls)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={natureFilter}
          onValueChange={v => setNatureFilter(v ?? 'todos')}
          items={[
            { value: 'todos', label: 'Todos os tipos' },
            { value: 'recorrente', label: NATURE_LABEL.recorrente },
            { value: 'pontual', label: NATURE_LABEL.pontual },
            { value: 'parcelado', label: NATURE_LABEL.parcelado },
          ]}
        >
          <SelectTrigger className={cn('h-8 w-[150px]', finSelectCls)}>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="recorrente">{NATURE_LABEL.recorrente}</SelectItem>
            <SelectItem value="pontual">{NATURE_LABEL.pontual}</SelectItem>
            <SelectItem value="parcelado">{NATURE_LABEL.parcelado}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={periodFilter}
          onValueChange={v => setPeriodFilter(v ?? 'todos')}
          items={periodOptions.map(o => ({ value: o.value, label: o.label }))}
        >
          <SelectTrigger className={cn('h-8 w-[180px]', finSelectCls)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={v => setCategoryFilter(v ?? 'todos')}
          items={[
            { value: 'todos', label: 'Todas as categorias' },
            ...filteredCategories.map(c => ({ value: c.id, label: c.name })),
          ]}
        >
          <SelectTrigger className={cn('h-8 w-[160px]', finSelectCls)}>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {filteredCategories.map(c => (
              <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleNew} className="ml-auto h-8">
          + {type === 'receita' ? 'Nova receita' : 'Nova despesa'}
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-body text-sm text-we-paper/30">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="py-3 pl-4 pr-4 text-left font-body text-xs text-we-paper/40 font-normal w-8" />
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal">Descrição</th>
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal">Recorrência</th>
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal hidden md:table-cell">Categoria</th>
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal hidden lg:table-cell">Cliente</th>
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal">Vencimento</th>
                <th className="py-3 text-left font-body text-xs text-we-paper/40 font-normal">Status</th>
                <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal">Valor</th>
                <th className="py-3 pr-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map(t => {
                const s = statusOf(t)
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-4 pr-4 align-middle">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(t)}
                        disabled={isPending}
                        className="flex items-center text-we-paper/40 hover:text-emerald-400 transition-colors"
                        title={t.paid_date ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        {t.paid_date
                          ? <CheckCircle2 size={16} className="text-emerald-400" />
                          : <Circle size={16} />
                        }
                      </button>
                    </td>
                    <td className="py-3 align-middle">
                      <span className={cn(
                        'font-body text-we-paper/90',
                        t.paid_date && 'line-through text-we-paper/45',
                      )}>
                        {t.description}
                      </span>
                    </td>
                    <td className="py-3 align-middle">
                      <span className={cn('font-body text-xs', NATURE_COLOR[t.nature])}>
                        {natureLabel(t)}
                      </span>
                    </td>
                    <td className="py-3 hidden md:table-cell align-middle">
                      <span className="font-body text-we-paper/50 text-xs">{t.category?.name ?? '—'}</span>
                    </td>
                    <td className="py-3 hidden lg:table-cell align-middle">
                      <span className="font-body text-we-paper/50 text-xs">{t.client_name ?? '—'}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-body text-we-paper/60 text-xs">
                        {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn('font-body text-xs', STATUS_COLOR[s])}>
                        {STATUS_LABEL[s]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={cn(
                          'font-mono text-sm',
                          type === 'receita' ? 'text-emerald-400' : 'text-red-400',
                          t.paid_date && 'opacity-50',
                        )}>
                          {formatCurrency(getTransactionEffectiveAmount(t))}
                        </span>
                        {type === 'despesa' && t.is_international_purchase && (t.iof_amount ?? 0) > 0 && (
                          <span className="font-mono text-[10px] text-we-paper/40">
                            {formatCurrency(t.amount)} + IOF {formatCurrency(t.iof_amount!)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="p-1 text-we-paper/30 hover:text-we-paper/70 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={isPending}
                          className="p-1 text-we-paper/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <FinTransactionDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditTarget(undefined) }}
        defaultType={type}
        categories={categories}
        banks={banks}
        clients={clients}
        projects={projects}
        transaction={editTarget}
      />
    </div>
  )
}
