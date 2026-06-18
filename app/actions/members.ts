'use server'

import { revalidatePath } from 'next/cache'
import { getAuthRedirectOrigin } from '@/lib/app-url'
import { createClient } from '@/lib/supabase/server'
import { type MemberPlatformStatus, getMemberPlatformStatus } from '@/lib/auth/invite'
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
    return 'Este e-mail já possui uma conta ativa. Se o colaborador não consegue entrar, use "Reenviar convite".'
  }
  if (lower.includes('invalid email')) {
    return 'E-mail inválido.'
  }
  if (lower.includes('rate limit')) {
    return 'Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.'
  }
  if (lower.includes('expired') || lower.includes('invalid')) {
    return 'O link anterior expirou. Envie o convite novamente.'
  }
  return message
}

type InviteMetadata = {
  organization_id: string
  full_name: string
  role: 'member'
  invite_completed: false
}

async function sendMemberInviteEmail(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  params: {
    email: string
    userId?: string
    origin: string
    metadata: InviteMetadata
  }
): Promise<{ error?: string }> {
  const { email, userId, origin, metadata } = params
  const redirectTo = `${origin}/auth/callback`

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo,
  })

  if (!error) return {}

  const lower = error.message.toLowerCase()
  const isExistingUser =
    lower.includes('already registered') || lower.includes('already been registered')

  if (!isExistingUser) return { error: mapInviteError(error.message) }

  if (!userId) return { error: mapInviteError(error.message) }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId)
  if (authError || !authUser.user) {
    return { error: 'Não foi possível localizar o usuário para reenviar o convite.' }
  }

  const inviteCompleted = authUser.user.user_metadata?.invite_completed === true
  if (inviteCompleted) {
    return { error: 'Este colaborador já concluiu o cadastro. Peça para ele entrar em /login.' }
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  })
  if (updateError) return { error: mapInviteError(updateError.message) }

  const { error: resetError } = await admin.auth.resetPasswordForEmail(email, { redirectTo })
  if (resetError) return { error: mapInviteError(resetError.message) }

  return {}
}

export async function getMembersPlatformStatus(
  memberIds: string[]
): Promise<Record<string, MemberPlatformStatus>> {
  const admin = tryCreateAdminClient()
  if (!admin || memberIds.length === 0) return {}

  const status: Record<string, MemberPlatformStatus> = {}
  await Promise.all(
    memberIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      status[id] = getMemberPlatformStatus(data.user)
    })
  )
  return status
}

/** @deprecated use getMembersPlatformStatus */
export async function getMembersInviteStatus(
  memberIds: string[]
): Promise<Record<string, boolean>> {
  const statuses = await getMembersPlatformStatus(memberIds)
  return Object.fromEntries(
    Object.entries(statuses).map(([id, status]) => [id, status === 'pending'])
  )
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

  const origin = await getAuthRedirectOrigin()

  const admin = tryCreateAdminClient()
  if (!admin) return { error: ADMIN_CREDENTIALS_ERROR }

  const metadata: InviteMetadata = {
    organization_id: ctx.organizationId,
    full_name: fullName,
    role: 'member',
    invite_completed: false,
  }

  const { error } = await sendMemberInviteEmail(admin, {
    email,
    origin,
    metadata,
  })

  if (error) return { error }

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

export async function resendInviteMember(
  memberId: string
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

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

  if (member.role !== 'member') {
    return { error: 'Só é possível reenviar convite para colaboradores.' }
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(memberId)
  if (authError || !authUser.user.email) {
    return { error: 'Não foi possível localizar o e-mail do convidado.' }
  }

  const origin = await getAuthRedirectOrigin()
  const email = authUser.user.email
  const fullName = member.full_name ?? (authUser.user.user_metadata?.full_name as string) ?? email.split('@')[0]

  const metadata: InviteMetadata = {
    organization_id: ctx.organizationId,
    full_name: fullName,
    role: 'member',
    invite_completed: false,
  }

  const { error } = await sendMemberInviteEmail(admin, {
    email,
    userId: memberId,
    origin,
    metadata,
  })

  if (error) return { error }

  await logFeedEvent(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    category: 'settings',
    eventType: 'member_invited',
    summary: `reenviou convite para ${fullName}`,
    entityType: 'profile',
    entityId: memberId,
    metadata: { email, full_name: fullName, role: 'member', resent: true },
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
