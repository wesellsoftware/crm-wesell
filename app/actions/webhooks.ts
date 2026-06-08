'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logFeedEvent } from '@/lib/feed/log-feed-event'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/types'

async function getAdminContext(): Promise<
  | { error: string }
  | { supabase: Awaited<ReturnType<typeof createClient>>; organizationId: string; userId: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Apenas administradores podem gerenciar webhooks.' as const }
  }

  return { supabase, organizationId: profile.organization_id, userId: user.id }
}

function isValidWebhookUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function webhookEventLabel(event: string) {
  return WEBHOOK_EVENTS.find(item => item.value === event)?.label ?? event
}

export async function createWebhook(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  const event = formData.get('event') as string
  const url = (formData.get('url') as string)?.trim()

  if (!WEBHOOK_EVENTS.some((item) => item.value === event)) {
    return { error: 'Evento inválido.' }
  }

  if (!url || !isValidWebhookUrl(url)) {
    return { error: 'Informe uma URL válida (http ou https).' }
  }

  const { data: webhook, error } = await ctx.supabase.from('organization_webhooks').insert({
    organization_id: ctx.organizationId,
    event,
    url,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este webhook já está cadastrado.' }
    }
    return { error: error.message }
  }

  await logFeedEvent(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    category: 'settings',
    eventType: 'webhook_created',
    summary: `cadastrou webhook ${webhookEventLabel(event)} → ${url}`,
    entityType: 'webhook',
    entityId: webhook?.id,
    metadata: { event, url },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function toggleWebhook(
  webhookId: string,
  isActive: boolean
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  const { data: webhook } = await ctx.supabase
    .from('organization_webhooks')
    .select('event, url')
    .eq('id', webhookId)
    .eq('organization_id', ctx.organizationId)
    .single()

  const { error } = await ctx.supabase
    .from('organization_webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  if (webhook) {
    await logFeedEvent(ctx.supabase, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      category: 'settings',
      eventType: 'webhook_toggled',
      summary: `${isActive ? 'ativou' : 'desativou'} webhook ${webhookEventLabel(webhook.event)} → ${webhook.url}`,
      entityType: 'webhook',
      entityId: webhookId,
      metadata: { event: webhook.event, url: webhook.url, is_active: isActive },
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function deleteWebhook(
  webhookId: string
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  const { data: webhook } = await ctx.supabase
    .from('organization_webhooks')
    .select('event, url')
    .eq('id', webhookId)
    .eq('organization_id', ctx.organizationId)
    .single()

  const { error } = await ctx.supabase
    .from('organization_webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  if (webhook) {
    await logFeedEvent(ctx.supabase, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      category: 'settings',
      eventType: 'webhook_deleted',
      summary: `removeu webhook ${webhookEventLabel(webhook.event)} → ${webhook.url}`,
      entityType: 'webhook',
      entityId: webhookId,
      metadata: { event: webhook.event, url: webhook.url },
    })
  }

  revalidatePath('/configuracoes')
  revalidatePath('/atividades')
  return { success: true }
}

export async function ensureLeadFormColumns(): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if ('error' in ctx) return ctx

  const { error } = await ctx.supabase.rpc('ensure_lead_form_columns', {
    p_org_id: ctx.organizationId,
  })

  if (error) return { error: error.message }
  revalidatePath('/boards/leads')
  return { success: true }
}
