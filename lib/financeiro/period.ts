export const COMPANY_START_PERIOD = '2026-03'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function periodToDate(period: string): Date {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function clampPeriod(period: string): string {
  const current = currentPeriod()
  if (period > current) return current
  if (period < COMPANY_START_PERIOD) return COMPANY_START_PERIOD
  return period
}

export function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function parsePeriod(value?: string): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return currentPeriod()
  return clampPeriod(value)
}

export function addMonth(period: string, delta: number): string {
  const d = periodToDate(period)
  d.setMonth(d.getMonth() + delta)
  const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return clampPeriod(next)
}

export function periodToDateRange(period: string): { start: string; end: string } {
  const [y, m] = period.split('-').map(Number)
  return {
    start: toDateStr(new Date(y, m - 1, 1)),
    end: toDateStr(new Date(y, m, 0)),
  }
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return `${MONTHS[month - 1]} ${year}`
}

export function formatPeriodShort(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const shortYear = String(year).slice(-2)
  return `${MONTHS_SHORT[month - 1]} ${shortYear}`
}

export type MonthOption = {
  value: string
  label: string
  isCurrent: boolean
}

export function buildMonthOptions(fromPeriod: string, toPeriod: string): MonthOption[] {
  const current = currentPeriod()
  const opts: MonthOption[] = []
  let p = fromPeriod

  while (p <= toPeriod) {
    opts.push({
      value: p,
      label: formatPeriodShort(p),
      isCurrent: p === current,
    })
    if (p === toPeriod) break
    const d = periodToDate(p)
    d.setMonth(d.getMonth() + 1)
    p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return opts
}

export function buildMonthOptionsToCurrent(fromPeriod: string = COMPANY_START_PERIOD): MonthOption[] {
  return buildMonthOptions(fromPeriod, currentPeriod())
}
