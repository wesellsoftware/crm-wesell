'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { formatCurrency } from '@/lib/utils'
import { Calendar } from 'lucide-react'

export type DealData = {
  id: string
  title: string
  value: number
  stage_id: string | null
  expected_close_date: string | null
  created_at: string
  contact: { id: string; name: string } | null
}

interface DealCardProps {
  deal: DealData
  isDragging?: boolean
}

function daysInStage(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
    data: { stageId: deal.stage_id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : undefined,
  }

  const days = daysInStage(deal.created_at)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass rounded-xl p-4 cursor-grab active:cursor-grabbing space-y-2.5 select-none hover:bg-white/[0.11] transition-colors"
    >
      <p className="font-body text-sm text-we-paper/90 leading-snug">{deal.title}</p>

      {deal.contact && (
        <p className="font-body text-xs text-we-paper/50 truncate">{deal.contact.name}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-we-lime font-semibold">
          {formatCurrency(deal.value)}
        </span>
        <div className="flex items-center gap-1 text-we-paper/30">
          {deal.expected_close_date ? (
            <>
              <Calendar size={11} />
              <span className="font-mono text-[10px]">
                {new Date(deal.expected_close_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px]">{days}d</span>
          )}
        </div>
      </div>
    </div>
  )
}
