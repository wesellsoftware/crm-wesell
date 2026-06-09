import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/configuracoes/profile-form'
import { OrgForm } from '@/components/configuracoes/org-form'
import { PageTitle } from '@/components/page-title'
import { WebhooksManager } from '@/components/configuracoes/webhooks-manager'
import { MembersManager } from '@/components/configuracoes/members-manager'
import { headers } from 'next/headers'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: org },
    { data: members },
    { data: webhooks },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, role, organization_id').eq('id', user?.id ?? '').single(),
    supabase.from('organizations').select('id, name').single(),
    supabase.from('profiles').select('id, full_name, role, created_at').order('created_at'),
    supabase.from('organization_webhooks').select('id, event, url, is_active, created_at').order('created_at'),
  ])

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const apiEndpoint = host ? `${protocol}://${host}/api/leads` : '/api/leads'

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <PageTitle>Configurações</PageTitle>

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
        <MembersManager
          members={members ?? []}
          isAdmin={isAdmin}
          currentUserId={user?.id ?? ''}
        />
      </section>

      {/* Integrations */}
      <section className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-body text-base font-semibold text-we-paper/70">Integrações</h2>
        <WebhooksManager webhooks={webhooks ?? []} isAdmin={isAdmin} apiEndpoint={apiEndpoint} />
      </section>
    </div>
  )
}
