'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { COLUMN_TYPE_LABELS } from '@/lib/boards/column-types'
import type { ColumnType } from '@/lib/boards/types'
import { createColumn } from '@/app/actions/boards'

const ADDABLE_TYPES: ColumnType[] = [
  'text', 'status', 'person', 'date', 'timeline', 'number', 'currency',
  'email', 'phone', 'url', 'tags', 'relation',
]

interface AddColumnDialogProps {
  boardId: string
  slug: string
}

export function AddColumnDialog({ boardId, slug }: AddColumnDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<ColumnType>('text')
  const [, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const settings = type === 'status' || type === 'tags'
        ? { options: [{ id: crypto.randomUUID(), label: 'Novo', color: '#4342F5' }] }
        : type === 'relation'
          ? { target_board_slug: slug === 'contatos' ? 'contas' : 'contatos' }
          : type === 'currency'
            ? { currency: 'BRL' }
            : {}
      const result = await createColumn(boardId, name.trim(), type, slug, settings)
      if (!result.error) {
        setName('')
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-we-paper/40 hover:bg-white/[0.05] hover:text-we-paper/60 transition-colors text-xs font-body border border-white/[0.08]"
      >
        <Plus size={13} />
        Coluna
      </DialogTrigger>
      <DialogContent className="glass-modal border-white/10 text-we-paper">
        <DialogHeader>
          <DialogTitle className="font-display text-we-paper">Adicionar coluna</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="font-body text-xs text-we-paper/50 mb-1 block">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Prioridade"
              className="w-full h-9 px-3 rounded-lg glass-input text-we-paper/80 font-body text-sm focus:outline-none focus:ring-1 focus:ring-we-blue/40"
            />
          </div>
          <div>
            <label className="font-body text-xs text-we-paper/50 mb-2 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {ADDABLE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-2 py-2 rounded-lg text-xs font-body transition-colors ${
                    type === t
                      ? 'bg-we-blue/20 text-we-blue border border-we-blue/30'
                      : 'bg-white/[0.04] text-we-paper/60 hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  {COLUMN_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full h-9 rounded-lg bg-we-blue text-white font-body text-sm hover:bg-we-blue/90 transition-colors disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
