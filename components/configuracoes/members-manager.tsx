'use client'

import { useActionState, useState, useTransition } from 'react'
import { inviteMember, removeMember, updateMemberRole } from '@/app/actions/members'
import { Check, Shield, ShieldOff, Trash2, UserPlus } from 'lucide-react'

interface MemberRow {
  id: string
  full_name: string | null
  role: string
  created_at: string
}

interface MembersManagerProps {
  members: MemberRow[]
  isAdmin: boolean
  currentUserId: string
}

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  glass-input text-we-paper/80 placeholder:text-we-paper/30
  font-body text-sm
  focus:outline-none focus:ring-2 focus:ring-we-blue/50
`

function roleBadge(role: string) {
  const isAdminRole = role === 'admin'
  return (
    <span
      className={`font-mono text-xs px-2 py-0.5 rounded-full ${
        isAdminRole ? 'bg-we-blue/15 text-we-blue' : 'bg-white/[0.06] text-we-paper/40'
      }`}
    >
      {isAdminRole ? 'Admin' : 'Colaborador'}
    </span>
  )
}

export function MembersManager({ members, isAdmin, currentUserId }: MembersManagerProps) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMember, undefined)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleRoleChange(memberId: string, role: 'admin' | 'member') {
    setActionError(null)
    startTransition(async () => {
      const result = await updateMemberRole(memberId, role)
      if (result.error) setActionError(result.error)
    })
  }

  function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remover ${name} da organização?`)) return
    setActionError(null)
    startTransition(async () => {
      const result = await removeMember(memberId)
      if (result.error) setActionError(result.error)
    })
  }

  const adminCount = members.filter(m => m.role === 'admin').length

  return (
    <div className="space-y-5">
      {isAdmin && (
        <form action={inviteAction} className="space-y-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-we-paper/55">
            <UserPlus size={16} />
            <h3 className="font-body text-sm font-semibold">Convidar colaborador</h3>
          </div>
          <p className="font-body text-xs text-we-paper/35">
            O convidado receberá um e-mail para definir a senha e entrará como Colaborador.
          </p>
          {inviteState?.error && (
            <p className="font-body text-sm text-we-red">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <div className="flex items-center gap-2 text-we-green">
              <Check size={14} />
              <p className="font-body text-sm">Convite enviado com sucesso!</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-paper/55">Nome</label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="Nome completo"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-paper/55">E-mail</label>
              <input
                name="email"
                type="email"
                required
                placeholder="email@empresa.com"
                className={inputCls}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={invitePending || pending}
            className="h-9 px-5 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors"
          >
            {invitePending ? 'Enviando…' : 'Enviar convite'}
          </button>
        </form>
      )}

      {actionError && (
        <p className="font-body text-sm text-we-red">{actionError}</p>
      )}

      <div className="space-y-2">
        {members.map(m => {
          const isSelf = m.id === currentUserId
          const isLastAdmin = m.role === 'admin' && adminCount <= 1
          const name = m.full_name ?? 'Sem nome'

          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-full bg-we-blue/20 flex items-center justify-center shrink-0">
                  <span className="font-body text-xs text-we-blue font-semibold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="font-body text-sm text-we-paper/75 block truncate">
                    {name}
                    {isSelf && (
                      <span className="text-we-paper/35 ml-1">(você)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {roleBadge(m.role)}

                {isAdmin && !isSelf && (
                  <div className="flex items-center gap-1">
                    {m.role === 'member' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleRoleChange(m.id, 'admin')}
                        title="Promover a Admin"
                        className="size-8 rounded-[8px] flex items-center justify-center text-we-paper/40 hover:text-we-blue hover:bg-we-blue/10 transition-colors disabled:opacity-50"
                      >
                        <Shield size={14} />
                      </button>
                    )}
                    {m.role === 'admin' && !isLastAdmin && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleRoleChange(m.id, 'member')}
                        title="Tornar colaborador"
                        className="size-8 rounded-[8px] flex items-center justify-center text-we-paper/40 hover:text-we-paper/70 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                      >
                        <ShieldOff size={14} />
                      </button>
                    )}
                    {!isLastAdmin && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleRemove(m.id, name)}
                        title="Remover da organização"
                        className="size-8 rounded-[8px] flex items-center justify-center text-we-paper/40 hover:text-we-red hover:bg-we-red/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <p className="font-body text-sm text-we-paper/35">Nenhum membro na organização.</p>
        )}
      </div>
    </div>
  )
}
