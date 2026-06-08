const WON_GROUP_NAME = 'fechado/ganho'
const LOST_GROUP_NAME = 'perdidos'

export function isWonGroupName(name: string): boolean {
  return name.trim().toLowerCase() === WON_GROUP_NAME
}

export function isLostGroupName(name: string): boolean {
  return name.trim().toLowerCase() === LOST_GROUP_NAME
}

export function isClosedGroupName(name: string): boolean {
  return isWonGroupName(name) || isLostGroupName(name)
}
