export const NEGOCIACOES_FIXED_GROUP_NAMES = [
  'Oportunidades ativas',
  'Fechado/Ganho',
  'Perdidos',
] as const

export function isFixedNegociacoesGroup(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  return NEGOCIACOES_FIXED_GROUP_NAMES.some(
    fixed => fixed.toLowerCase() === normalized
  )
}

export function canDeleteBoardGroup(slug: string, groupName: string): boolean {
  if (slug === 'negociacoes' && isFixedNegociacoesGroup(groupName)) {
    return false
  }
  return true
}
