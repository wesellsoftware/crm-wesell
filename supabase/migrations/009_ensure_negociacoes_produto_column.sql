-- Garante coluna Produto + closed_at em negociações (orgs existentes e novas visitas)

ALTER TABLE board_items ADD COLUMN IF NOT EXISTS closed_at timestamptz;

CREATE OR REPLACE FUNCTION ensure_negociacoes_produto_column(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_id uuid;
  v_won_group_id uuid;
  v_product_tags jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF p_org_id IS DISTINCT FROM (SELECT organization_id FROM profiles WHERE id = auth.uid()) THEN
      RAISE EXCEPTION 'Forbidden: organization mismatch';
    END IF;
  END IF;

  SELECT id INTO v_board_id
  FROM boards
  WHERE organization_id = p_org_id AND slug = 'negociacoes'
  LIMIT 1;

  IF v_board_id IS NULL THEN
    RETURN;
  END IF;

  v_product_tags := '[
    {"id":"f6000001-0000-4000-8000-000000000001","label":"CRM","color":"#4342F5"},
    {"id":"f6000001-0000-4000-8000-000000000002","label":"Automação","color":"#45D4F4"},
    {"id":"f6000001-0000-4000-8000-000000000003","label":"Consultoria","color":"#45F47F"},
    {"id":"f6000001-0000-4000-8000-000000000004","label":"Suporte","color":"#F4A545"}
  ]'::jsonb;

  IF NOT EXISTS (
    SELECT 1 FROM board_columns
    WHERE board_id = v_board_id AND lower(trim(name)) = 'produto'
  ) THEN
    UPDATE board_columns
    SET position = position + 1
    WHERE board_id = v_board_id AND position >= 1;

    INSERT INTO board_columns (board_id, name, type, position, settings, is_primary)
    VALUES (
      v_board_id,
      'Produto',
      'tags',
      1,
      jsonb_build_object('options', v_product_tags),
      false
    );
  END IF;

  SELECT id INTO v_won_group_id
  FROM board_groups
  WHERE board_id = v_board_id AND lower(trim(name)) = 'fechado/ganho'
  LIMIT 1;

  IF v_won_group_id IS NOT NULL THEN
    UPDATE board_items
    SET closed_at = updated_at
    WHERE board_id = v_board_id
      AND group_id = v_won_group_id
      AND closed_at IS NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_negociacoes_produto_column(uuid) TO authenticated;

-- Backfill all existing negociações boards
DO $$
DECLARE
  v_org record;
BEGIN
  FOR v_org IN SELECT DISTINCT organization_id AS id FROM boards WHERE slug = 'negociacoes'
  LOOP
    PERFORM ensure_negociacoes_produto_column(v_org.id);
  END LOOP;
END;
$$;
