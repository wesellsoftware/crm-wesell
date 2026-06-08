-- Coluna Produto + closed_at para indicadores de negociações

ALTER TABLE board_items ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Produto options JSON for tags column
-- CRM, Automação, Consultoria, Suporte

DO $$
DECLARE
  v_board record;
  v_won_group_id uuid;
BEGIN
  FOR v_board IN
    SELECT id FROM boards WHERE slug = 'negociacoes'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM board_columns
      WHERE board_id = v_board.id AND lower(trim(name)) = 'produto'
    ) THEN
      UPDATE board_columns
      SET position = position + 1
      WHERE board_id = v_board.id AND position >= 1;

      INSERT INTO board_columns (board_id, name, type, position, settings, is_primary)
      VALUES (
        v_board.id,
        'Produto',
        'tags',
        1,
        '{"options":[
          {"id":"f6000001-0000-4000-8000-000000000001","label":"CRM","color":"#4342F5"},
          {"id":"f6000001-0000-4000-8000-000000000002","label":"Automação","color":"#45D4F4"},
          {"id":"f6000001-0000-4000-8000-000000000003","label":"Consultoria","color":"#45F47F"},
          {"id":"f6000001-0000-4000-8000-000000000004","label":"Suporte","color":"#F4A545"}
        ]}'::jsonb,
        false
      );
    END IF;

    -- Backfill closed_at for existing won deals
    SELECT id INTO v_won_group_id
    FROM board_groups
    WHERE board_id = v_board.id AND lower(trim(name)) = 'fechado/ganho'
    LIMIT 1;

    IF v_won_group_id IS NOT NULL THEN
      UPDATE board_items
      SET closed_at = updated_at
      WHERE board_id = v_board.id
        AND group_id = v_won_group_id
        AND closed_at IS NULL;
    END IF;
  END LOOP;
END;
$$;

