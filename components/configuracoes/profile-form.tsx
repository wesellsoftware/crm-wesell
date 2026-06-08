'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/settings'
import { Check } from 'lucide-react'

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  glass-input text-we-paper/80 placeholder:text-we-paper/30
  font-body text-sm
  focus:outline-none focus:ring-2 focus:ring-we-blue/50
`

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="font-body text-sm text-we-red">{state.error}</p>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 text-we-green">
          <Check size={14} />
          <p className="font-body text-sm">Salvo com sucesso!</p>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-body text-we-paper/55">Nome completo</label>
        <input name="full_name" type="text" defaultValue={fullName} required className={inputCls} />
      </div>
      <button type="submit" disabled={pending}
        className="h-9 px-5 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors">
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
