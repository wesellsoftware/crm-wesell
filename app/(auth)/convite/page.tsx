import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteInviteForm } from '@/components/auth/complete-invite-form'

export default async function ConvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=Use+o+link+do+convite+enviado+por+e-mail')
  }

  const invitedOrgId = user.user_metadata?.organization_id as string | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'member' || !invitedOrgId) {
    redirect('/dashboard')
  }

  if (profile.organization_id !== invitedOrgId) {
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
