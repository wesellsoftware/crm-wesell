export const WEBHOOK_EVENTS = [
  { value: 'lead.created', label: 'Lead criado' },
  { value: 'lead.status_changed', label: 'Status do lead alterado' },
  { value: 'deal.won', label: 'Negociação ganha' },
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]['value']

export interface WebhookPayload {
  event: WebhookEvent
  organization_id: string
  timestamp: string
  data: Record<string, unknown>
}
