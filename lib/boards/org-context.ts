import { createClient } from '@/lib/supabase/server'

export async function getOrgContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgId } = await supabase.rpc('get_my_organization_id')

  if (orgId) {
    return { supabase, user, organizationId: orgId as string }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return null
  return { supabase, user, organizationId: profile.organization_id }
}
