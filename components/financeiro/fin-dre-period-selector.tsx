'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addMonth } from '@/lib/financeiro/period'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

type Props = {
  period: string // YYYY-MM
  regime: 'caixa' | 'competencia'
}

export function FinDrePeriodSelector({ period, regime }: Props) {
  const router = useRouter()
  const [year, month] = period.split('-').map(Number)

  function navigate(newPeriod: string, newRegime: string) {
    router.push(`/financeiro/dre?period=${newPeriod}&regime=${newRegime}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Month navigator */}
      <div className="flex items-center gap-1 glass rounded-lg px-1 py-1">
        <button
          type="button"
          onClick={() => navigate(addMonth(period, -1), regime)}
          className="p-1.5 rounded-md text-we-paper/50 hover:text-we-paper hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-body text-sm text-we-paper px-2 min-w-[140px] text-center">
          {MONTHS[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={() => navigate(addMonth(period, 1), regime)}
          className="p-1.5 rounded-md text-we-paper/50 hover:text-we-paper hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Regime toggle */}
      <div className="flex items-center rounded-lg border border-white/[0.10] overflow-hidden">
        {(['caixa', 'competencia'] as const).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => navigate(period, r)}
            className={cn(
              'px-4 py-1.5 text-xs font-body transition-colors',
              regime === r
                ? 'bg-we-blue/70 text-white'
                : 'text-we-paper/45 hover:text-we-paper/70',
            )}
          >
            {r === 'caixa' ? 'Realizado' : 'Competência'}
          </button>
        ))}
      </div>
    </div>
  )
}
