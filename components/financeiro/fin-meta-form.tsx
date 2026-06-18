'use client'

import { useActionState, useState } from 'react'
import { createMeta } from '@/app/actions/financeiro'
import { finInputCls, finSelectCls } from './fin-input-styles'

const PLACEHOLDER: Record<string, string> = {
  mensal: '2026-07',
  trimestral: '2026-Q3',
  anual: '2026',
}

export function FinMetaForm() {
  const [state, formAction, pending] = useActionState(createMeta, null)
  const [tipo, setTipo] = useState<'mensal' | 'trimestral' | 'anual'>('mensal')

  return (
    <form action={formAction} className="glass rounded-xl p-5 space-y-4">
      <p className="font-body text-sm font-semibold text-we-paper/70">Definir nova meta</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="font-body text-xs text-we-paper/55">Cohort</label>
          <select
            name="tipo_cohort"
            value={tipo}
            onChange={e => setTipo(e.target.value as typeof tipo)}
            className={`w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-sm ${finSelectCls}`}
          >
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-body text-xs text-we-paper/55">
            Período <span className="text-we-paper/30">({PLACEHOLDER[tipo]})</span>
          </label>
          <input
            name="periodo"
            placeholder={PLACEHOLDER[tipo]}
            className={`w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-sm ${finInputCls}`}
          />
        </div>

        <div className="space-y-1">
          <label className="font-body text-xs text-we-paper/55">Meta (R$)</label>
          <input
            name="valor_meta"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            className={`w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-sm ${finInputCls}`}
          />
        </div>
      </div>

      {state?.error && (
        <p className="font-body text-xs text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="font-body text-xs text-emerald-400">Meta criada com sucesso.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-we-blue text-white text-sm font-body hover:bg-we-blue/80 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Salvando...' : 'Definir meta'}
      </button>
    </form>
  )
}
