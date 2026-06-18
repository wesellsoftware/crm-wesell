import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  color: string
  empty?: boolean
}

export function FinKpiCard({ label, value, hint, icon: Icon, color, empty }: Props) {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
        <div
          className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className={cn('font-body text-3xl leading-none', empty ? 'text-we-paper/30' : 'text-we-paper')}>
        {value}
      </p>
      {hint && <p className="font-body text-xs text-we-paper/35">{hint}</p>}
    </div>
  )
}
