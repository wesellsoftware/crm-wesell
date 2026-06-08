'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createActivity(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const dueAt = formData.get('due_at') as string
  const dealId = formData.get('deal_id') as string
  const contactId = formData.get('contact_id') as string

  const { error } = await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    due_at: dueAt || null,
    deal_id: dealId || null,
    contact_id: contactId || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/atividades')
  return { success: true }
}

export async function completeActivity(id: string) {
  const supabase = await createClient()
  await supabase.from('activities')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/atividades')
}

export async function uncompleteActivity(id: string) {
  const supabase = await createClient()
  await supabase.from('activities')
    .update({ completed_at: null })
    .eq('id', id)
  revalidatePath('/atividades')
}
