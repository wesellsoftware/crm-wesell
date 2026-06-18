import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  DreCategoryBreakdown,
  DreLine,
  DreData,
  DreSection,
  FinAlertItem,
  FinAlertsData,
  FinCategory,
  FinDashboardData,
  FinInadimplenteClient,
  FinTransaction,
  FinTransactionFilters,
  FinTransactionRow,
  CashProjectionPoint,
  SelectOption,
  MetricComparisonBase,
  MonthlyMetrics,
  DashboardScorecards,
  ScorecardItem,
  GrowthWindow,
  FinGrowthData,
  GrowthPoint,
  GrowthKpiContext,
  FinMetaFaturamento,
  FinMetaAtingimento,
  FinMetaPacingStatus,
} from './types'
import { getTransactionEffectiveAmount } from './types'
import { getOrgContext } from '@/lib/boards/org-context'
import { DEFAULT_BANK_NAME, FIN_BANK_NAMES } from './banks'

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function monthStart(d: Date): string {
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1))
}

function monthEnd(d: Date): string {
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

function computeCashProjection(transactions: FinTransaction[]): CashProjectionPoint[] {
  const now = new Date()
  const currentMonthStart = monthStart(now)
  const points: CashProjectionPoint[] = []

  for (let offset = -6; offset <= 6; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const start = toDateStr(d)
    const end = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const isProjected = start >= currentMonthStart

    const inMonth = transactions.filter(t => t.due_date >= start && t.due_date <= end)

    const ganhos = inMonth
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0)

    const despesas = inMonth
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + getTransactionEffectiveAmount(t), 0)

    points.push({ period, label, ganhos, despesas, isProjected })
  }

  return points
}

// ─── Monthly metrics helpers ──────────────────────────────────────────────────

function computeMonthlyMetrics(transactions: FinTransaction[], months: number): MonthlyMetrics[] {
  const now = new Date()
  const result: MonthlyMetrics[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const start = toDateStr(d)
    const end = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))

    const monthPaid = transactions.filter(t => t.paid_date && t.paid_date >= start && t.paid_date <= end)

    const receita = monthPaid.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    const despesa = monthPaid.filter(t => t.type === 'despesa').reduce((acc, t) => acc + getTransactionEffectiveAmount(t), 0)
    const mrr = monthPaid.filter(t => t.type === 'receita' && t.nature === 'recorrente').reduce((acc, t) => acc + Number(t.amount), 0)
    const clientIds = new Set(monthPaid.filter(t => t.type === 'receita' && t.client_id).map(t => t.client_id!))
    const clientes = clientIds.size

    result.push({
      period,
      receita,
      despesa,
      mrr,
      resultado: receita - despesa,
      clientes,
      ticket: clientes > 0 ? receita / clientes : 0,
    })
  }

  return result
}

function computeDelta(current: number, history: number[], base: MetricComparisonBase): number | null {
  if (base === 'prev') {
    const prev = history[history.length - 1]
    if (prev === undefined || prev === 0) return null
    return ((current - prev) / prev) * 100
  }
  if (base === 'avg3') {
    const last3 = history.slice(-3).filter(v => v !== 0)
    if (!last3.length) return null
    const avg = last3.reduce((a, b) => a + b, 0) / last3.length
    return ((current - avg) / avg) * 100
  }
  if (base === 'yoy') {
    if (history.length < 12) return null
    const yoy = history[history.length - 12]
    if (!yoy) return null
    return ((current - yoy) / yoy) * 100
  }
  return null
}

function computeCompareValue(history: number[], base: MetricComparisonBase): number | null {
  if (base === 'prev') {
    const v = history[history.length - 1]
    return v !== undefined ? v : null
  }
  if (base === 'avg3') {
    const last3 = history.slice(-3).filter(v => v > 0)
    if (!last3.length) return null
    return last3.reduce((a, b) => a + b, 0) / last3.length
  }
  if (base === 'yoy') {
    if (history.length < 12) return null
    const v = history[history.length - 12]
    return v !== undefined ? v : null
  }
  return null
}

