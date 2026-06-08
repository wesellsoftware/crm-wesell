import { createAdminClient } from '@/lib/supabase/admin'
import type { WebhookEvent, WebhookPayload } from '@/lib/webhooks/types'

export async function dispatchWebhooks(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  const supabase = createAdminClient()

  const { data: webhooks, error } = await supabase
    .from('organization_webhooks')
    .select('id, url')
    .eq('organization_id', organizationId)
    .eq('event', event)
    .eq('is_active', true)

  if (error || !webhooks?.length) {
    return
  }

  const payload: WebhookPayload = {
    event,
    organization_id: organizationId,
    timestamp: new Date().toISOString(),
    data,
  }

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WeSell-CRM-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.error(
          `[webhook] ${event} → ${webhook.url} failed with status ${response.status}`
        )
      }
    })
  )
}