-- Update seed function for new organizations
CREATE OR REPLACE FUNCTION seed_organization_boards(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_id uuid;
  v_lead_status jsonb;
  v_contact_type jsonb;
  v_contact_priority jsonb;
  v_deal_stage jsonb;
  v_sector_tags jsonb;
  v_product_tags jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF p_org_id IS DISTINCT FROM (SELECT organization_id FROM profiles WHERE id = auth.uid()) THEN
      RAISE EXCEPTION 'Forbidden: organization mismatch';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM boards WHERE organization_id = p_org_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_lead_status := '[
    {"id":"a1000001-0000-4000-8000-000000000001","label":"Novo lead","color":"#FFD700"},
    {"id":"a1000001-0000-4000-8000-000000000002","label":"Contatado","color":"#F4A545"},
    {"id":"a1000001-0000-4000-8000-000000000003","label":"Qualificado","color":"#45F47F"},
    {"id":"a1000001-0000-4000-8000-000000000004","label":"Desqualificado","color":"#F44545"},
    {"id":"a1000001-0000-4000-8000-000000000005","label":"Em espera","color":"#45D4F4"}
  ]'::jsonb;

  v_contact_type := '[
    {"id":"b2000001-0000-4000-8000-000000000001","label":"Lead","color":"#D7FE65"},
    {"id":"b2000001-0000-4000-8000-000000000002","label":"Qualified (Existing Account)","color":"#45F47F"},
    {"id":"b2000001-0000-4000-8000-000000000003","label":"Qualified (New Account)","color":"#45D4F4"}
  ]'::jsonb;

  v_contact_priority := '[
    {"id":"c3000001-0000-4000-8000-000000000001","label":"Alta","color":"#F4A545"},
    {"id":"c3000001-0000-4000-8000-000000000002","label":"Média","color":"#4342F5"},
    {"id":"c3000001-0000-4000-8000-000000000003","label":"Baixa","color":"#45D4F4"}
  ]'::jsonb;

  v_deal_stage := '[
    {"id":"d4000001-0000-4000-8000-000000000001","label":"Descoberta","color":"#4342F5"},
    {"id":"d4000001-0000-4000-8000-000000000002","label":"Proposta","color":"#45D4F4"},
    {"id":"d4000001-0000-4000-8000-000000000003","label":"Negociação","color":"#F4A545"},
    {"id":"d4000001-0000-4000-8000-000000000004","label":"Fechado/Ganho","color":"#45F47F"},
    {"id":"d4000001-0000-4000-8000-000000000005","label":"Perdido","color":"#F44545"}
  ]'::jsonb;

  v_sector_tags := '[
    {"id":"e5000001-0000-4000-8000-000000000001","label":"Software","color":"#45D4F4"},
    {"id":"e5000001-0000-4000-8000-000000000002","label":"Vendas e marketing","color":"#45F47F"},
    {"id":"e5000001-0000-4000-8000-000000000003","label":"Finanças","color":"#7845F4"},
    {"id":"e5000001-0000-4000-8000-000000000004","label":"Saúde","color":"#F4A545"}
  ]'::jsonb;

  v_product_tags := '[
    {"id":"f6000001-0000-4000-8000-000000000001","label":"CRM","color":"#4342F5"},
    {"id":"f6000001-0000-4000-8000-000000000002","label":"Automação","color":"#45D4F4"},
    {"id":"f6000001-0000-4000-8000-000000000003","label":"Consultoria","color":"#45F47F"},
    {"id":"f6000001-0000-4000-8000-000000000004","label":"Suporte","color":"#F4A545"}
  ]'::jsonb;

  INSERT INTO boards (organization_id, slug, name, icon, position)
  VALUES (p_org_id, 'contatos', 'Contatos', 'users', 0)
  RETURNING id INTO v_board_id;

  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Contatos', '#4342F5', 0);

  INSERT INTO board_columns (board_id, name, type, position, settings, is_primary) VALUES
    (v_board_id, 'Contato', 'text', 0, '{}', true),
    (v_board_id, 'Conta', 'relation', 1, '{"target_board_slug":"contas"}', false),
    (v_board_id, 'Cargo', 'text', 2, '{}', false),
    (v_board_id, 'Tipo', 'status', 3, jsonb_build_object('options', v_contact_type), false),
    (v_board_id, 'Prioridade', 'status', 4, jsonb_build_object('options', v_contact_priority), false),
    (v_board_id, 'Próxima interação', 'date', 5, '{}', false),
    (v_board_id, 'Telefone', 'phone', 6, '{}', false),
    (v_board_id, 'E-mail', 'email', 7, '{}', false);

  INSERT INTO boards (organization_id, slug, name, icon, position)
  VALUES (p_org_id, 'negociacoes', 'Negociações', 'dollar-sign', 1)
  RETURNING id INTO v_board_id;

  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Oportunidades ativas', '#4342F5', 0),
    (v_board_id, 'Fechado/Ganho', '#45F47F', 1),
    (v_board_id, 'Perdidos', '#F44545', 2);

  INSERT INTO board_columns (board_id, name, type, position, settings, is_primary) VALUES
    (v_board_id, 'Oportunidade', 'text', 0, '{}', true),
    (v_board_id, 'Produto', 'tags', 1, jsonb_build_object('options', v_product_tags), false),
    (v_board_id, 'Cronograma', 'timeline', 2, '{}', false),
    (v_board_id, 'Etapa', 'status', 3, jsonb_build_object('options', v_deal_stage), false),
    (v_board_id, 'Responsável', 'person', 4, '{}', false),
    (v_board_id, 'Valor da negociação', 'currency', 5, '{"currency":"BRL"}', false),
    (v_board_id, 'Contato', 'relation', 6, '{"target_board_slug":"contatos"}', false);

  INSERT INTO boards (organization_id, slug, name, icon, position)
  VALUES (p_org_id, 'leads', 'Leads', 'target', 2)
  RETURNING id INTO v_board_id;

  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Novos Leads', '#4342F5', 0);

  INSERT INTO board_columns (board_id, name, type, position, settings, is_primary) VALUES
    (v_board_id, 'Lead', 'text', 0, '{}', true),
    (v_board_id, 'Status', 'status', 1, jsonb_build_object('options', v_lead_status), false),
    (v_board_id, 'Cronograma', 'timeline', 2, '{}', false),
    (v_board_id, 'Empresa', 'text', 3, '{}', false),
    (v_board_id, 'Cargo', 'text', 4, '{}', false),
    (v_board_id, 'Lead Score', 'number', 5, '{}', false),
    (v_board_id, 'E-mail', 'email', 6, '{}', false);

  INSERT INTO boards (organization_id, slug, name, icon, position)
  VALUES (p_org_id, 'contas', 'Contas', 'building-2', 3)
  RETURNING id INTO v_board_id;

  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Empresas', '#4342F5', 0);

  INSERT INTO board_columns (board_id, name, type, position, settings, is_primary) VALUES
    (v_board_id, 'Conta', 'text', 0, '{}', true),
    (v_board_id, 'Domínio', 'url', 1, '{}', false),
    (v_board_id, 'Contato', 'relation', 2, '{"target_board_slug":"contatos"}', false),
    (v_board_id, 'Negociação', 'relation', 3, '{"target_board_slug":"negociacoes"}', false),
    (v_board_id, 'Setor', 'tags', 4, jsonb_build_object('options', v_sector_tags), false);
END;
$$;