function scorecard(
  value: number,
  history: number[],
  compare: MetricComparisonBase,
  higherIsBetter: boolean,
): ScorecardItem {
  return {
    value,
    delta: computeDelta(value, history, compare),
    compareValue: computeCompareValue(history, compare),
    series: history.slice(-12),
    higherIsBetter,
  }
}

// ─── Cohort helpers (used by metas) ──────────────────────────────────────────

function matchesCohort(date: string, tipo: FinMetaFaturamento['tipo_cohort'], periodo: string): boolean {
  const month = date.substring(0, 7)
  if (tipo === 'mensal') return month === periodo
  if (tipo === 'trimestral') {
    const m = periodo.match(/^(\d{4})-Q(\d)$/)
    if (!m) return false
    const year = Number(m[1])
    const q = Number(m[2])
    const [y, mo] = month.split('-').map(Number)
    return y === year && Math.ceil(mo / 3) === q
  }
  if (tipo === 'anual') return month.startsWith(periodo + '-')
  return false
}

function cohortBounds(tipo: FinMetaFaturamento['tipo_cohort'], periodo: string): { start: string; end: string } | null {
  if (tipo === 'mensal') {
    const [y, mo] = periodo.split('-').map(Number)
    return {
      start: toDateStr(new Date(y, mo - 1, 1)),
      end: toDateStr(new Date(y, mo, 0)),
    }
  }
  if (tipo === 'trimestral') {
    const m = periodo.match(/^(\d{4})-Q(\d)$/)
    if (!m) return null
    const year = Number(m[1])
    const q = Number(m[2])
    const startMonth = (q - 1) * 3
    return {
      start: toDateStr(new Date(year, startMonth, 1)),
      end: toDateStr(new Date(year, startMonth + 3, 0)),
    }
  }
  if (tipo === 'anual') {
    const year = Number(periodo)
    return { start: `${year}-01-01`, end: `${year}-12-31` }
  }
  return null
}

export async function getFinDashboardData(compare: MetricComparisonBase = 'avg3'): Promise<FinDashboardData> {
  noStore()
  const supabase = await createClient()

  const today = new Date()
  const ms = monthStart(today)
  const me = monthEnd(today)

  const [{ data: txRaw }, { data: account }, { data: categoriesRaw }] = await Promise.all([
    supabase.from('fin_transactions').select('*').is('deleted_at', null),
    supabase.from('fin_accounts').select('balance_initial').limit(1).single(),
    supabase.from('fin_categories').select('id, name').eq('type', 'receita'),
  ])

  const transactions: FinTransaction[] = txRaw ?? []
  const initialBalance = account?.balance_initial ?? 0

  const paid = transactions.filter(t => t.paid_date !== null)

  const balance = paid.reduce((acc, t) => {
    const value = getTransactionEffectiveAmount(t)
    return acc + (t.type === 'receita' ? value : -value)
  }, initialBalance)

  const thisMonthPaid = paid.filter(t => t.paid_date! >= ms && t.paid_date! <= me)

  const monthRevenue = thisMonthPaid
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0)

  const monthExpense = thisMonthPaid
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + getTransactionEffectiveAmount(t), 0)

  const mrr = thisMonthPaid
    .filter(t => t.type === 'receita' && t.nature === 'recorrente')
    .reduce((acc, t) => acc + t.amount, 0)

  const revenueThisMonth = thisMonthPaid.filter(t => t.type === 'receita')
  const distinctClients = new Set(
    revenueThisMonth.filter(t => t.client_id).map(t => t.client_id),
  ).size
  const avgTicketPerClient = distinctClients > 0 ? monthRevenue / distinctClients : 0

  const recorrente = thisMonthPaid
    .filter(t => t.type === 'receita' && t.nature === 'recorrente')
    .reduce((acc, t) => acc + t.amount, 0)
  const pontual = thisMonthPaid
    .filter(t => t.type === 'receita' && t.nature === 'pontual')
    .reduce((acc, t) => acc + t.amount, 0)

  const categoryNames = new Map((categoriesRaw ?? []).map(c => [c.id, c.name]))
  const revenueByCategoryMap = new Map<string, DreCategoryBreakdown>()
  for (const t of revenueThisMonth) {
    const categoryId = t.category_id
    const key = categoryId ?? '__none__'
    const categoryName = categoryId ? (categoryNames.get(categoryId) ?? 'Sem categoria') : 'Sem categoria'
    const existing = revenueByCategoryMap.get(key)
    if (existing) {
      existing.amount += t.amount
    } else {
      revenueByCategoryMap.set(key, { category_id: categoryId, category_name: categoryName, amount: t.amount })
    }
  }
  const revenueByCategory = [...revenueByCategoryMap.values()].sort((a, b) => b.amount - a.amount)

  // 13-month series for sparklines / deltas (from already-fetched data)
  const series = computeMonthlyMetrics(transactions, 13)
  const history = series.slice(0, -1) // all but current month

  const scorecards: DashboardScorecards = {
    saldo: {
      value: balance,
      delta: null,
      compareValue: null,
      series: history.map(m => m.resultado),
      higherIsBetter: true,
    },
    receita: scorecard(monthRevenue, history.map(m => m.receita), compare, true),
    despesa: scorecard(monthExpense, history.map(m => m.despesa), compare, false),
    resultado: scorecard(monthRevenue - monthExpense, history.map(m => m.resultado), compare, true),
    mrr: scorecard(mrr, history.map(m => m.mrr), compare, true),
    ticket: scorecard(avgTicketPerClient, history.map(m => m.ticket), compare, true),
  }

  return {
    balance,
    monthRevenue,
    monthExpense,
    monthResult: monthRevenue - monthExpense,
    mrr,
    avgTicketPerClient,
    revenueBreakdown: { recorrente, pontual },
    revenueByCategory,
    cashProjection: computeCashProjection(transactions),
    scorecards,
  }
}

