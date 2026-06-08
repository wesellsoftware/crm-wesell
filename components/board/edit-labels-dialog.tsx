'use client'

import { useState, useTransition } from 'react'
import { Settings2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BoardColumn, StatusOption } from '@/lib/boards/types'
import { DEFAULT_STATUS_COLORS, createStatusOption } from '@/lib/boards/column-types'
import { updateColumnSettings } from '@/app/actions/boards'

interface EditLabelsDialogProps {
  column: BoardColumn
  slug: string
}

export function EditLabelsDialog({ column, slug }: EditLabelsDialogProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<StatusOption[]>(
    (column.settings.options ?? []) as StatusOption[]
  )
  const [, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateColumnSettings(column.id, { ...column.settings, options }, slug)
      setOpen(false)
    })
  }

  function addOption() {
    const color = DEFAULT_STATUS_COLORS[options.length % DEFAULT_STATUS_COLORS.length]
    setOptions(prev => [...prev, createStatusOption('Nova label', color)])
  }

  function updateOption(id: string, updates: Partial<StatusOption>) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  function removeOption(id: string) {
    setOptions(prev => prev.filter(o => o.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex opacity-40 hover:opacity-100 transition-opacity ml-1">
        <Settings2 size={11} className="text-we-paper/50" />
      </DialogTrigger>
      <DialogContent className="glass-modal border-white/10 text-we-paper max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-we-paper">
            Editar labels — {column.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto">
          {options.map(opt => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="color"
                value={opt.color}
                onChange={e => updateOption(opt.id, { color: e.target.value })}
                className="size-7 rounded cursor-pointer border-none bg-transparent"
              />
              <input
                value={opt.label}
                onChange={e => updateOption(opt.id, { label: e.target.value })}
                className="flex-1 h-8 px-2 rounded-lg glass-input text-we-paper/80 font-body text-sm focus:outline-none focus:ring-1 focus:ring-we-blue/40"
              />
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                className="text-we-red/60 hover:text-we-red transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 text-xs font-body text-we-paper/40 hover:text-we-paper/60 transition-colors py-1"
          >
            <Plus size={12} />
            Adicionar label
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-9 rounded-lg bg-we-blue text-white font-body text-sm hover:bg-we-blue/90 transition-colors mt-2"
        >
          Salvar
        </button>
      </DialogContent>
    </Dialog>
  )
}
