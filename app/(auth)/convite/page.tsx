import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteInviteForm } from '@/components/auth/complete-invite-form'
import { hasInviteMetadata } from '@/lib/auth/invite'

function InviteSetupError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)' }}>
      <div className="w-full max-w-md glass-light rounded-2xl px-10 py-10 text-center">
        <h2 className="font-display text-2xl text-we-ink mb-3">Não foi possível concluir o convite</h2>
        <p className="font-body text-we-ink/60">{message}</p>
      </div>
    </div>
  )
}

export default async function ConvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=Use+o+link+do+convite+enviado+por+e-mail')
  }

  if (user.user_metadata?.invite_completed === true) {
    redirect('/dashboard')
  }

  const invitedOrgId = user.user_metadata?.organization_id as string | undefined

  if (!hasInviteMetadata(user)) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <InviteSetupError message="Seu convite foi recebido, mas o perfil ainda não foi criado. Peça ao administrador para verificar se a configuração do banco está correta e envie o convite novamente." />
    )
  }

  if (profile.organization_id !== invitedOrgId) {
    return (
      <InviteSetupError message="Há uma inconsistência entre o convite e sua organização. Entre em contato com o administrador que enviou o convite." />
    )
  }

  if (profile.role !== 'member') {
    redirect('/dashboard')
  }

  // Convites antigos já concluídos (sem flag invite_completed) — liberar acesso
  if (user.user_metadata?.invite_completed !== false) {
    redirect('/dashboard')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single()

  return (
    <CompleteInviteForm
      orgName={org?.name ?? 'sua equipe'}
      email={user.email ?? ''}
      fullName={profile.full_name ?? (user.user_metadata?.full_name as string) ?? ''}
    />
  )
}
