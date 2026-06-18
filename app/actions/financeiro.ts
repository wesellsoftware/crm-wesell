'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_BANK_NAME } from '@/lib/financeiro/banks'
import {
  installmentsMatchTotal,
  parseInstallmentsJson,
  roundMoney,
} from '@/lib/financeiro/installments'
import { parsePaymentMethod } from '@/lib/financeiro/payment-methods'

function revalidate() {
  revalidatePath('/financeiro/dashboard')
  revalidatePath('/financeiro/lancamentos')
  revalidatePath('/financeiro/categorias')
}

function parseInternationalPurchaseFields(
  formData: FormData,
  type: string,
): { is_international_purchase: boolean; iof_amount: number | null } | { error: string } | null {
  if (type !== 'despesa') return null

  const isInternational = formData.get('is_international_purchase') === 'on'
  const iofRaw = (formData.get('iof_amount') as string)?.trim()

  if (!isInternational) {
    return { is_international_purchase: false, iof_amount: null }
  }

  if (!iofRaw) {
    return { error: 'Informe o valor do acréscimo de IOF.' }
  }

  const iofAmount = parseFloat(iofRaw.replace(',', '.'))
  if (isNaN(iofAmount) || iofAmount < 0) {
    return { error: 'Valor de IOF inválido.' }
  }

  return { is_international_purchase: true, iof_amount: iofAmount }
}

async function resolveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string | null,
) {
  if (accountId) return accountId

  const { data } = await supabase
    .from('fin_accounts')
    .select('id')
    .eq('name', DEFAULT_BANK_NAME)
    .maybeSingle()

  return data?.id ?? null
}

