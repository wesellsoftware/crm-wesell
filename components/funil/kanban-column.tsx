'use client'

import { useDroppable } from '@dnd-kit/core'
import { DealCard, DealData } from './deal-card'
import { formatCurrency } from '@/lib/utils'

interface Stage {
  id: string
  name: string
  color: string
  position: number
}

interface KanbanColumnProps {
  stage: Stage
  deals: DealData[]
}

export function KanbanColumn({ stage, deals }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const totalValue = deals.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
          <span className="font-body text-sm font-semibold text-we-paper/80">{stage.name}</span>
          <span className="font-mono text-xs text-we-paper/35 bg-white/[0.07] rounded-full px-2 py-0.5">
            {deals.length}
          </span>
        </div>
        <span className="font-mono text-xs text-we-paper/40">{formatCurrency(totalValue)}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 min-h-[120px] rounded-xl p-2 transition-colors"
        style={{
          background: isOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="font-mono text-[11px] text-we-paper/20">Arraste um negócio aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