export async function getFinTransactions(
  filters: FinTransactionFilters,
): Promise<FinTransactionRow[]> {
  noStore()
  const supabase = await createClient()

  let query = supabase
    .from('fin_transactions')
    .select('*, category:fin_categories(id, name, type)')
    .eq('type', filters.type)
    .is('deleted_at', null)
    .order('due_date', { ascending: false })

  if (filters.period && filters.period !== 'todos') {
    const [year, month] = filters.period.split('-').map(Number)
    const start = toDateStr(new Date(year, month - 1, 1))
    const end = toDateStr(new Date(year, month, 0))
    query = query.gte('due_date', start).lte('due_date', end)
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const { data } = await query

  let rows: FinTransactionRow[] = (data ?? []).map(row => ({
    ...row,
    category: row.category ?? null,
    client_name: null,
  }))

  // Filter by status in JS (derived from paid_date / due_date)
  if (filters.status && filters.status !== 'todos') {
    const todayStr = toDateStr(new Date())
    rows = rows.filter(t => {
      if (filters.status === 'pago') return t.paid_date !== null
      if (filters.status === 'atrasado') return t.paid_date === null && t.due_date < todayStr
      if (filters.status === 'pendente') return t.paid_date === null && t.due_date >= todayStr
      return true
    })
  }

  // Resolve client names via board_items
  const clientIds = [...new Set(rows.filter(r => r.client_id).map(r => r.client_id!))]
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('board_items')
      .select('id, name')
      .in('id', clientIds)

    const clientMap = new Map((clients ?? []).map(c => [c.id, c.name]))
    rows = rows.map(r => ({ ...r, client_name: r.client_id ? (clientMap.get(r.client_id) ?? null) : null }))
  }

  return rows
}

export async function getFinAccountsForSelect(): Promise<SelectOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fin_accounts')
    .select('id, name')
    .in('name', [...FIN_BANK_NAMES])

  const byName = new Map((data ?? []).map(account => [account.name, account]))
  return FIN_BANK_NAMES
    .map(name => byName.get(name))
    .filter((account): account is { id: string; name: string } => Boolean(account))
    .map(account => ({ id: account.id, name: account.name }))
}

export async function getDefaultBankAccountId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fin_accounts')
    .select('id')
    .eq('name', DEFAULT_BANK_NAME)
    .maybeSingle()

  return data?.id ?? null
}

