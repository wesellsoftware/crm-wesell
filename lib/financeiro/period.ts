export const COMPANY_START_PERIOD = '2026-03'
export const FUTURE_MONTHS_LIMIT = 6

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
  const max = maxSelectablePeriod()
  if (period > max) return max
  if (period < COMPANY_START_PERIOD) return COMPANY_START_PERIOD
  return period
}

export function maxSelectablePeriod(): string {
  return shiftPeriod(currentPeriod(), FUTURE_MONTHS_LIMIT)
}

export function isFuturePeriod(period: string): boolean {
  return period > currentPeriod()
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
  const next = shiftPeriod(period, delta)
  return clampPeriod(next)
}

/** Avança/retrocede meses sem limitar ao intervalo permitido na UI. */
export function shiftPeriod(period: string, delta: number): string {
  const d = periodToDate(period)
  d.setMonth(d.getMonth() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function maxPeriod(a: string, b: string): string {
  return a >= b ? a : b
}

export function minPeriod(a: string, b: string): string {
  return a <= b ? a : b
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
  isFuture: boolean
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
      isFuture: p > current,
    })
    if (p === toPeriod) break
    p = shiftPeriod(p, 1)
  }

  return opts
}

export function buildMonthOptionsToCurrent(fromPeriod: string = COMPANY_START_PERIOD): MonthOption[] {
  return buildMonthOptions(fromPeriod, currentPeriod())
}

export function buildMonthOptionsForDashboard(fromPeriod: string = COMPANY_START_PERIOD): MonthOption[] {
  return buildMonthOptions(fromPeriod, maxSelectablePeriod())
}
