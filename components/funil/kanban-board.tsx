'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { DealCard, DealData } from './deal-card'
import { NewDealDialog } from './new-deal-dialog'
import { moveDeal } from '@/app/actions/deals'

interface Stage {
  id: string
  name: string
  color: string
  position: number
}

interface Contact {
  id: string
  name: string
}

interface KanbanBoardProps {
  stages: Stage[]
  deals: DealData[]
  contacts: Contact[]
}

export function KanbanBoard({ stages, deals: initialDeals, contacts }: KanbanBoardProps) {
  const [deals, setDeals] = useState<DealData[]>(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const dealId = active.id as string
    const newStageId = over.id as string
    const deal = deals.find(d => d.id === dealId)
    if (!deal || deal.stage_id === newStageId) return

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: newStageId } : d))

    startTransition(() => {
      moveDeal(dealId, newStageId)
    })
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) ?? null : null
  const openDeals = deals.filter(d => d.stage_id !== null)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-3xl text-we-paper">Funil</h1>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            {openDeals.length} negócio{openDeals.length !== 1 ? 's' : ''} aberto{openDeals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NewDealDialog stages={stages} contacts={contacts} defaultStageId={stages[0]?.id} />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-8 pb-8">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter(d => d.stage_id === stage.id)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDeal ? (
              <div className="rotate-2 scale-105 shadow-2xl">
                <DealCard deal={activeDeal} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
