'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { finInputCls } from './fin-input-styles'
import {
  buildInstallmentDrafts,
  installmentsMatchTotal,
  roundMoney,
  sumInstallmentAmounts,
  type InstallmentDraft,
} from '@/lib/financeiro/installments'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = {
  totalAmount: number
  installmentCount: number
  firstDueDate: string
  onInstallmentsChange: (installments: InstallmentDraft[]) => void
  onValidChange: (valid: boolean) => void
}

export function FinInstallmentsEditor({
  totalAmount,
  installmentCount,
  firstDueDate,
  onInstallmentsChange,
  onValidChange,
}: Props) {
  const [installments, setInstallments] = useState<InstallmentDraft[]>([])
  const [manuallyEdited, setManuallyEdited] = useState(false)

  const canBuild = totalAmount > 0 && installmentCount >= 2 && Boolean(firstDueDate)

  useEffect(() => {
    if (!canBuild) {
      setInstallments([])
      return
    }
    if (manuallyEdited) return
    setInstallments(buildInstallmentDrafts(totalAmount, installmentCount, firstDueDate))
  }, [totalAmount, installmentCount, firstDueDate, canBuild, manuallyEdited])

  useEffect(() => {
    if (installmentCount < 2) setManuallyEdited(false)
  }, [installmentCount])

  const sum = useMemo(() => sumInstallmentAmounts(installments.map(i => i.amount)), [installments])
  const matchesTotal = useMemo(
    () => canBuild && installments.length === installmentCount && installmentsMatchTotal(
      installments.map(i => i.amount),
      totalAmount,
    ),
    [canBuild, installments, installmentCount, totalAmount],
  )
  const diff = roundMoney(totalAmount - sum)

  useEffect(() => {
    onInstallmentsChange(installments)
    onValidChange(matchesTotal)
  }, [installments, matchesTotal, onInstallmentsChange, onValidChange])

  function updateAmount(index: number, raw: string) {
    const amount = parseFloat(raw.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    setManuallyEdited(true)
    setInstallments(prev => prev.map((item, i) =>
      i === index ? { ...item, amount: roundMoney(amount) } : item,
    ))
  }

  function updateDueDate(index: number, due_date: string) {
    setManuallyEdited(true)
    setInstallments(prev => prev.map((item, i) =>
      i === index ? { ...item, due_date } : item,
    ))
  }

  function handleRedistribute() {
    if (!canBuild) return
    setManuallyEdited(false)
    setInstallments(buildInstallmentDrafts(totalAmount, installmentCount, firstDueDate))
  }

  if (!canBuild) {
    return (
      <p className="text-xs text-we-paper/40">
        Informe o valor total, a data de vencimento e o número de parcelas.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-we-paper/60 text-xs">Parcelas</Label>
        <button
          type="button"
          onClick={handleRedistribute}
          className="text-[11px] text-emerald-400/80 hover:text-emerald-300 transition-colors"
        >
          Redistribuir igualmente
        </button>
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {installments.map((item, index) => (
          <div
            key={item.number}
            className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center"
          >
            <span className="text-xs text-we-paper/40 w-6 shrink-0">
              {item.number}/{installmentCount}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={item.amount}
              onChange={e => updateAmount(index, e.target.value)}
              className={cn('h-8', finInputCls)}
              aria-label={`Valor da parcela ${item.number}`}
            />
            <Input
              type="date"
              value={item.due_date}
              onChange={e => updateDueDate(index, e.target.value)}
              className={cn('h-8', finInputCls)}
              aria-label={`Vencimento da parcela ${item.number}`}
            />
          </div>
        ))}
      </div>

      <div className={cn(
        'rounded-lg border px-3 py-2 text-xs',
        matchesTotal
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      )}>
        <div className="flex justify-between gap-2">
          <span>Soma das parcelas</span>
          <span className="font-mono">{formatCurrency(sum)}</span>
        </div>
        <div className="flex justify-between gap-2 mt-1">
          <span>Valor total</span>
          <span className="font-mono">{formatCurrency(totalAmount)}</span>
        </div>
        {!matchesTotal && (
          <p className="mt-1.5 text-amber-200/90">
            {diff > 0
              ? `Faltam ${formatCurrency(diff)} para fechar o valor total.`
              : `Excesso de ${formatCurrency(Math.abs(diff))} em relação ao valor total.`}
          </p>
        )}
      </div>
    </div>
  )
}
