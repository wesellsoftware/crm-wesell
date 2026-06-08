'use client'

import { useActionState, useState, useTransition } from 'react'
import { createWebhook, deleteWebhook, ensureLeadFormColumns, toggleWebhook } from '@/app/actions/webhooks'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/types'
import { Check, Copy, Link2, Plus, Trash2 } from 'lucide-react'

interface WebhookRow {
  id: string
  event: string
  url: string
  is_active: boolean
  created_at: string
}

interface WebhooksManagerProps {
  webhooks: WebhookRow[]
  isAdmin: boolean
  apiEndpoint: string
}

const inputCls = `
  w-full h-10 px-3 rounded-[8px]
  glass-input text-we-paper/80 placeholder:text-we-paper/30
  font-body text-sm
  focus:outline-none focus:ring-2 focus:ring-we-blue/50
`

const selectCls = `
  w-full h-10 px-3 rounded-[8px]
  glass-input text-we-paper/80
  font-body text-sm
  focus:outline-none focus:ring-2 focus:ring-we-blue/50
`

function eventLabel(event: string) {
  return WEBHOOK_EVENTS.find((item) => item.value === event)?.label ?? event
}

export function WebhooksManager({ webhooks, isAdmin, apiEndpoint }: WebhooksManagerProps) {
  const [createState, createAction, createPending] = useActionState(createWebhook, undefined)
  const [columnsPending, startColumns] = useTransition()
  const [copied, setCopied] = useState(false)

  async function copyEndpoint() {
    await navigator.clipboard.writeText(apiEndpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-we-paper/55">
          <Link2 size={16} />
          <h3 className="font-body text-sm font-semibold">Endpoint do formulário</h3>
        </div>
        <p className="font-body text-xs text-we-paper/35">
          Use este endpoint no seu site para criar leads diretamente no CRM.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-[8px] bg-black/20 px-3 py-2 font-mono text-xs text-we-paper/70 break-all">
            POST {apiEndpoint}
          </code>
          <button
            type="button"
            onClick={copyEndpoint}
            className="h-9 px-3 rounded-[8px] bg-white/[0.06] text-we-paper/60 hover:text-we-paper/80 transition-colors"
            title="Copiar endpoint"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="rounded-[8px] bg-black/20 px-3 py-2 space-y-1">
          <p className="font-body text-xs text-we-paper/45">Autenticação:</p>
          <code className="font-mono text-[11px] text-we-paper/60">x-api-key: sua-chave-secreta</code>
        </div>
        {isAdmin && (
          <button
            type="button"
            disabled={columnsPending}
            onClick={() => startColumns(async () => { await ensureLeadFormColumns() })}
            className="h-9 px-4 rounded-[8px] bg-white/[0.06] text-we-paper/60 hover:text-we-paper/80 font-body text-xs transition-colors disabled:opacity-60"
          >
            {columnsPending ? 'Sincronizando colunas…' : 'Sincronizar colunas do formulário no board Leads'}
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-4 border-t border-white/[0.06] pt-6">
          <div>
            <h3 className="font-body text-sm font-semibold text-we-paper/55">Webhooks n8n</h3>
            <p className="font-body text-xs text-we-paper/35 mt-1">
              O CRM dispara estes webhooks automaticamente quando eventos acontecem.
            </p>
          </div>

          <form action={createAction} className="space-y-3">
            {createState?.error && (
              <p className="font-body text-sm text-we-red">{createState.error}</p>
            )}
            {createState?.success && (
              <div className="flex items-center gap-2 text-we-green">
                <Check size={14} />
                <p className="font-body text-sm">Webhook adicionado!</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
              <select name="event" required className={selectCls} defaultValue="lead.created">
                {WEBHOOK_EVENTS.map((event) => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
              <input
                name="url"
                type="url"
                required
                placeholder="https://n8n.wesellsoftware.com.br/webhook/..."
                className={inputCls}
              />
              <button
                type="submit"
                disabled={createPending}
                className="h-10 px-4 rounded-[8px] bg-we-blue text-white font-body text-sm font-semibold hover:bg-we-blue-deep disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                {createPending ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {webhooks.length === 0 ? (
              <p className="font-body text-sm text-we-paper/35">
                Nenhum webhook configurado. Adicione a URL do seu fluxo n8n acima.
              </p>
            ) : (
              webhooks.map((webhook) => (
                <WebhookRowItem key={webhook.id} webhook={webhook} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WebhookRowItem({ webhook }: { webhook: WebhookRow }) {
  const [, startToggle] = useTransition()
  const [, startDelete] = useTransition()

  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-black/15 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="font-body text-xs text-we-blue">{eventLabel(webhook.event)}</p>
        <p className="font-mono text-[11px] text-we-paper/50 truncate">{webhook.url}</p>
      </div>
      <label className="flex items-center gap-2 shrink-0">
        <input
          type="checkbox"
          checked={webhook.is_active}
          onChange={(event) => {
            startToggle(async () => {
              await toggleWebhook(webhook.id, event.target.checked)
            })
          }}
          className="accent-we-blue"
        />
        <span className="font-body text-xs text-we-paper/40">Ativo</span>
      </label>
      <button
        type="button"
        onClick={() => startDelete(async () => { await deleteWebhook(webhook.id) })}
        className="text-we-paper/30 hover:text-we-red transition-colors"
        title="Remover webhook"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}