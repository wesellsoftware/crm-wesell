'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logFeedEvent } from '@/lib/feed/log-feed-event'

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione uma imagem válida.' }
  }
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    return { error: 'Formato não suportado. Use JPG, PNG, WebP ou GIF.' }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: 'A imagem deve ter no máximo 2 MB.' }
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/', 'layout')
  revalidatePath('/configuracoes')
  return { success: true, avatarUrl }
}

export async function updateProfile(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const fullName = formData.get('full_name') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  if (profile) {
    await logFeedEvent(supabase, {
      organizationId: profile.organization_id,
      userId: user.id,
      category: 'settings',
      eventType: 'profile_updated',
      summary: `atualizou o perfil para ${fullName}`,
      entityType: 'profile',
      entityId: user.id,
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateOrg(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return { error: 'Apenas administradores podem editar a organização.' }

  const orgName = formData.get('name') as string

  const { error } = await supabase
    .from('organizations')
    .update({ name: orgName })
    .eq('id', profile.organization_id)

  if (error) return { error: error.message }

  await logFeedEvent(supabase, {
    organizationId: profile.organization_id,
    userId: user.id,
    category: 'settings',
    eventType: 'org_updated',
    summary: `atualizou a organização para ${orgName}`,
    entityType: 'organization',
    entityId: profile.organization_id,
  })

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function createStage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return { error: 'Apenas administradores podem criar etapas.' }

  const { data: lastStage } = await supabase
    .from('stages')
    .select('position')
    .eq('organization_id', profile.organization_id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const stageName = formData.get('name') as string

  const { data: stage, error } = await supabase.from('stages').insert({
    organization_id: profile.organization_id,
    name: stageName,
    color: formData.get('color') as string || '#4342F5',
    position: (lastStage?.position ?? 0) + 1,
  }).select('id').single()

  if (error) return { error: error.message }

  await logFeedEvent(supabase, {
    organizationId: profile.organization_id,
    userId: user.id,
    category: 'settings',
    eventType: 'stage_created',
    summary: `criou etapa ${stageName} no funil`,
    entityType: 'stage',
    entityId: stage?.id,
  })

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  revalidatePath('/atividades')
  return { success: true }
}

export async function updateStage(stageId: string, name: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: stage } = await supabase
    .from('stages')
    .select('organization_id, name')
    .eq('id', stageId)
    .single()

  const { error } = await supabase
    .from('stages')
    .update({ name, color })
    .eq('id', stageId)
  if (error) return { error: error.message }

  if (stage && user) {
    await logFeedEvent(supabase, {
      organizationId: stage.organization_id,
      userId: user.id,
      category: 'settings',
      eventType: 'stage_updated',
      summary: `atualizou etapa ${stage.name} para ${name}`,
      entityType: 'stage',
      entityId: stageId,
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  revalidatePath('/atividades')
  return { success: true }
}

export async function reorderStages(stageIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    : { data: null }

  await Promise.all(
    stageIds.map((id, index) =>
      supabase.from('stages').update({ position: index }).eq('id', id)
    )
  )

  if (profile && user) {
    await logFeedEvent(supabase, {
      organizationId: profile.organization_id,
      userId: user.id,
      category: 'settings',
      eventType: 'stage_reordered',
      summary: 'reordenou as etapas do funil',
      entityType: 'stage',
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  revalidatePath('/atividades')
}

const DEFAULT_STAGES = [
  { name: 'Novo Lead',                  color: '#4342F5' },
  { name: 'Primeiro Contato',           color: '#45D4F4' },
  { name: 'Reunião Agendada',           color: '#D7FE65' },
  { name: 'Apresentação de Proposta',   color: '#7845F4' },
  { name: 'Negociação',                 color: '#F4A545' },
  { name: 'Fechamento',                 color: '#45F47F' },
  { name: 'Perdido',                    color: '#F44545' },
]

export async function seedDefaultStages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') return { error: 'Apenas administradores podem criar etapas.' }

  const rows = DEFAULT_STAGES.map((s, i) => ({
    organization_id: profile.organization_id,
    name: s.name,
    color: s.color,
    position: i,
  }))

  const { error } = await supabase.from('stages').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return { success: true }
}

export async function deleteStage(stageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: stage } = await supabase
    .from('stages')
    .select('organization_id, name')
    .eq('id', stageId)
    .single()

  await supabase.from('stages').delete().eq('id', stageId)

  if (stage && user) {
    await logFeedEvent(supabase, {
      organizationId: stage.organization_id,
      userId: user.id,
      category: 'settings',
      eventType: 'stage_deleted',
      summary: `excluiu etapa ${stage.name} do funil`,
      entityType: 'stage',
      entityId: stageId,
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  revalidatePath('/atividades')
}
