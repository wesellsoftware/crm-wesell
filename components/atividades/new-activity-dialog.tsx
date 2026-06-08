'use client'

import { useActionState, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createActivity } from '@/app/actions/activities'

type Deal = { id: string; title: string }
type Contact = { id: string; name: string }

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  border border-we-ink/15 bg-we-paper/30
  font-body text-sm text-we-ink placeholder:text-we-ink/35
  focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
`

const TYPES = [
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'task', label: 'Tarefa' },
  { value: 'note', label: 'Nota' },
]

export function NewActivityDialog({ deals, contacts }: { deals: Deal[]; contacts: Contact[] }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await createActivity(_, formData)
    if (result?.success) setOpen(false)
    return result
  }, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 px-4 h-9 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep transition-colors">
        <Plus size={15} />
        Nova atividade
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-we-ink">Nova atividade</DialogTitle>
        </DialogHeader>

        {state?.error && (
          <div className="px-3 py-2 rounded-[8px] bg-we-red/10 border border-we-red/20">
            <p className="font-body text-sm text-we-red">{state.error}</p>
          </div>
        )}

        <form action={action} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">Tipo *</label>
              <select name="type" required className={inputCls}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">Data/Hora</label>
              <input name="due_at" type="datetime-local" className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75">Título *</label>
            <input name="title" type="text" required placeholder="Descreva a atividade" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75">Descrição</label>
            <textarea name="description" rows={2} placeholder="Detalhes opcionais…" className={inputCls + ' h-auto py-2.5 resize-none'} />
          </div>
          {deals.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">Negócio</label>
              <select name="deal_id" className={inputCls}>
                <option value="">Sem negócio</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          )}
          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">Contato</label>
              <select name="contact_id" className={inputCls}>
                <option value="">Sem contato</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-[8px] border border-we-ink/15 font-body text-sm text-we-ink/60 hover:bg-we-paper/40 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 h-10 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors">
              {pending ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