export async function getFinCategories(): Promise<FinCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fin_categories')
    .select('*')
    .order('name')
  return data ?? []
}

export async function getFinClientsForSelect(): Promise<SelectOption[]> {
  const ctx = await getOrgContext()
  if (!ctx) return []

  const { supabase, organizationId } = ctx
  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'contas')
    .single()

  if (!board) return []

  const { data } = await supabase
    .from('board_items')
    .select('id, name')
    .eq('board_id', board.id)
    .is('deleted_at', null)
    .order('name')

  return (data ?? []).map(d => ({ id: d.id, name: d.name }))
}

export async function getFinProjectsForSelect(): Promise<SelectOption[]> {
  const ctx = await getOrgContext()
  if (!ctx) return []

  const { supabase, organizationId } = ctx
  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'negociacoes')
    .single()

  if (!board) return []

  const { data } = await supabase
    .from('board_items')
    .select('id, name')
    .eq('board_id', board.id)
    .is('deleted_at', null)
    .order('name')

  return (data ?? []).map(d => ({ id: d.id, name: d.name }))
}

export async function getFinAlertsData(): Promise<FinAlertsData> {
  noStore()
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)
  const future14Str = toDateStr(addDays(today, 14))
  const past7Str = toDateStr(addDays(today, -7))

  const [{ data: overdueRaw }, { data: upcomingRaw }, { data: inadimRaw }] = await Promise.all([
    supabase
      .from('fin_transactions')
      .select('id, description, amount, due_date, client_id')
      .eq('type', 'receita')
      .is('paid_date', null)
      .is('deleted_at', null)
      .lt('due_date', todayStr)
      .order('due_date', { ascending: true }),

    supabase
      .from('fin_transactions')
      .select('id, description, amount, due_date')
      .eq('type', 'despesa')
      .is('paid_date', null)
      .is('deleted_at', null)
      .gte('due_date', todayStr)
      .lte('due_date', future14Str)
      .order('due_date', { ascending: true }),

    supabase
      .from('fin_transactions')
      .select('client_id, amount')
      .eq('type', 'receita')
      .is('paid_date', null)
      .is('deleted_at', null)
      .lt('due_date', past7Str)
      .not('client_id', 'is', null),
  ])

  const clientIds = [
    ...new Set([
      ...(overdueRaw ?? []).filter(t => t.client_id).map(t => t.client_id as string),
      ...(inadimRaw ?? []).filter(t => t.client_id).map(t => t.client_id as string),
    ]),
  ]

  const clientMap = new Map<string, string>()
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('board_items')
      .select('id, name')
      .in('id', clientIds)
    ;(clients ?? []).forEach(c => clientMap.set(c.id, c.name))
  }

  const overdueAll = overdueRaw ?? []
  const upcomingAll = upcomingRaw ?? []

  const overdueItems: FinAlertItem[] = overdueAll.slice(0, 5).map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    due_date: t.due_date,
    client_name: t.client_id ? (clientMap.get(t.client_id) ?? null) : null,
  }))

  const upcomingItems: FinAlertItem[] = upcomingAll.slice(0, 5).map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    due_date: t.due_date,
    client_name: null,
  }))

  const inadimByClient = new Map<string, { total: number; count: number }>()
  ;(inadimRaw ?? []).forEach(t => {
    if (!t.client_id) return
    const prev = inadimByClient.get(t.client_id) ?? { total: 0, count: 0 }
    inadimByClient.set(t.client_id, { total: prev.total + Number(t.amount), count: prev.count + 1 })
  })

  const inadimClients: FinInadimplenteClient[] = [...inadimByClient.entries()]
    .map(([client_id, { total, count }]) => ({
      client_id,
      client_name: clientMap.get(client_id) ?? 'Cliente desconhecido',
      total_overdue: total,
      count,
    }))
    .sort((a, b) => b.total_overdue - a.total_overdue)

  return {
    overdueReceivables: {
      items: overdueItems,
      total: overdueAll.length,
      totalAmount: overdueAll.reduce((acc, t) => acc + Number(t.amount), 0),
    },
    upcomingPayables: {
      items: upcomingItems,
      total: upcomingAll.length,
      totalAmount: upcomingAll.reduce((acc, t) => acc + Number(t.amount), 0),
    },
    inadimplentes: {
      clients: inadimClients.slice(0, 5),
      total: inadimClients.length,
    },
  }
}

