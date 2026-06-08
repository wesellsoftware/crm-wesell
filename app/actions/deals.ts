'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveDeal(dealId: string, stageId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deals')
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', dealId)
  if (error) return { error: error.message }
  revalidatePath('/funil')
  return { success: true }
}

export async function createDeal(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const contactId = formData.get('contact_id') as string
  const expectedCloseDate = formData.get('expected_close_date') as string

  const { error } = await supabase.from('deals').insert({
    organization_id: profile.organization_id,
    title: formData.get('title') as string,
    value: Number(formData.get('value') ?? 0),
    stage_id: formData.get('stage_id') as string,
    contact_id: contactId || null,
    owner_id: user.id,
    expected_close_date: expectedCloseDate || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/funil')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markDealWon(dealId: string) {
  const supabase = await createClient()
  await supabase.from('deals').update({ status: 'won', updated_at: new Date().toISOString() }).eq('id', dealId)
  revalidatePath('/funil')
  revalidatePath('/dashboard')
}

export async function markDealLost(dealId: string) {
  const supabase = await createClient()
  await supabase.from('deals').update({ status: 'lost', updated_at: new Date().toISOString() }).eq('id', dealId)
  revalidatePath('/funil')
  revalidatePath('/dashboard')
}
