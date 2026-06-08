'use client'

import { useActionState, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createDeal } from '@/app/actions/deals'

type Stage = { id: string; name: string }
type Contact = { id: string; name: string }

interface NewDealDialogProps {
  stages: Stage[]
  contacts: Contact[]
  defaultStageId?: string
}

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  border border-we-ink/15 bg-we-paper/30
  font-body text-sm text-we-ink placeholder:text-we-ink/35
  focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
  transition-shadow duration-150
`

export function NewDealDialog({ stages, contacts, defaultStageId }: NewDealDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await createDeal(_, formData)
    if (result?.success) setOpen(false)
    return result
  }, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center gap-2 px-4 h-9 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep transition-colors"
      >
        <Plus size={15} />
        Novo negócio
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-we-ink">Novo negócio</DialogTitle>
        </DialogHeader>

        {state?.error && (
          <div className="px-3 py-2 rounded-[8px] bg-we-red/10 border border-we-red/20">
            <p className="font-body text-sm text-we-red">{state.error}</p>
          </div>
        )}

        <form action={action} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75" htmlFor="nd-title">Título *</label>
            <input id="nd-title" name="title" type="text" required placeholder="Ex: Proposta Empresa XYZ" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="nd-value">Valor (R$)</label>
              <input id="nd-value" name="value" type="number" min="0" step="0.01" placeholder="0" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="nd-close">Fechamento</label>
              <input id="nd-close" name="expected_close_date" type="date" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75" htmlFor="nd-stage">Etapa *</label>
            <select
              id="nd-stage"
              name="stage_id"
              required
              defaultValue={defaultStageId ?? stages[0]?.id ?? ''}
              className={inputCls}
            >
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="nd-contact">Contato</label>
              <select id="nd-contact" name="contact_id" className={inputCls}>
                <option value="">Sem contato</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-[8px] border border-we-ink/15 font-body text-sm text-we-ink/60 hover:bg-we-paper/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 h-10 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors"
            >
              {pending ? 'Criando…' : 'Criar negócio'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
