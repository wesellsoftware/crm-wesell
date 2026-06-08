-- Global organization activity feed (CRM-wide timeline)

CREATE TABLE IF NOT EXISTS organization_feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('board', 'task', 'settings', 'integration')),
  event_type text NOT NULL,
  summary text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_feed_events_org_created
  ON organization_feed_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_feed_events_category
  ON organization_feed_events(organization_id, category, created_at DESC);

ALTER TABLE organization_feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_feed_events_select" ON organization_feed_events FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "org_feed_events_insert" ON organization_feed_events FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- Backfill board item activities
INSERT INTO organization_feed_events (
  organization_id, user_id, category, event_type, summary, body,
  entity_type, entity_id, metadata, created_at
)
SELECT
  b.organization_id,
  bia.user_id,
  'board',
  bia.type,
  CASE bia.type
    WHEN 'created' THEN 'criou ' || bi.name || ' em ' || b.name
    WHEN 'comment' THEN 'comentou em ' || bi.name || ' (' || b.name || ')'
    WHEN 'name_change' THEN 'renomeou para ' || COALESCE(bia.metadata->>'new_name', bi.name) || ' em ' || b.name
    WHEN 'group_change' THEN 'moveu ' || bi.name || ' para ' || COALESCE(bia.metadata->>'new_group_name', '—') || ' em ' || b.name
    WHEN 'field_update' THEN 'alterou ' || COALESCE(bia.metadata->>'column_name', 'campo') || ' em ' || bi.name || ' (' || b.name || ')'
    ELSE 'atualizou ' || bi.name || ' em ' || b.name
  END,
  bia.body,
  'board_item',
  bia.item_id,
  bia.metadata || jsonb_build_object(
    'board_slug', b.slug,
    'board_name', b.name,
    'item_name', bi.name,
    'source_activity_id', bia.id
  ),
  bia.created_at
FROM board_item_activities bia
JOIN board_items bi ON bi.id = bia.item_id
JOIN boards b ON b.id = bi.board_id;

-- Backfill task activities (created)
INSERT INTO organization_feed_events (
  organization_id, user_id, category, event_type, summary, body,
  entity_type, entity_id, metadata, created_at
)
SELECT
  a.organization_id,
  a.user_id,
  'task',
  'task_created',
  'criou tarefa ' || a.title,
  a.description,
  'activity',
  a.id,
  jsonb_build_object(
    'task_type', a.type,
    'deal_id', a.deal_id,
    'contact_id', a.contact_id
  ),
  a.created_at
FROM activities a
WHERE EXISTS (SELECT 1 FROM organizations o WHERE o.id = a.organization_id);

-- Backfill task activities (completed)
INSERT INTO organization_feed_events (
  organization_id, user_id, category, event_type, summary, body,
  entity_type, entity_id, metadata, created_at
)
SELECT
  a.organization_id,
  a.user_id,
  'task',
  'task_completed',
  'concluiu tarefa ' || a.title,
  NULL,
  'activity',
  a.id,
  jsonb_build_object('task_type', a.type),
  a.completed_at
FROM activities a
WHERE a.completed_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = a.organization_id);
