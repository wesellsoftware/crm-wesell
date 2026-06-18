export const FIN_PAYMENT_METHODS = ['pix', 'boleto', 'credito', 'debito'] as const

export type FinPaymentMethod = (typeof FIN_PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<FinPaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credito: 'Crédito',
  debito: 'Débito',
}

export function parsePaymentMethod(value: FormDataEntryValue | null): FinPaymentMethod | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null
  return FIN_PAYMENT_METHODS.includes(raw as FinPaymentMethod)
    ? (raw as FinPaymentMethod)
    : null
}
