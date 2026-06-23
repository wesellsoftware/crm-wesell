'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addMonth,
  buildMonthOptionsToCurrent,
  currentPeriod,
} from '@/lib/financeiro/period'
import type { MetricComparisonBase } from '@/lib/financeiro/types'

type Props = {
  period: string
  compare: MetricComparisonBase
}

function dashboardUrl(period: string, compare: MetricComparisonBase): string {
  return `/financeiro/dashboard?period=${period}&compare=${compare}`
}

export function FinMonthSelector({ period, compare }: Props) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const months = buildMonthOptionsToCurrent()
  const isCurrentMonth = period === currentPeriod()
  const canGoNext = !isCurrentMonth

  useEffect(() => {
    const container = scrollRef.current
    const selected = selectedRef.current
    if (!container || !selected) return
    const left = selected.offsetLeft - container.offsetWidth / 2 + selected.offsetWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [period])

  function navigate(nextPeriod: string) {
    router.push(dashboardUrl(nextPeriod, compare))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate(addMonth(period, -1))}
        className="shrink-0 p-2 rounded-lg glass text-we-paper/50 hover:text-we-paper hover:bg-white/[0.06] transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {months.map(({ value, label, isCurrent }) => {
          const selected = value === period
          return (
            <button
              key={value}
              ref={selected ? selectedRef : undefined}
              type="button"
              onClick={() => navigate(value)}
              className={cn(
                'shrink-0 snap-center px-3.5 py-1.5 rounded-lg font-body text-xs transition-colors whitespace-nowrap',
                selected
                  ? 'bg-we-blue/70 text-white'
                  : 'text-we-paper/45 hover:text-we-paper/70 hover:bg-white/[0.06]',
              )}
            >
              {label}
              {isCurrent && !selected && (
                <span className="ml-1 text-we-paper/25">·</span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => canGoNext && navigate(addMonth(period, 1))}
        disabled={!canGoNext}
        className={cn(
          'shrink-0 p-2 rounded-lg glass transition-colors',
          canGoNext
            ? 'text-we-paper/50 hover:text-we-paper hover:bg-white/[0.06]'
            : 'text-we-paper/20 cursor-not-allowed',
        )}
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
