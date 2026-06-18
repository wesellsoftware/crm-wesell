'use client'

import { useState, useTransition } from 'react'
import { Trash2, CheckCircle2, Clock, TrendingUp, Minus } from 'lucide-react'
import { deleteMeta, updateMeta } from '@/app/actions/financeiro'
import { formatCurrency } from '@/lib/utils'
import type { FinMetaAtingimento } from '@/lib/financeiro/types'

const COHORT_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

const STATUS_CONFIG = {
  futuro: { label: 'Período futuro', icon: Clock, color: 'text-we-paper/40', barColor: '#4342F5' },
  ativo_no_ritmo: { label: 'No ritmo', icon: TrendingUp, color: 'text-emerald-400', barColor: '#45F47F' },
  ativo_atrasado: { label: 'Atrasado', icon: Minus, color: 'text-red-400', barColor: '#F44545' },
  concluido: { label: 'Período encerrado', icon: CheckCircle2, color: 'text-we-paper/50', barColor: '#4342F5' },
} as const

type Props = { meta: FinMetaAtingimento }

export function FinMetaCard({ meta }: Props) {
  const [editing, setEditing] = useState(false)
  const [newVal, setNewVal] = useState(meta.valor_meta.toString())
  const [isPending, startTransition] = useTransition()

  const { label, icon: StatusIcon, color, barColor } = STATUS_CONFIG[meta.pacing_status]
  const barPct = Math.min(100, meta.atingimento_pct)
  const isConcluidoOk = meta.pacing_status === 'concluido' && meta.atingimento_pct >= 100
  const finalBarColor = isConcluidoOk ? '#45F47F' : barColor

  function handleDelete() {
    startTransition(() => { void deleteMeta(meta.id) })
  }

  function handleSave() {
    const v = parseFloat(newVal.replace(',', '.'))
    if (!isNaN(v) && v > 0) {
      startTransition(() => { void updateMeta(meta.id, v) })
      setEditing(false)
    }
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-body bg-white/[0.07] text-we-paper/55 mb-1">
            {COHORT_LABEL[meta.tipo_cohort]}
          </span>
          <p className="font-body text-sm font-semibold text-we-paper">{meta.periodo}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 font-body text-xs ${color}`}>
            <StatusIcon size={12} />
            {isConcluidoOk ? 'Meta atingida' : label}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="p-1 rounded text-we-paper/30 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-body">
          <span className="text-we-paper/45">Realizado</span>
          <span className="text-we-paper/70 font-medium">{meta.atingimento_pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, background: finalBarColor }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-body text-we-paper/40">
          <span>{formatCurrency(meta.realizado)}</span>
          <span>
            {editing ? (
              <span className="flex items-center gap-1">
                <input
                  value={newVal}
                  onChange={e => setNewVal(e.target.value)}
                  className="w-24 rounded border border-white/[0.16] bg-white/[0.06] px-2 py-0.5 text-xs text-we-paper font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                <button onClick={() => setEditing(false)} className="text-we-paper/40 hover:text-we-paper/70 text-xs">✕</button>
              </span>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="hover:text-we-paper/70 transition-colors"
                title="Editar meta"
              >
                Meta: {formatCurrency(meta.valor_meta)}
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Pacing hint for active periods */}
      {meta.elapsed_pct !== null && meta.prorated_meta !== null && (
        <p className="font-body text-xs text-we-paper/35">
          {meta.elapsed_pct.toFixed(0)}% do período decorrido · esperado até agora:{' '}
          <span className="text-we-paper/55">{formatCurrency(meta.prorated_meta)}</span>
        </p>
      )}
    </div>
  )
}
