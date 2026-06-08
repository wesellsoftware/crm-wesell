-- Activity log and comments for board items (leads, negociações, etc.)

CREATE TABLE IF NOT EXISTS board_item_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('created', 'comment', 'name_change', 'group_change', 'field_update')),
  body text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_item_activities_item ON board_item_activities(item_id);
CREATE INDEX IF NOT EXISTS idx_board_item_activities_created ON board_item_activities(item_id, created_at DESC);

ALTER TABLE board_item_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_item_activities_select" ON board_item_activities FOR SELECT
  USING (get_item_org_id(item_id) = get_user_org_id());

CREATE POLICY "board_item_activities_insert" ON board_item_activities FOR INSERT
  WITH CHECK (get_item_org_id(item_id) = get_user_org_id());

CREATE POLICY "board_item_activities_delete" ON board_item_activities FOR DELETE
  USING (get_item_org_id(item_id) = get_user_org_id() AND user_id = auth.uid());
