export const NEGOCIACOES_FIXED_COLUMN_NAMES = ['Produto'] as const

export function isFixedNegociacoesColumn(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  return NEGOCIACOES_FIXED_COLUMN_NAMES.some(
    fixed => fixed.toLowerCase() === normalized
  )
}

export function canDeleteBoardColumn(slug: string, columnName: string): boolean {
  if (slug === 'negociacoes' && isFixedNegociacoesColumn(columnName)) {
    return false
  }
  return true
}

export function canRenameBoardColumn(slug: string, columnName: string): boolean {
  if (slug === 'negociacoes' && isFixedNegociacoesColumn(columnName)) {
    return false
  }
  return true
}