const DRE_LINE_LABELS: Record<DreLine, string> = {
  receita_bruta: 'Receita Bruta',
  deducoes: 'Deduções',
  custo_direto: 'Custos Diretos',
  despesa_fixa: 'Despesas Fixas',
}

export async function getFinDreData(
  period: string, // YYYY-MM
  regime: 'caixa' | 'competencia',
): Promise<DreData> {
  noStore()
  const supabase = await createClient()

  const [year, month] = period.split('-').map(Number)
  const start = toDateStr(new Date(year, month - 1, 1))
  const end = toDateStr(new Date(year, month, 0))

  // DRE is periodized by due_date (competência). Receitas always require paid status.
  // In "realizado" (caixa) mode, despesas must also be paid.
  let txQuery = supabase
    .from('fin_transactions')
    .select('type, amount, iof_amount, category_id, paid_date')
    .is('deleted_at', null)
    .gte('due_date', start)
    .lte('due_date', end)

  if (regime === 'caixa') {
    txQuery = txQuery.not('paid_date', 'is', null)
  }

  const [{ data: txRaw }, { data: categoriesRaw }] = await Promise.all([
    txQuery,
    supabase
      .from('fin_categories')
      .select('id, name, type, dre_line'),
  ])

  const transactions = txRaw ?? []
  const categoryMap = new Map(
    (categoriesRaw ?? []).map(c => [c.id, c]),
  )

  // Aggregate amounts by (dre_line, category_id, category_name)
  const buckets = new Map<string, { dre_line: DreLine | null; category_id: string | null; category_name: string; amount: number }>()

  for (const tx of transactions) {
    if (tx.type === 'receita' && !tx.paid_date) continue

    const cat = tx.category_id ? categoryMap.get(tx.category_id) : null
    const dreLine: DreLine | null = cat?.dre_line ?? (tx.type === 'receita' ? 'receita_bruta' : 'despesa_fixa')
    const catId = tx.category_id ?? null
    const catName = cat?.name ?? 'Sem categoria'
    const effectiveAmount = Number(tx.amount) + (tx.type === 'despesa' ? Number(tx.iof_amount ?? 0) : 0)

    const key = `${dreLine}::${catId ?? 'null'}`
    const prev = buckets.get(key)
    if (prev) {
      prev.amount += effectiveAmount
    } else {
      buckets.set(key, { dre_line: dreLine, category_id: catId, category_name: catName, amount: effectiveAmount })
    }
  }

  // Build sections for each dre_line
  const sectionMap = new Map<DreLine, DreCategoryBreakdown[]>()
  for (const { dre_line, category_id, category_name, amount } of buckets.values()) {
    if (!dre_line) continue
    const list = sectionMap.get(dre_line) ?? []
    list.push({ category_id, category_name, amount })
    sectionMap.set(dre_line, list)
  }

  const makeSection = (line: DreLine): DreSection => ({
    line,
    label: DRE_LINE_LABELS[line],
    total: (sectionMap.get(line) ?? []).reduce((acc, b) => acc + b.amount, 0),
    breakdown: (sectionMap.get(line) ?? []).sort((a, b) => b.amount - a.amount),
  })

  const sections: DreSection[] = [
    makeSection('receita_bruta'),
    makeSection('deducoes'),
    makeSection('custo_direto'),
    makeSection('despesa_fixa'),
  ]

  const receitaBruta = sections[0].total
  const deducoes = sections[1].total
  const receitaLiquida = receitaBruta - deducoes
  const custosDiretos = sections[2].total
  const margemContribuicao = receitaLiquida - custosDiretos
  const despesasFixas = sections[3].total
  const resultado = margemContribuicao - despesasFixas

  return {
    period,
    regime,
    receitaBruta,
    deducoes,
    receitaLiquida,
    custosDiretos,
    margemContribuicao,
    despesasFixas,
    resultado,
    sections,
  }
}

