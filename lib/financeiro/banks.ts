export const FIN_BANK_NAMES = ['C6 Bank', 'Nubank', 'Asaas'] as const

export const DEFAULT_BANK_NAME = 'C6 Bank'

export type FinBankName = (typeof FIN_BANK_NAMES)[number]
