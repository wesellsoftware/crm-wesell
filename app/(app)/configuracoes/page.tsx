import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/configuracoes/profile-form'
import { OrgForm } from '@/components/configuracoes/org-form'
import { StagesManager } from '@/components/configuracoes/stages-manager'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: org },
    { data: stages },
    { data: members },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, role, organization_id').eq('id', user?.id ?? '').single(),
    supabase.from('organizations').select('id, name').single(),
    supabase.from('stages').select('id, name, color, position').order('position'),
    supabase.from('profiles').select('id, full_name, role, created_at').order('created_at'),
  ])

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <h1 className="font-display text-3xl text-we-paper">Configurações</h1>

      {/* Profile */}
      <section className="glass rounded-xl p-6 space-y-5">
        <h2 className="font-body text-base font-semibold text-we-paper/70">Meu perfil</h2>
        <ProfileForm fullName={profile?.full_name ?? ''} />
      </section>

      {/* Org */}
      {isAdmin && (
        <section className="glass rounded-xl p-6 space-y-5">
          <h2 className="font-body text-base font-semibold text-we-paper/70">Organização</h2>
          <OrgForm orgName={org?.name ?? ''} />
        </section>
      )}

      {/* Members */}
      <section className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-body text-base font-semibold text-we-paper/70">Membros</h2>
        <div className="space-y-2">
          {(members ?? []).map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-we-blue/20 flex items-center justify-center">
                  <span className="font-body text-xs text-we-blue font-semibold">
                    {(m.full_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-body text-sm text-we-paper/75">{m.full_name ?? 'Sem nome'}</span>
              </div>
              <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-we-blue/15 text-we-blue' : 'bg-white/[0.06] text-we-paper/40'}`}>
                {m.role === 'admin' ? 'Admin' : 'Membro'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stages */}
      <section className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-body text-base font-semibold text-we-paper/70">Etapas do funil</h2>
        <StagesManager stages={stages ?? []} isAdmin={isAdmin} />
      </section>
    </div>
  )
}