// ─── Growth ───────────────────────────────────────────────────────────────────

function shiftPeriod(period: string, deltaMonths: number): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, m - 1 + deltaMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildCalendarPeriods(start: string, end: string): string[] {
  const periods: string[] = []
  let current = start
  while (current <= end) {
    periods.push(current)
    current = shiftPeriod(current, 1)
  }
  return periods
}

const COMPANY_START_PERIOD = '2026-03'

function growthWindowPeriods(window: GrowthWindow, now: Date, earliestData?: string): string[] {
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let start: string
  if (window === '6m') {
    start = shiftPeriod(currentPeriod, -5)
  } else if (window === '12m') {
    start = shiftPeriod(currentPeriod, -11)
  } else if (window === 'ytd') {
    start = `${now.getFullYear()}-01`
  } else {
    start = earliestData ?? currentPeriod
  }

  if (start < COMPANY_START_PERIOD) start = COMPANY_START_PERIOD
  if (start > currentPeriod) return []

  return buildCalendarPeriods(start, currentPeriod)
}

const AVG3M_START_PERIOD = COMPANY_START_PERIOD
const CAGR_MIN_MONTHS = 12

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm)
}

function computeMomPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function buildGrowthSeries(byMonth: Map<string, number>, windowPeriods: string[]): GrowthPoint[] {
  return windowPeriods.map(period => {
    const faturamento = byMonth.get(period) ?? 0
    const prevPeriod = shiftPeriod(period, -1)

    let mom: number | null = null
    if (prevPeriod >= COMPANY_START_PERIOD) {
      const prevFat = byMonth.get(prevPeriod) ?? 0
      mom = computeMomPercent(faturamento, prevFat)
    }

    let avg3m: number | null = null
    if (period >= AVG3M_START_PERIOD) {
      const p1 = byMonth.get(shiftPeriod(period, -1)) ?? 0
      const p2 = byMonth.get(shiftPeriod(period, -2)) ?? 0
      avg3m = (faturamento + p1 + p2) / 3
    }

    return { period, faturamento, mom, avg3m }
  })
}

export async function getFinGrowthData(window: GrowthWindow = '12m'): Promise<FinGrowthData> {
  noStore()
  const supabase = await createClient()

  const { data } = await supabase
    .from('fin_transactions')
    .select('amount, due_date')
    .eq('type', 'receita')
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  const byMonth = new Map<string, number>()
  for (const tx of data ?? []) {
    const period = tx.due_date.substring(0, 7)
    if (period < COMPANY_START_PERIOD) continue
    byMonth.set(period, (byMonth.get(period) ?? 0) + Number(tx.amount))
  }

  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const earliestData = [...byMonth.keys()].sort()[0]
  const windowPeriods = growthWindowPeriods(window, now, earliestData)
  const series = buildGrowthSeries(byMonth, windowPeriods)

  const currFat = byMonth.get(currentPeriod) ?? 0
  const prevPeriod = shiftPeriod(currentPeriod, -1)
  const prevMonthFat = prevPeriod >= COMPANY_START_PERIOD ? (byMonth.get(prevPeriod) ?? 0) : 0
  const currentMoM = computeMomPercent(currFat, prevMonthFat)

  const momContext: GrowthKpiContext | null =
    prevPeriod >= COMPANY_START_PERIOD
      ? {
          currentAmount: currFat,
          baseAmount: prevMonthFat,
          currentPeriod,
          basePeriod: prevPeriod,
        }
      : null

  const currentQ = Math.ceil((now.getMonth() + 1) / 3)
  const sumQuarter = (q: number, y: number) =>
    [0, 1, 2].reduce((acc, offset) => {
      const mo = (q - 1) * 3 + 1 + offset
      const key = `${y}-${String(mo).padStart(2, '0')}`
      return acc + (byMonth.get(key) ?? 0)
    }, 0)

  const thisQTotal = sumQuarter(currentQ, now.getFullYear())
  const prevQ = currentQ === 1 ? 4 : currentQ - 1
  const prevQYear = currentQ === 1 ? now.getFullYear() - 1 : now.getFullYear()
  const prevQTotal = sumQuarter(prevQ, prevQYear)
  const currentQoQ = prevQTotal > 0 ? ((thisQTotal - prevQTotal) / prevQTotal) * 100 : null

  const sameLastYear = shiftPeriod(currentPeriod, -12)
  const lastYearFat = byMonth.get(sameLastYear) ?? 0
  const currentYoY = lastYearFat > 0 ? ((currFat - lastYearFat) / lastYearFat) * 100 : null

  const monthsSinceStart = monthsBetween(COMPANY_START_PERIOD, currentPeriod)
  const startFat = byMonth.get(COMPANY_START_PERIOD) ?? 0

  let cagr: number | null = null
  let cagrContext: GrowthKpiContext | null = null
  let cagrMonthsRemaining: number | null = null

  if (monthsSinceStart < CAGR_MIN_MONTHS) {
    cagrMonthsRemaining = CAGR_MIN_MONTHS - monthsSinceStart
  } else if (startFat > 0 && currFat > 0) {
    const years = monthsSinceStart / 12
    cagr = (Math.pow(currFat / startFat, 1 / years) - 1) * 100
    cagrContext = {
      currentAmount: currFat,
      baseAmount: startFat,
      currentPeriod,
      basePeriod: COMPANY_START_PERIOD,
    }
  }

  const acumulado = windowPeriods.reduce((acc, p) => acc + (byMonth.get(p) ?? 0), 0)

  return {
    series,
    currentMoM,
    currentQoQ,
    currentYoY,
    cagr,
    acumulado,
    momContext,
    cagrContext,
    cagrMonthsRemaining,
  }
}

