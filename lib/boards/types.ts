export type ColumnType =
  | 'text'
  | 'status'
  | 'person'
  | 'date'
  | 'timeline'
  | 'number'
  | 'currency'
  | 'email'
  | 'phone'
  | 'url'
  | 'tags'
  | 'relation'

export interface StatusOption {
  id: string
  label: string
  color: string
}

export interface ColumnSettings {
  options?: StatusOption[]
  target_board_slug?: string
  currency?: string
}

export interface Board {
  id: string
  organization_id: string
  slug: string
  name: string
  icon: string | null
  position: number
  created_at: string
}

export interface BoardGroup {
  id: string
  board_id: string
  name: string
  color: string
  position: number
  collapsed: boolean
  created_at: string
}

export interface BoardColumn {
  id: string
  board_id: string
  name: string
  type: ColumnType
  position: number
  settings: ColumnSettings
  is_primary: boolean
  created_at: string
}

export interface BoardItem {
  id: string
  board_id: string
  group_id: string
  name: string
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CellValue =
  | { text: string }
  | { option_id: string }
  | { user_ids: string[] }
  | { date: string }
  | { start: string; end: string }
  | { number: number }
  | { amount: number; currency: string }
  | { value: string }
  | { option_ids: string[] }
  | { item_ids: string[] }

export interface BoardItemValue {
  id: string
  item_id: string
  column_id: string
  value: CellValue
}

export interface OrgMember {
  id: string
  full_name: string | null
}

export interface RelatedItem {
  id: string
  name: string
  board_slug: string
}

export interface BoardData {
  board: Board
  groups: BoardGroup[]
  columns: BoardColumn[]
  items: BoardItem[]
  values: BoardItemValue[]
  members: OrgMember[]
  relatedItems: RelatedItem[]
  allBoards: Pick<Board, 'id' | 'slug' | 'name'>[]
}

export interface BoardTemplateColumn {
  name: string
  type: ColumnType
  is_primary?: boolean
  settings?: ColumnSettings
}

export interface BoardTemplateGroup {
  name: string
  color: string
}

export interface BoardTemplate {
  slug: string
  name: string
  icon: string
  position: number
  groups: BoardTemplateGroup[]
  columns: BoardTemplateColumn[]
}
