import type { BoardColumn } from './types'

export const DEFAULT_COLUMN_WIDTH = 140
export const DEFAULT_PRIMARY_COLUMN_WIDTH = 180
export const MIN_COLUMN_WIDTH = 80
export const MAX_COLUMN_WIDTH = 480
export const BOARD_HANDLE_COLUMN_WIDTH = 40
export const LEADS_ACTION_COLUMN_WIDTH = 120

export function getColumnWidth(column: BoardColumn): number {
  if (column.settings.width != null) {
    return column.settings.width
  }
  return column.is_primary ? DEFAULT_PRIMARY_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH
}

export function sortColumnsByPosition(columns: BoardColumn[]): BoardColumn[] {
  return [...columns].sort((a, b) => a.position - b.position)
}