// ─── Metas ────────────────────────────────────────────────────────────────────

export async function getFinMetas(): Promise<FinMetaFaturamento[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fin_metas_faturamento')
    .select('*')
    .order('periodo', { ascending: false })
  return (data ?? []).map(m => ({ ...m, valor_meta: Number(m.valor_meta) }))
}

export async function getFinMetaAtingimento(): Promise<FinMetaAtingimento[]> {
  noStore()
  const supabase = await createClient()

  const [{ data: metas }, { data: txRaw }] = await Promise.all([
    supabase.from('fin_metas_faturamento').select('*').order('periodo', { ascending: false }),
    supabase
      .from('fin_transactions')
      .select('amount, paid_date')
      .eq('type', 'receita')
      .is('deleted_at', null)
      .not('paid_date', 'is', null),
  ])

  const txs = (txRaw ?? []).map(t => ({ amount: Number(t.amount), paid_date: t.paid_date! }))
  const today = new Date()
  const todayStr = toDateStr(today)

  return (metas ?? []).map(meta => {
    const tipo = meta.tipo_cohort as FinMetaFaturamento['tipo_cohort']
    const realizado = txs.filter(t => matchesCohort(t.paid_date, tipo, meta.periodo)).reduce((acc, t) => acc + t.amount, 0)
    const valorMeta = Number(meta.valor_meta)
    const atingimento_pct = valorMeta > 0 ? (realizado / valorMeta) * 100 : 0

    const bounds = cohortBounds(tipo, meta.periodo)
    let elapsed_pct: number | null = null
    let prorated_meta: number | null = null
    let pacing_status: FinMetaPacingStatus = 'futuro'

    if (bounds) {
      if (todayStr < bounds.start) {
        pacing_status = 'futuro'
      } else if (todayStr > bounds.end) {
        pacing_status = 'concluido'
      } else {
        const start = new Date(bounds.start).getTime()
        const end = new Date(bounds.end).getTime()
        const now = today.getTime()
        elapsed_pct = Math.min(100, ((now - start) / (end - start)) * 100)
        prorated_meta = valorMeta * (elapsed_pct / 100)
        pacing_status = realizado >= prorated_meta ? 'ativo_no_ritmo' : 'ativo_atrasado'
      }
    }

    return {
      ...meta,
      valor_meta: valorMeta,
      realizado,
      atingimento_pct,
      elapsed_pct,
      prorated_meta,
      pacing_status,
    }
  })
}