export async function createTransaction(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const amountRaw = formData.get('amount') as string
  const dueDate = formData.get('due_date') as string
  const paidDate = (formData.get('paid_date') as string) || null
  const categoryId = (formData.get('category_id') as string) || null
  const clientId = (formData.get('client_id') as string) || null
  const projectId = (formData.get('project_id') as string) || null
  const accountId = (formData.get('account_id') as string) || null
  const paymentMethod = parsePaymentMethod(formData.get('payment_method'))

  const amount = parseFloat(amountRaw.replace(',', '.'))
  if (!description || isNaN(amount) || amount <= 0 || !dueDate) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const international = parseInternationalPurchaseFields(formData, type)
  if (international && 'error' in international) return international

  const resolvedAccountId = await resolveAccountId(supabase, accountId)

  const { error } = await supabase.from('fin_transactions').insert({
    type,
    nature: 'pontual',
    description,
    amount,
    ...(international ?? {}),
    due_date: dueDate,
    paid_date: paidDate || null,
    account_id: resolvedAccountId,
    category_id: categoryId || null,
    client_id: clientId || null,
    project_id: projectId || null,
    payment_method: paymentMethod,
  })

  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function createInstallments(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const amountRaw = formData.get('amount') as string
  const dueDate = formData.get('due_date') as string
  const categoryId = (formData.get('category_id') as string) || null
  const clientId = (formData.get('client_id') as string) || null
  const projectId = (formData.get('project_id') as string) || null
  const accountId = (formData.get('account_id') as string) || null
  const installmentsRaw = formData.get('installments') as string
  const paymentMethod = parsePaymentMethod(formData.get('payment_method'))

  const totalAmount = parseFloat(amountRaw.replace(',', '.'))
  if (!description || isNaN(totalAmount) || totalAmount <= 0 || !dueDate) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const parsed = parseInstallmentsJson(installmentsRaw)
  if ('error' in parsed) return parsed

  const installmentCount = parsed.length
  if (!installmentsMatchTotal(parsed.map(i => i.amount), totalAmount)) {
    return { error: 'A soma das parcelas deve ser igual ao valor total do lançamento.' }
  }

  const international = parseInternationalPurchaseFields(formData, type)
  if (international && 'error' in international) return international

  const resolvedAccountId = await resolveAccountId(supabase, accountId)
  const groupId = randomUUID()

  const transactions = parsed.map(installment => ({
    type,
    nature: 'parcelado' as const,
    description: `${description} (${installment.number}/${installmentCount})`,
    amount: roundMoney(installment.amount),
    ...(international ?? {}),
    due_date: installment.due_date,
    paid_date: null,
    account_id: resolvedAccountId,
    category_id: categoryId || null,
    client_id: clientId || null,
    project_id: projectId || null,
    installment_group_id: groupId,
    installment_number: installment.number,
    installment_count: installmentCount,
    payment_method: paymentMethod,
  }))

  const { error } = await supabase.from('fin_transactions').insert(transactions)
  if (error) return { error: error.message }

  revalidate()
  return { success: true }
}

export async function createRecurrence(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const amountRaw = formData.get('amount') as string
  const dayOfMonth = parseInt(formData.get('day_of_month') as string)
  const startMonthRaw = formData.get('start_month') as string
  const categoryId = (formData.get('category_id') as string) || null
  const clientId = (formData.get('client_id') as string) || null
  const projectId = (formData.get('project_id') as string) || null
  const accountId = (formData.get('account_id') as string) || null
  const paymentMethod = parsePaymentMethod(formData.get('payment_method'))

  const amount = parseFloat(amountRaw.replace(',', '.'))
  if (!description || isNaN(amount) || amount <= 0 || !startMonthRaw || isNaN(dayOfMonth)) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const international = parseInternationalPurchaseFields(formData, type)
  if (international && 'error' in international) return international

  const resolvedAccountId = await resolveAccountId(supabase, accountId)

  const [startYear, startMonthNum] = startMonthRaw.split('-').map(Number)
  const startDate = `${startYear}-${String(startMonthNum).padStart(2, '0')}-01`

  // Insert recurrence rule
  const { data: recurrence, error: recErr } = await supabase
    .from('fin_recurrences')
    .insert({
      description,
      amount,
      type,
      category_id: categoryId || null,
      client_id: clientId || null,
      project_id: projectId || null,
      day_of_month: dayOfMonth,
      start_date: startDate,
      is_active: true,
    })
    .select('id')
    .single()

  if (recErr || !recurrence) return { error: recErr?.message ?? 'Erro ao criar recorrência.' }

  // Generate 12 months of transactions starting from startMonth
  const transactions = []
  for (let i = 0; i < 12; i++) {
    const year = startYear + Math.floor((startMonthNum - 1 + i) / 12)
    const month = ((startMonthNum - 1 + i) % 12) + 1
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`
    transactions.push({
      type,
      nature: 'recorrente' as const,
      description,
      amount,
      ...(international ?? {}),
      due_date: dueDate,
      paid_date: null,
      account_id: resolvedAccountId,
      category_id: categoryId || null,
      client_id: clientId || null,
      project_id: projectId || null,
      recurrence_id: recurrence.id,
      payment_method: paymentMethod,
    })
  }

  const { error: txErr } = await supabase.from('fin_transactions').insert(transactions)
  if (txErr) return { error: txErr.message }

  revalidate()
  return { success: true }
}

export async function updateTransaction(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const description = formData.get('description') as string
  const amountRaw = formData.get('amount') as string
  const dueDate = formData.get('due_date') as string
  const paidDate = (formData.get('paid_date') as string) || null
  const categoryId = (formData.get('category_id') as string) || null
  const clientId = (formData.get('client_id') as string) || null
  const projectId = (formData.get('project_id') as string) || null
  const accountId = (formData.get('account_id') as string) || null
  const paymentMethod = parsePaymentMethod(formData.get('payment_method'))

  const amount = parseFloat(amountRaw.replace(',', '.'))
  if (!id || !description || isNaN(amount) || amount <= 0 || !dueDate) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { data: existing } = await supabase
    .from('fin_transactions')
    .select('type')
    .eq('id', id)
    .single()

  const international = parseInternationalPurchaseFields(formData, existing?.type ?? 'despesa')
  if (international && 'error' in international) return international

  const resolvedAccountId = await resolveAccountId(supabase, accountId)

  const { error } = await supabase
    .from('fin_transactions')
    .update({
      description,
      amount,
      ...(international ?? {}),
      due_date: dueDate,
      paid_date: paidDate || null,
      account_id: resolvedAccountId,
      category_id: categoryId || null,
      client_id: clientId || null,
      project_id: projectId || null,
      payment_method: paymentMethod,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function markTransactionPaid(id: string, paidDate: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fin_transactions')
    .update({ paid_date: paidDate })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function markTransactionUnpaid(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fin_transactions')
    .update({ paid_date: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fin_transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function createCategory(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const type = formData.get('type') as string

  if (!name) return { error: 'Informe o nome da categoria.' }
  if (type !== 'receita' && type !== 'despesa') return { error: 'Tipo inválido.' }

  const { error } = await supabase.from('fin_categories').insert({ name, type })
  if (error) return { error: error.message }

  revalidate()
  return { success: true }
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient()

  const trimmed = name.trim()
  if (!id || !trimmed) return { error: 'Nome inválido.' }

  const { error } = await supabase
    .from('fin_categories')
    .update({ name: trimmed })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidate()
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('fin_categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidate()
  return { success: true }
}

// ─── Metas ────────────────────────────────────────────────────────────────────

function revalidateMetas() {
  revalidatePath('/financeiro/metas')
  revalidatePath('/financeiro/crescimento')
}

export async function createMeta(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const tipo_cohort = formData.get('tipo_cohort') as string
  const periodo = (formData.get('periodo') as string)?.trim()
  const valorRaw = formData.get('valor_meta') as string

  if (!tipo_cohort || !periodo || !valorRaw) {
    return { error: 'Preencha todos os campos.' }
  }
  if (!['mensal', 'trimestral', 'anual'].includes(tipo_cohort)) {
    return { error: 'Tipo de cohort inválido.' }
  }

  const valor_meta = parseFloat(valorRaw.replace(',', '.'))
  if (isNaN(valor_meta) || valor_meta <= 0) {
    return { error: 'Valor de meta inválido.' }
  }

  // Validate period format
  const validPeriod =
    (tipo_cohort === 'mensal' && /^\d{4}-\d{2}$/.test(periodo)) ||
    (tipo_cohort === 'trimestral' && /^\d{4}-Q[1-4]$/.test(periodo)) ||
    (tipo_cohort === 'anual' && /^\d{4}$/.test(periodo))

  if (!validPeriod) {
    return {
      error:
        tipo_cohort === 'mensal' ? 'Formato: YYYY-MM (ex: 2026-07)'
        : tipo_cohort === 'trimestral' ? 'Formato: YYYY-Q1 a YYYY-Q4 (ex: 2026-Q3)'
        : 'Formato: YYYY (ex: 2026)',
    }
  }

  const { error } = await supabase.from('fin_metas_faturamento').insert({ tipo_cohort, periodo, valor_meta })
  if (error) {
    if (error.code === '23505') return { error: 'Já existe uma meta para este período.' }
    return { error: error.message }
  }

  revalidateMetas()
  return { success: true }
}

export async function updateMeta(id: string, valor_meta: number) {
  if (!id || valor_meta <= 0) return { error: 'Valor inválido.' }
  const supabase = await createClient()
  const { error } = await supabase.from('fin_metas_faturamento').update({ valor_meta }).eq('id', id)
  if (error) return { error: error.message }
  revalidateMetas()
  return { success: true }
}

export async function deleteMeta(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fin_metas_faturamento').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateMetas()
  return { success: true }
}
