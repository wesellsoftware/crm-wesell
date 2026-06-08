'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logFeedEvent } from '@/lib/feed/log-feed-event'

const TASK_TYPE_LABELS: Record<string, string> = {
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  task: 'Tarefa',
  note: 'Nota',
}

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
  const type = formData.get('type') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null

  const { data: activity, error } = await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    type,
    title,
    description,
    due_at: dueAt || null,
    deal_id: dealId || null,
    contact_id: contactId || null,
  }).select('id').single()

  if (error) return { error: error.message }

  await logFeedEvent(supabase, {
    organizationId: profile.organization_id,
    userId: user.id,
    category: 'task',
    eventType: 'task_created',
    summary: `criou tarefa ${title}`,
    body: description,
    entityType: 'activity',
    entityId: activity?.id,
    metadata: {
      task_type: type,
      task_type_label: TASK_TYPE_LABELS[type] ?? type,
      deal_id: dealId || null,
      contact_id: contactId || null,
    },
  })

  revalidatePath('/atividades')
  return { success: true }
}

export async function completeActivity(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, type, organization_id')
    .eq('id', id)
    .single()

  await supabase.from('activities')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)

  if (activity) {
    await logFeedEvent(supabase, {
      organizationId: activity.organization_id,
      userId: user.id,
      category: 'task',
      eventType: 'task_completed',
      summary: `concluiu tarefa ${activity.title}`,
      entityType: 'activity',
      entityId: activity.id,
      metadata: {
        task_type: activity.type,
        task_type_label: TASK_TYPE_LABELS[activity.type] ?? activity.type,
      },
    })
  }

  revalidatePath('/atividades')
}

export async function uncompleteActivity(id: string) {
  const supabase = await createClient()
  await supabase.from('activities')
    .update({ completed_at: null })
    .eq('id', id)
  revalidatePath('/atividades')
}
