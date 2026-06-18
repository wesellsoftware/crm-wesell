'use client'

import type { ReactNode } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FinSparkline } from './fin-sparkline'
import type { ScorecardItem } from '@/lib/financeiro/types'

type Format = 'currency' | 'number' | 'percent' | 'months'

function formatValue(v: number, format: Format): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }
  if (format === 'percent') return `${v.toFixed(1)}%`
  if (format === 'months') return `${v.toFixed(1)}m`
  return v.toLocaleString('pt-BR')
}

function formatCompact(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)
}

type Props = {
  label: string
  hint?: string
  /** Pass a pre-rendered element — do NOT pass the component function itself (RSC boundary). */
  icon: ReactNode
  /** Hex color used for the sparkline and the icon background tint. */
  color: string
  format?: Format
  scorecard: ScorecardItem
  emptyValue?: string
}

export function FinScorecard({ label, hint, icon, color, format = 'currency', scorecard, emptyValue = '—' }: Props) {
  const { value, delta, compareValue, series, higherIsBetter } = scorecard
  const isEmpty = value === 0

  let deltaColorCls = 'text-we-paper/40'
  let DeltaIcon = Minus

  if (delta !== null && !isEmpty) {
    const isPositive = delta > 0
    const isGood = higherIsBetter ? isPositive : !isPositive
    deltaColorCls = isGood ? 'text-emerald-400' : 'text-red-400'
    DeltaIcon = isPositive ? ArrowUp : ArrowDown
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2">
          {delta !== null && !isEmpty && (
            <div className="flex flex-col items-end gap-0.5">
              <span className={cn('flex items-center gap-0.5 font-body text-xs font-medium', deltaColorCls)}>
                <DeltaIcon size={10} />
                {Math.abs(delta).toFixed(1)}%
              </span>
              {compareValue !== null && (
                <span className="font-body text-[10px] text-we-paper/30 leading-none">
                  {formatCompact(compareValue)}
                </span>
              )}
            </div>
          )}
          <div
            className="size-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}22` }}
          >
            {icon}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className={cn('font-body text-3xl leading-none', isEmpty ? 'text-we-paper/30' : 'text-we-paper')}>
          {isEmpty ? emptyValue : formatValue(value, format)}
        </p>
        {series.length >= 2 && !isEmpty && (
          <div className="opacity-50 mb-0.5 shrink-0">
            <FinSparkline data={series} color={color} />
          </div>
        )}
      </div>

      {hint && <p className="font-body text-xs text-we-paper/35">{hint}</p>}
    </div>
  )
}
