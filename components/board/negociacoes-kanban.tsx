'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { formatCurrency } from '@/lib/utils'
import { moveDealStage } from '@/app/actions/boards'
import type { BoardItem, BoardItemValue, StatusOption } from '@/lib/boards/types'

function KanbanDealCard({ item, value, contactName }: {
  item: BoardItem
  value?: number
  contactName?: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`glass rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
    >
      <p className="font-body text-sm text-we-paper/90 font-medium">{item.name}</p>
      {contactName && <p className="font-body text-xs text-we-paper/45">{contactName}</p>}
      {value ? <p className="font-mono text-xs text-we-green">{formatCurrency(value)}</p> : null}
    </div>
  )
}

function KanbanStageColumn({
  stage,
  items,
  values,
  valueColumnId,
  contactColumnId,
  relatedNames,
}: {
  stage: StatusOption
  items: BoardItem[]
  values: BoardItemValue[]
  valueColumnId?: string
  contactColumnId?: string
  relatedNames: Record<string, string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  function getVal(itemId: string, colId?: string) {
    if (!colId) return undefined
    return values.find(v => v.item_id === itemId && v.column_id === colId)?.value
  }

  const total = items.reduce((sum, item) => {
    const v = getVal(item.id, valueColumnId) as { amount?: number } | undefined
    return sum + (v?.amount ?? 0)
  }, 0)

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="font-body text-sm font-semibold text-we-paper/80">{stage.label}</span>
          <span className="font-mono text-xs text-we-paper/35 bg-white/[0.07] rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <span className="font-mono text-xs text-we-paper/40">{formatCurrency(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 min-h-[120px] rounded-xl p-2 transition-colors"
        style={{
          background: isOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        {items.map(item => {
          const val = getVal(item.id, valueColumnId) as { amount?: number } | undefined
          const contactVal = getVal(item.id, contactColumnId) as { item_ids?: string[] } | undefined
          const contactId = contactVal?.item_ids?.[0]
          return (
            <KanbanDealCard
              key={item.id}
              item={item}
              value={val?.amount}
              contactName={contactId ? relatedNames[contactId] : undefined}
            />
          )
        })}
        {items.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="font-mono text-[11px] text-we-paper/20">Arraste uma oportunidade aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface NegociacoesKanbanProps {
  stages: StatusOption[]
  itemsByStage: Record<string, BoardItem[]>
  values: BoardItemValue[]
  valueColumnId?: string
  contactColumnId?: string
  relatedNames: Record<string, string>
}

export function NegociacoesKanban({
  stages,
  itemsByStage,
  values,
  valueColumnId,
  contactColumnId,
  relatedNames,
}: NegociacoesKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [localItemsByStage, setLocalItemsByStage] = useState(itemsByStage)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const stageId = over.id as string

    setLocalItemsByStage(prev => {
      const next: Record<string, BoardItem[]> = {}
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter(i => i.id !== itemId)
      }
      const item = Object.values(itemsByStage).flat().find(i => i.id === itemId)
      if (item) {
        next[stageId] = [...(next[stageId] ?? []), item]
      }
      return next
    })

    startTransition(() => { void moveDealStage(itemId, stageId) })
  }

  const activeItem = activeId
    ? Object.values(localItemsByStage).flat().find(i => i.id === activeId)
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-6 pb-2 shrink-0">
        <h1 className="font-display text-3xl text-we-paper">Negociações</h1>
        <div className="flex items-center gap-4 mt-2 border-b border-white/[0.06]">
          <Link
            href="/boards/negociacoes"
            className="font-body text-sm text-we-paper/40 hover:text-we-paper/60 pb-2 transition-colors"
          >
            Quadro principal
          </Link>
          <span className="font-body text-sm text-we-blue border-b-2 border-we-blue pb-2 -mb-px">
            Pipeline
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto px-8 py-6">
          <div className="flex gap-4 h-full min-w-max">
            {stages.map(stage => (
              <KanbanStageColumn
                key={stage.id}
                stage={stage}
                items={localItemsByStage[stage.id] ?? []}
                values={values}
                valueColumnId={valueColumnId}
                contactColumnId={contactColumnId}
                relatedNames={relatedNames}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeItem && <KanbanDealCard item={activeItem} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
