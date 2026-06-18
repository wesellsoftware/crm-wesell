'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { GrowthWindow } from '@/lib/financeiro/types'

const OPTIONS: { value: GrowthWindow; label: string }[] = [
  { value: '6m', label: '6m' },
  { value: '12m', label: '12m' },
  { value: 'ytd', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
]

export function FinWindowSelector({ current, basePath }: { current: GrowthWindow; basePath: string }) {
  const router = useRouter()

  return (
    <div className="flex items-center rounded-lg border border-white/[0.10] overflow-hidden">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => router.push(`${basePath}?window=${value}`)}
          className={cn(
            'px-4 py-1.5 text-xs font-body transition-colors',
            current === value
              ? 'bg-we-blue/70 text-white'
              : 'text-we-paper/45 hover:text-we-paper/70',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
