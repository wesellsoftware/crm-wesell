'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { MetricComparisonBase } from '@/lib/financeiro/types'

const OPTIONS: { value: MetricComparisonBase; label: string }[] = [
  { value: 'prev', label: 'vs mês ant.' },
  { value: 'avg3', label: 'vs média 3m' },
  { value: 'yoy', label: 'vs ano ant.' },
]

export function FinCompareSelector({
  current,
  period,
}: {
  current: MetricComparisonBase
  period: string
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-xs text-we-paper/35">Comparar</span>
      <div className="flex items-center rounded-lg border border-white/[0.10] overflow-hidden">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => router.push(`/financeiro/dashboard?period=${period}&compare=${value}`)}
            className={cn(
              'px-3 py-1.5 text-xs font-body transition-colors',
              current === value
                ? 'bg-we-blue/70 text-white'
                : 'text-we-paper/45 hover:text-we-paper/70',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
