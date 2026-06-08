'use client'

import { useState, useTransition, useRef } from 'react'
import { useActionState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createStage, deleteStage, updateStage, reorderStages, seedDefaultStages } from '@/app/actions/settings'
import { Trash2, Plus, GripVertical, Check, X, Pencil, Wand2 } from 'lucide-react'

interface Stage {
  id: string
  name: string
  color: string
  position: number
}

interface StagesManagerProps {
  stages: Stage[]
  isAdmin: boolean
}

const inputCls = 'h-9 px-3 rounded-[8px] glass-input text-we-paper/80 placeholder:text-we-paper/30 font-body text-sm focus:outline-none focus:ring-2 focus:ring-we-blue/50'

export function StagesManager({ stages: initialStages, isAdmin }: StagesManagerProps) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [, startReorder] = useTransition()
  const [seedPending, startSeed] = useTransition()
  const [createState, createAction, createPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createStage(_, formData)
      if (result?.success) {
        // Refresh from server on next render — revalidatePath handles it
      }
      return result
    },
    undefined
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex(s => s.id === active.id)
    const newIndex = stages.findIndex(s => s.id === over.id)
    const reordered = arrayMove(stages, oldIndex, newIndex)
    setStages(reordered)

    startReorder(() => {
      reorderStages(reordered.map(s => s.id))
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-xs text-we-paper/35">
          Arraste para reordenar. A ordem define o fluxo do funil.
        </p>
        {isAdmin && stages.length === 0 && (
          <button
            type="button"
            disabled={seedPending}
            onClick={() => startSeed(async () => {
              const result = await seedDefaultStages()
              if (!result?.error) {
                // Page will revalidate via server; reload to show new stages
                window.location.reload()
              }
            })}
            className="flex items-center gap-1.5 px-3 h-8 rounded-[8px] bg-we-blue/20 border border-we-blue/30 text-we-blue font-body text-xs hover:bg-we-blue/30 disabled:opacity-50 transition-colors shrink-0"
          >
            <Wand2 size={13} />
            {seedPending ? 'Criando…' : 'Usar etapas padrão'}
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {stages.map((stage, index) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                index={index}
                isAdmin={isAdmin}
                onDelete={() => setStages(prev => prev.filter(s => s.id !== stage.id))}
                onUpdate={(name, color) =>
                  setStages(prev => prev.map(s => s.id === stage.id ? { ...s, name, color } : s))
                }
              />
            ))}
            {stages.length === 0 && (
              <p className="font-mono text-xs text-we-paper/25 py-3 text-center">
                Nenhuma etapa criada. Crie a primeira abaixo.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Create form */}
      {isAdmin && (
        <form action={createAction} className="pt-4 border-t border-white/[0.07] space-y-3">
          {createState?.error && (
            <p className="font-body text-xs text-we-red">{createState.error}</p>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-body text-we-paper/45">Nome da nova etapa</label>
              <input
                key={stages.length} // reset field after creation
                name="name"
                type="text"
                required
                placeholder="Ex: Proposta enviada"
                className={`w-full ${inputCls}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-body text-we-paper/45">Cor</label>
              <input
                name="color"
                type="color"
                defaultValue="#4342F5"
                className="h-9 w-10 rounded-[8px] cursor-pointer border border-white/[0.12] bg-transparent p-0.5"
              />
            </div>
            <button
              type="submit"
              disabled={createPending}
              className="h-9 px-4 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors flex items-center gap-2 shrink-0"
            >
              <Plus size={14} />
              {createPending ? 'Criando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

interface SortableStageRowProps {
  stage: Stage
  index: number
  isAdmin: boolean
  onDelete: () => void
  onUpdate: (name: string, color: string) => void
}

function SortableStageRow({ stage, index, isAdmin, onDelete, onUpdate }: SortableStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(stage.name)
  const [editColor, setEditColor] = useState(stage.color)
  const [deletePending, startDelete] = useTransition()
  const [savePending, startSave] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  function startEdit() {
    setEditName(stage.name)
    setEditColor(stage.color)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditing(false)
    setEditName(stage.name)
    setEditColor(stage.color)
  }

  function saveEdit() {
    if (!editName.trim()) return
    onUpdate(editName.trim(), editColor)
    setEditing(false)
    startSave(async () => { await updateStage(stage.id, editName.trim(), editColor) })
  }

  function handleDeleteClick() {
    onDelete()
    startDelete(() => deleteStage(stage.id))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        isDragging
          ? 'glass border-we-blue/30 shadow-lg'
          : 'glass border-transparent hover:border-white/[0.08]'
      }`}
    >
      {/* Position badge */}
      <span className="font-mono text-[10px] text-we-paper/25 w-4 text-right shrink-0">{index + 1}</span>

      {/* Drag handle */}
      {isAdmin && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-we-paper/20 hover:text-we-paper/50 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical size={16} />
        </button>
      )}

      {/* Color dot / picker */}
      {editing ? (
        <input
          type="color"
          value={editColor}
          onChange={e => setEditColor(e.target.value)}
          className="size-5 rounded-full cursor-pointer border-0 bg-transparent shrink-0 p-0"
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
          title="Cor da etapa"
        />
      ) : (
        <span className="size-3 rounded-full shrink-0" style={{ background: stage.color }} />
      )}

      {/* Name — editable or static */}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          className="flex-1 h-7 px-2 rounded-[6px] glass-input text-we-paper/90 font-body text-sm focus:outline-none focus:ring-1 focus:ring-we-blue/60"
        />
      ) : (
        <span className="flex-1 font-body text-sm text-we-paper/80">{stage.name}</span>
      )}

      {/* Actions */}
      {isAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savePending || !editName.trim()}
                className="size-7 flex items-center justify-center rounded-[6px] text-we-green hover:bg-we-green/15 disabled:opacity-40 transition-colors"
                aria-label="Salvar"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/40 hover:bg-white/[0.06] transition-colors"
                aria-label="Cancelar"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/25 hover:text-we-paper/60 hover:bg-white/[0.06] transition-colors"
                aria-label="Editar etapa"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                disabled={deletePending}
                onClick={handleDeleteClick}
                className="size-7 flex items-center justify-center rounded-[6px] text-we-paper/25 hover:text-we-red hover:bg-we-red/10 disabled:opacity-40 transition-colors"
                aria-label="Excluir etapa"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
