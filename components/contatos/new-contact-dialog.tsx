'use client'

import { useActionState, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { createContact } from '@/app/actions/contacts'

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  border border-we-ink/15 bg-we-paper/30
  font-body text-sm text-we-ink placeholder:text-we-ink/35
  focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
  transition-shadow duration-150
`

export function NewContactDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await createContact(_, formData)
    if (result?.success) setOpen(false)
    return result
  }, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 px-4 h-9 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep transition-colors">
        <UserPlus size={15} />
        Novo contato
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-we-ink">Novo contato</DialogTitle>
        </DialogHeader>

        {state?.error && (
          <div className="px-3 py-2 rounded-[8px] bg-we-red/10 border border-we-red/20">
            <p className="font-body text-sm text-we-red">{state.error}</p>
          </div>
        )}

        <form action={action} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75">Nome *</label>
            <input name="name" type="text" required placeholder="Nome completo" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">E-mail</label>
              <input name="email" type="email" placeholder="email@..." className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75">Telefone</label>
              <input name="phone" type="tel" placeholder="(00) 00000-0000" className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75">Empresa</label>
            <input name="company" type="text" placeholder="Nome da empresa" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-body text-we-ink/75">Notas</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Observações..."
              className={inputCls + ' h-auto py-2.5 resize-none'}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-[8px] border border-we-ink/15 font-body text-sm text-we-ink/60 hover:bg-we-paper/40 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 h-10 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors">
              {pending ? 'Criando…' : 'Criar contato'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
