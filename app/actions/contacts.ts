'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createContact(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const phone = formData.get('phone') as string
  const company = formData.get('company') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('contacts').insert({
    organization_id: profile.organization_id,
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: phone || null,
    company: company || null,
    notes: notes || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/contatos')
  return { success: true }
}

export async function updateContact(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const phone = formData.get('phone') as string
  const company = formData.get('company') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('contacts').update({
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: phone || null,
    company: company || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/contatos')
  revalidatePath(`/contatos/${id}`)
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  await supabase.from('contacts').delete().eq('id', id)
  revalidatePath('/contatos')
  redirect('/contatos')
}
