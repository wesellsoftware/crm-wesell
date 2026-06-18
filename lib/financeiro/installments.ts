export type InstallmentDraft = {
  number: number
  amount: number
  due_date: string
}

const CENTS_TOLERANCE = 0.01

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Divide total evenly; remainder cents go to the last installment. */
export function splitAmountEvenly(total: number, count: number): number[] {
  if (count < 2 || total <= 0) return []

  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainder = totalCents - baseCents * count

  const amounts: number[] = []
  for (let i = 0; i < count; i++) {
    const cents = i === count - 1 ? baseCents + remainder : baseCents
    amounts.push(cents / 100)
  }
  return amounts
}

export function sumInstallmentAmounts(amounts: number[]): number {
  return roundMoney(amounts.reduce((acc, v) => acc + v, 0))
}

export function installmentsMatchTotal(amounts: number[], total: number): boolean {
  return Math.abs(sumInstallmentAmounts(amounts) - roundMoney(total)) <= CENTS_TOLERANCE
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1 + months, day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function buildInstallmentDrafts(
  total: number,
  count: number,
  firstDueDate: string,
): InstallmentDraft[] {
  const amounts = splitAmountEvenly(total, count)
  return amounts.map((amount, index) => ({
    number: index + 1,
    amount,
    due_date: addMonthsToDate(firstDueDate, index),
  }))
}

export function parseInstallmentsJson(raw: string | null): InstallmentDraft[] | { error: string } {
  if (!raw?.trim()) return { error: 'Informe os valores das parcelas.' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Dados de parcelamento inválidos.' }
  }

  if (!Array.isArray(parsed) || parsed.length < 2) {
    return { error: 'O parcelamento precisa de pelo menos 2 parcelas.' }
  }

  const installments: InstallmentDraft[] = []
  for (const item of parsed) {
    const number = Number(item?.number)
    const amount = parseFloat(String(item?.amount ?? '').replace(',', '.'))
    const due_date = String(item?.due_date ?? '').trim()

    if (!Number.isInteger(number) || number < 1 || isNaN(amount) || amount <= 0 || !due_date) {
      return { error: 'Parcela com dados inválidos.' }
    }

    installments.push({ number, amount: roundMoney(amount), due_date })
  }

  installments.sort((a, b) => a.number - b.number)
  return installments
}
