'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: formData.get('full_name') as string })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
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

  const { error } = await supabase
    .from('organizations')
    .update({ name: formData.get('name') as string })
    .eq('id', profile.organization_id)

  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
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

  const { error } = await supabase.from('stages').insert({
    organization_id: profile.organization_id,
    name: formData.get('name') as string,
    color: formData.get('color') as string || '#4342F5',
    position: (lastStage?.position ?? 0) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return { success: true }
}

export async function updateStage(stageId: string, name: string, color: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stages')
    .update({ name, color })
    .eq('id', stageId)
  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return { success: true }
}

export async function reorderStages(stageIds: string[]) {
  const supabase = await createClient()
  await Promise.all(
    stageIds.map((id, index) =>
      supabase.from('stages').update({ position: index }).eq('id', id)
    )
  )
  revalidatePath('/configuracoes')
  revalidatePath('/funil')
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
  await supabase.from('stages').delete().eq('id', stageId)
  revalidatePath('/configuracoes')
  revalidatePath('/funil')
}
