-- Soft delete for board items (trash / restore)

ALTER TABLE board_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_board_items_deleted_at
  ON board_items(board_id, deleted_at)
  WHERE deleted_at IS NOT NULL;
