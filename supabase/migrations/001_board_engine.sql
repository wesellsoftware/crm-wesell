-- Board Engine: monday.com-style configurable CRM boards

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  icon text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS board_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#4342F5',
  position int NOT NULL DEFAULT 0,
  collapsed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  position int NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES board_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_item_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  value jsonb NOT NULL DEFAULT '{}',
  UNIQUE (item_id, column_id)
);

-- Link activities to board items
ALTER TABLE activities ADD COLUMN IF NOT EXISTS board_item_id uuid REFERENCES board_items(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_boards_org ON boards(organization_id);
CREATE INDEX IF NOT EXISTS idx_board_groups_board ON board_groups(board_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_board ON board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_board ON board_items(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_group ON board_items(group_id);
CREATE INDEX IF NOT EXISTS idx_board_item_values_item ON board_item_values(item_id);
CREATE INDEX IF NOT EXISTS idx_board_item_values_column ON board_item_values(column_id);
CREATE INDEX IF NOT EXISTS idx_board_item_values_value ON board_item_values USING gin(value);

-- ============================================================
-- HELPER: get organization_id from board
-- ============================================================

CREATE OR REPLACE FUNCTION get_board_org_id(p_board_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM boards WHERE id = p_board_id;
$$;

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_item_values ENABLE ROW LEVEL SECURITY;

-- boards
CREATE POLICY "boards_select" ON boards FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "boards_insert" ON boards FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "boards_update" ON boards FOR UPDATE
  USING (organization_id = get_user_org_id());
CREATE POLICY "boards_delete" ON boards FOR DELETE
  USING (organization_id = get_user_org_id());

-- board_groups
CREATE POLICY "board_groups_select" ON board_groups FOR SELECT
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_groups_insert" ON board_groups FOR INSERT
  WITH CHECK (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_groups_update" ON board_groups FOR UPDATE
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_groups_delete" ON board_groups FOR DELETE
  USING (get_board_org_id(board_id) = get_user_org_id());

-- board_columns
CREATE POLICY "board_columns_select" ON board_columns FOR SELECT
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_columns_insert" ON board_columns FOR INSERT
  WITH CHECK (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_columns_update" ON board_columns FOR UPDATE
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_columns_delete" ON board_columns FOR DELETE
  USING (get_board_org_id(board_id) = get_user_org_id());

-- board_items
CREATE POLICY "board_items_select" ON board_items FOR SELECT
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_items_insert" ON board_items FOR INSERT
  WITH CHECK (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_items_update" ON board_items FOR UPDATE
  USING (get_board_org_id(board_id) = get_user_org_id());
CREATE POLICY "board_items_delete" ON board_items FOR DELETE
  USING (get_board_org_id(board_id) = get_user_org_id());

-- board_item_values (via item -> board)
CREATE OR REPLACE FUNCTION get_item_org_id(p_item_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.organization_id
  FROM board_items i
  JOIN boards b ON b.id = i.board_id
  WHERE i.id = p_item_id;
$$;

CREATE POLICY "board_item_values_select" ON board_item_values FOR SELECT
  USING (get_item_org_id(item_id) = get_user_org_id());
CREATE POLICY "board_item_values_insert" ON board_item_values FOR INSERT
  WITH CHECK (get_item_org_id(item_id) = get_user_org_id());
CREATE POLICY "board_item_values_update" ON board_item_values FOR UPDATE
  USING (get_item_org_id(item_id) = get_user_org_id());
CREATE POLICY "board_item_values_delete" ON board_item_values FOR DELETE
  USING (get_item_org_id(item_id) = get_user_org_id());

-- updated_at trigger for board_items
CREATE OR REPLACE FUNCTION update_board_item_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS board_items_updated_at ON board_items;
CREATE TRIGGER board_items_updated_at
  BEFORE UPDATE ON board_items
  FOR EACH ROW EXECUTE FUNCTION update_board_item_timestamp();
