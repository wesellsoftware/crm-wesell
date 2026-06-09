import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchWebhooks } from '@/lib/webhooks/dispatch'
import { logFeedEvent } from '@/lib/feed/log-feed-event'
import type { CellValue } from '@/lib/boards/types'

export interface ExternalLeadInput {
  nome: string
  email?: string
  whatsapp?: string
  cidade?: string
  empresa?: string
  segmento?: string
  servico?: string
  ideia_projeto?: string
  cargo?: string
  faturamento?: string
  colaboradores?: string
  origem?: string
}

interface BoardColumn {
  id: string
  name: string
  type: string
  settings: { options?: { id: string; label: string }[] }
}

const FIELD_TO_COLUMN: Record<keyof ExternalLeadInput, string> = {
  nome: 'Lead',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  cidade: 'Cidade',
  empresa: 'Empresa',
  segmento: 'Segmento',
  servico: 'Serviço',
  ideia_projeto: 'Ideia do Projeto',
  cargo: 'Cargo',
  faturamento: 'Faturamento',
  colaboradores: 'Colaboradores',
  origem: 'Origem',
}

function buildCellValue(column: BoardColumn, rawValue: string): CellValue | null {
  const value = rawValue.trim()
  if (!value) return null

  switch (column.type) {
    case 'email':
      return { value }
    case 'phone':
      return { value }
    case 'number':
      return { number: Number(value) || 0 }
    default:
      return { text: value }
  }
}

async function resolveOrganizationId(explicitOrgId?: string): Promise<string | null> {
  if (explicitOrgId) return explicitOrgId

  const supabase = createAdminClient()
  const { data } = await supabase.from('organizations').select('id').limit(1).maybeSingle()
  return data?.id ?? null
}

export type CreateExternalLeadResult =
  | { error: string }
  | { success: true; lead: { id: string; nome: string; created_at: string } }

export async function createExternalLead(
  input: ExternalLeadInput,
  options?: { organizationId?: string }
): Promise<CreateExternalLeadResult> {
  const nome = input.nome?.trim()
  if (!nome) {
    return { error: 'O campo "nome" é obrigatório.' }
  }

  const organizationId = await resolveOrganizationId(options?.organizationId)
  if (!organizationId) {
    return { error: 'Organização não configurada.' }
  }

  const supabase = createAdminClient()

  await supabase.rpc('ensure_lead_form_columns', { p_org_id: organizationId })

  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'leads')
    .single()

  if (!board) {
    return { error: 'Board de leads não encontrado.' }
  }

  const [{ data: group }, { data: columns }, { data: lastItem }] = await Promise.all([
    supabase
      .from('board_groups')
      .select('id')
      .eq('board_id', board.id)
      .order('position')
      .limit(1)
      .single(),
    supabase
      .from('board_columns')
      .select('id, name, type, settings')
      .eq('board_id', board.id),
    supabase
      .from('board_items')
      .select('position')
      .eq('board_id', board.id)
      .is('deleted_at', null)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!group) {
    return { error: 'Grupo de leads não encontrado.' }
  }

  const { data: item, error: itemError } = await supabase
    .from('board_items')
    .insert({
      board_id: board.id,
      group_id: group.id,
      name: nome,
      position: (lastItem?.position ?? -1) + 1,
      created_by: null,
    })
    .select('id, name, created_at')
    .single()

  if (itemError || !item) {
    return { error: itemError?.message ?? 'Erro ao criar lead.' }
  }

  const columnByName = new Map((columns ?? []).map((column) => [column.name, column as BoardColumn]))
  const valueRows: { item_id: string; column_id: string; value: CellValue }[] = []

  for (const [field, columnName] of Object.entries(FIELD_TO_COLUMN) as [keyof ExternalLeadInput, string][]) {
    if (field === 'nome') continue

    const rawValue = input[field]
    if (!rawValue?.trim()) continue

    const column = columnByName.get(columnName)
    if (!column) continue

    const cellValue = buildCellValue(column, rawValue)
    if (!cellValue) continue

    valueRows.push({
      item_id: item.id,
      column_id: column.id,
      value: cellValue,
    })
  }

  const statusColumn = columnByName.get('Status')
  if (statusColumn) {
    const defaultStatus = statusColumn.settings.options?.find(
      (option) => option.label.toLowerCase() === 'novo lead'
    )
    if (defaultStatus) {
      valueRows.push({
        item_id: item.id,
        column_id: statusColumn.id,
        value: { option_id: defaultStatus.id },
      })
    }
  }

  if (valueRows.length > 0) {
    const { error: valuesError } = await supabase.from('board_item_values').insert(valueRows)
    if (valuesError) {
      return { error: valuesError.message }
    }
  }

  const webhookData = {
    ...input,
    id: item.id,
    nome: item.name,
    created_at: item.created_at,
  }

  await dispatchWebhooks(organizationId, 'lead.created', webhookData)

  await logFeedEvent(supabase, {
    organizationId,
    userId: null,
    category: 'integration',
    eventType: 'lead_created_external',
    summary: `lead ${item.name} criado via formulário externo`,
    entityType: 'board_item',
    entityId: item.id,
    metadata: {
      board_slug: 'leads',
      board_name: 'Leads',
      item_name: item.name,
      origem: input.origem ?? null,
    },
  })

  return {
    success: true,
    lead: {
      id: item.id,
      nome: item.name,
      created_at: item.created_at,
    },
  }
}
