'use client'

import { useEffect, useState, useTransition } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react'
import type { BoardGroup } from '@/lib/boards/types'
import { updateGroup, deleteGroup } from '@/app/actions/boards'
import { canDeleteBoardGroup } from '@/lib/boards/fixed-groups'
import { cn } from '@/lib/utils'

interface GroupHeaderProps {
  group: BoardGroup
  slug: string
  itemCount: number
  collapsed: boolean
  onToggleCollapse: () => void
  onUpdate: (updates: Partial<BoardGroup>) => void
  onDelete: () => void
  dragHandleProps?: ComponentPropsWithoutRef<'button'>
}

function GroupColorPicker({
  color,
  onChange,
}: {
  color: string
  onChange: (color: string) => void
}) {
  return (
    <label
      className="relative shrink-0 cursor-pointer group/color"
      title="Cor do título e barras"
      onClick={e => e.stopPropagation()}
    >
      <div
        className="size-4 rounded-full ring-1 ring-white/20 group-hover/color:ring-white/40 transition-shadow"
        style={{ backgroundColor: color }}
      />
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
    </label>
  )
}

export function GroupHeader({
  group,
  slug,
  itemCount,
  collapsed,
  onToggleCollapse,
  onUpdate,
  onDelete,
  dragHandleProps,
}: GroupHeaderProps) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(group.name)
  const [localColor, setLocalColor] = useState(group.color)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const isDeletable = canDeleteBoardGroup(slug, group.name)

  useEffect(() => {
    setDraftName(group.name)
    setLocalColor(group.color)
  }, [group.name, group.color])

  function saveName() {
    const name = draftName.trim()
    setEditingName(false)
    if (!name || name === group.name) {
      setDraftName(group.name)
      return
    }
    onUpdate({ name })
    startTransition(() => { void updateGroup(group.id, { name }, slug) })
  }

  function handleColorChange(color: string) {
    setLocalColor(color)
    onUpdate({ color })
    startTransition(() => { void updateGroup(group.id, { color }, slug) })
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteGroup(group.id, slug)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      onDelete()
    })
  }

  return (
    <div className="flex items-center gap-2 mb-2 px-1 group/header">
      {dragHandleProps && (
        <button
          type="button"
          className="shrink-0 p-0.5 rounded text-we-paper/25 hover:text-we-paper/50 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastar para reordenar"
          {...dragHandleProps}
        >
          <GripVertical size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="shrink-0 p-0.5 rounded hover:bg-white/[0.05] transition-colors"
        aria-label={collapsed ? 'Expandir grupo' : 'Recolher grupo'}
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-we-paper/35" />
        ) : (
          <ChevronDown size={14} className="text-we-paper/35" />
        )}
      </button>

      <GroupColorPicker color={localColor} onChange={handleColorChange} />

      {editingName ? (
        <input
          autoFocus
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={saveName}
          onKeyDown={e => {
            if (e.key === 'Enter') saveName()
            if (e.key === 'Escape') {
              setDraftName(group.name)
              setEditingName(false)
            }
          }}
          className="h-7 min-w-[120px] max-w-[240px] glass-input rounded px-2 outline-none font-body text-sm font-semibold focus:ring-1 focus:ring-we-blue/40"
          style={{ color: localColor }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingName(true)}
          className="font-body text-sm font-semibold hover:opacity-80 transition-opacity text-left"
          style={{ color: localColor }}
          title="Clique para renomear"
        >
          {group.name}
        </button>
      )}

      <span className="font-mono text-[10px] text-we-paper/40 bg-white/[0.07] px-1.5 py-0.5 rounded shrink-0">
        {itemCount}
      </span>

      {isDeletable && (
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="font-body text-[10px] text-we-paper/50">Excluir?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="font-body text-[10px] text-we-red hover:text-we-red/80 px-1.5 py-0.5 rounded hover:bg-we-red/10 transition-colors"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                className="font-body text-[10px] text-we-paper/50 hover:text-we-paper/70 px-1.5 py-0.5 rounded transition-colors"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn(
                'p-1 rounded text-we-paper/30 hover:text-we-red hover:bg-we-red/10 transition-colors'
              )}
              title="Excluir grupo"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {deleteError && (
        <span className="font-body text-[10px] text-we-red/80">{deleteError}</span>
      )}
    </div>
  )
}
