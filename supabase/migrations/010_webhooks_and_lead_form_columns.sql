-- Webhooks for n8n integrations + extra lead form columns

CREATE TABLE IF NOT EXISTS organization_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event text NOT NULL,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event, url)
);

CREATE INDEX IF NOT EXISTS idx_organization_webhooks_org ON organization_webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_webhooks_event ON organization_webhooks(organization_id, event);

ALTER TABLE organization_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_webhooks_select" ON organization_webhooks FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "organization_webhooks_insert" ON organization_webhooks FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND organization_id = organization_webhooks.organization_id
        AND role = 'admin'
    )
  );

CREATE POLICY "organization_webhooks_update" ON organization_webhooks FOR UPDATE
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND organization_id = organization_webhooks.organization_id
        AND role = 'admin'
    )
  );

CREATE POLICY "organization_webhooks_delete" ON organization_webhooks FOR DELETE
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND organization_id = organization_webhooks.organization_id
        AND role = 'admin'
    )
  );

-- Ensures lead board has columns for the public website form
CREATE OR REPLACE FUNCTION ensure_lead_form_columns(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_id uuid;
  v_max_position int;
  v_col record;
BEGIN
  SELECT id INTO v_board_id
  FROM boards
  WHERE organization_id = p_org_id AND slug = 'leads';

  IF v_board_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(position), -1) INTO v_max_position
  FROM board_columns
  WHERE board_id = v_board_id;

  FOR v_col IN
    SELECT * FROM (VALUES
      ('WhatsApp', 'phone'),
      ('Cidade', 'text'),
      ('Segmento', 'text'),
      ('Serviço', 'text'),
      ('Ideia do Projeto', 'text'),
      ('Faturamento', 'text'),
      ('Colaboradores', 'text'),
      ('Origem', 'text')
    ) AS t(name, type)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM board_columns
      WHERE board_id = v_board_id AND name = v_col.name
    ) THEN
      v_max_position := v_max_position + 1;
      INSERT INTO board_columns (board_id, name, type, position, settings, is_primary)
      VALUES (v_board_id, v_col.name, v_col.type, v_max_position, '{}', false);
    END IF;
  END LOOP;
END;
$$;
