import type { FinPaymentMethod } from './payment-methods'

export type FinTransactionType = 'receita' | 'despesa'
export type FinNature = 'recorrente' | 'pontual' | 'parcelado'
export type { FinPaymentMethod } from './payment-methods'

export type FinAccount = {
  id: string
  name: string
  balance_initial: number
  created_at: string
}

export type DreLine = 'receita_bruta' | 'deducoes' | 'custo_direto' | 'despesa_fixa'

export type FinCategory = {
  id: string
  name: string
  type: FinTransactionType
  dre_line: DreLine | null
  parent_id: string | null
  created_at: string
}

export type DreCategoryBreakdown = {
  category_id: string | null
  category_name: string
  amount: number
}

export type DreSection = {
  line: DreLine
  label: string
  total: number
  breakdown: DreCategoryBreakdown[]
}

export type DreData = {
  period: string
  regime: 'caixa' | 'competencia'
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custosDiretos: number
  margemContribuicao: number
  despesasFixas: number
  resultado: number
  sections: DreSection[]
}

export type FinRecurrence = {
  id: string
  description: string
  amount: number
  type: FinTransactionType
  category_id: string | null
  client_id: string | null
  project_id: string | null
  day_of_month: number
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FinTransaction = {
  id: string
  type: FinTransactionType
  nature: FinNature
  description: string
  amount: number
  is_international_purchase?: boolean
  iof_amount?: number | null
  due_date: string
  paid_date: string | null
  account_id: string | null
  category_id: string | null
  client_id: string | null
  project_id: string | null
  recurrence_id: string | null
  installment_group_id: string | null
  installment_number: number | null
  installment_count: number | null
  payment_method: FinPaymentMethod | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export function getTransactionEffectiveAmount(
  t: Pick<FinTransaction, 'type' | 'amount' | 'iof_amount'>,
): number {
  const iof = t.type === 'despesa' ? (t.iof_amount ?? 0) : 0
  return t.amount + iof
}

export type FinTransactionRow = FinTransaction & {
  category: Pick<FinCategory, 'id' | 'name' | 'type'> | null
  client_name: string | null
}

export type CashProjectionPoint = {
  period: string
  label: string
  ganhos: number
  despesas: number
  isProjected: boolean
}

export type FinDashboardData = {
  balance: number
  monthRevenue: number
  monthExpense: number
  monthResult: number
  mrr: number
  avgTicketPerClient: number
  revenueBreakdown: { recorrente: number; pontual: number }
  revenueByCategory: DreCategoryBreakdown[]
  cashProjection: CashProjectionPoint[]
  scorecards: DashboardScorecards
  period: string
}

export type SelectOption = {
  id: string
  name: string
}

export type FinTransactionFilters = {
  type: FinTransactionType
  status?: 'todos' | 'pendente' | 'atrasado' | 'pago'
  period?: string
  categoryId?: string
  search?: string
}

export type FinAlertItem = {
  id: string
  description: string
  amount: number
  due_date: string
  client_name: string | null
}

export type FinInadimplenteClient = {
  client_id: string
  client_name: string
  total_overdue: number
  count: number
}

export type FinAlertsData = {
  overdueReceivables: { items: FinAlertItem[]; total: number; totalAmount: number }
  upcomingPayables: { items: FinAlertItem[]; total: number; totalAmount: number }
  inadimplentes: { clients: FinInadimplenteClient[]; total: number }
}

// ─── Scorecards ──────────────────────────────────────────────────────────────

export type MetricComparisonBase = 'prev' | 'avg3' | 'yoy'

export type MonthlyMetrics = {
  period: string   // YYYY-MM
  receita: number
  despesa: number
  mrr: number
  resultado: number
  clientes: number
  ticket: number
}

export type ScorecardItem = {
  value: number
  delta: number | null       // percentage vs chosen comparison base
  compareValue: number | null // actual value being compared against
  series: number[]            // historical values oldest→newest (without current)
  higherIsBetter: boolean
}

export type DashboardScorecards = {
  saldo: ScorecardItem
  receita: ScorecardItem
  despesa: ScorecardItem
  resultado: ScorecardItem
  mrr: ScorecardItem
  ticket: ScorecardItem
}

// ─── Growth ──────────────────────────────────────────────────────────────────

export type GrowthWindow = '6m' | '12m' | 'ytd' | 'all'

export type GrowthPoint = {
  period: string
  faturamento: number
  mom: number | null    // % MoM
  avg3m: number | null  // 3-month moving average
}

export type GrowthKpiContext = {
  currentAmount: number
  baseAmount: number
  currentPeriod: string
  basePeriod: string
}

export type FinGrowthData = {
  series: GrowthPoint[]
  currentMoM: number | null
  currentQoQ: number | null
  currentYoY: number | null
  cagr: number | null
  acumulado: number
  momContext: GrowthKpiContext | null
  cagrContext: GrowthKpiContext | null
  cagrMonthsRemaining: number | null
}

// ─── Metas ───────────────────────────────────────────────────────────────────

export type FinMetaFaturamento = {
  id: string
  tipo_cohort: 'mensal' | 'trimestral' | 'anual'
  periodo: string
  valor_meta: number
  created_at: string
  updated_at: string
}

export type FinMetaPacingStatus = 'futuro' | 'ativo_no_ritmo' | 'ativo_atrasado' | 'concluido'

export type FinMetaAtingimento = FinMetaFaturamento & {
  realizado: number
  atingimento_pct: number
  elapsed_pct: number | null   // how far into the period we are (0–100)
  prorated_meta: number | null // valor_meta * elapsed_pct / 100
  pacing_status: FinMetaPacingStatus
}
