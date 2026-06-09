'use server'

import { revalidatePath } from 'next/cache'
import { getAppOrigin } from '@/lib/app-url'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_CREDENTIALS_ERROR, createAdminClient, tryCreateAdminClient } from '@/lib/supabase/admin'
import { logFeedEvent } from '@/lib/feed/log-feed-event'

type MemberRole = 'admin' | 'member'

async function getAdminContext(): Promise<
  | { error: string }
  | { supabase: Awaited<ReturnType<typeof createClient>>; organizationId: string; userId: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Apenas administradores podem gerenciar membros.' }
  }

  return { supabase, organizationId: profile.organization_id, userId: user.id }
}

async function countAdmins(organizationId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'admin')

  if (error) throw new Error(error.message)
  return count ?? 0
}

function roleLabel(role: MemberRole) {
  return role === 'admin' ? 'Admin' : 'Colaborador'
}

function mapInviteError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já possui uma conta. Peça para a pessoa entrar em contato com você.'
  }
  if (lower.includes('invalid email')) {
    return 'E-mail inválido.'
  }
  if (lower.includes('rate limit')) {
    return 'Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.'
  }
  return message
}

export async function inviteMember(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const fullName = (formData.get('full_name') as string)?.trim()

  if (!email) return { error: 'Informe o e-mail.' }
  if (!fullName) return { error: 'Informe o nome.' }

  const origin = await getAppOrigin()

  const admin = tryCreateAdminClient()
  if (!admin) return { error: ADMIN_CREDENTIALS_ERROR }
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      organization_id: ctx.organizationId,
      full_name: fullName,
      role: 'member',
    },
    redirectTo: `${origin}/auth/callback?next=/convite`,
  })

  if (error) return { error: mapInviteError(error.message) }

  await logFeedEvent(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    category: 'settings',
    eventType: 'member_invited',
    summary: `convidou ${fullName} como Colaborador`,
    entityType: 'profile',
    metadata: { email, full_name: fullName, role: 'member' },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function updateMemberRole(
  memberId: string,
  role: MemberRole
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  if (role !== 'admin' && role !== 'member') {
    return { error: 'Papel inválido.' }
  }

  const admin = tryCreateAdminClient()
  if (!admin) return { error: ADMIN_CREDENTIALS_ERROR }

  const { data: member } = await admin
    .from('profiles')
    .select('id, full_name, role, organization_id')
    .eq('id', memberId)
    .single()

  if (!member || member.organization_id !== ctx.organizationId) {
    return { error: 'Membro não encontrado.' }
  }

  if (member.role === role) {
    return { success: true }
  }

  if (member.role === 'admin' && role === 'member') {
    const adminCount = await countAdmins(ctx.organizationId)
    if (adminCount <= 1) {
      return { error: 'Não é possível rebaixar o último administrador.' }
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', memberId)

  if (error) return { error: error.message }

  const name = member.full_name ?? 'Usuário'
  await logFeedEvent(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    category: 'settings',
    eventType: 'member_role_updated',
    summary: `alterou ${name} para ${roleLabel(role)}`,
    entityType: 'profile',
    entityId: memberId,
    metadata: { previous_role: member.role, new_role: role },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function removeMember(
  memberId: string
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  if (memberId === ctx.userId) {
    return { error: 'Você não pode remover a si mesmo.' }
  }

  const admin = tryCreateAdminClient()
  if (!admin) return { error: ADMIN_CREDENTIALS_ERROR }

  const { data: member } = await admin
    .from('profiles')
    .select('id, full_name, role, organization_id')
    .eq('id', memberId)
    .single()

  if (!member || member.organization_id !== ctx.organizationId) {
    return { error: 'Membro não encontrado.' }
  }

  if (member.role === 'admin') {
    const adminCount = await countAdmins(ctx.organizationId)
    if (adminCount <= 1) {
      return { error: 'Não é possível remover o último administrador.' }
    }
  }

  const { error } = await admin
    .from('profiles')
    .delete()
    .eq('id', memberId)

  if (error) return { error: error.message }

  const name = member.full_name ?? 'Usuário'
  await logFeedEvent(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    category: 'settings',
    eventType: 'member_removed',
    summary: `removeu ${name} da organização`,
    entityType: 'profile',
    entityId: memberId,
    metadata: { full_name: name, role: member.role },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}
