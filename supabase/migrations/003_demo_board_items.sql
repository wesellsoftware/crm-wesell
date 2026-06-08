-- Demo items for monday.com-like experience

CREATE OR REPLACE FUNCTION seed_demo_board_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_board_id uuid;
  v_group_id uuid;
  v_item_id uuid;
  v_col_id uuid;
  -- shared item ids for relations
  v_contact1 uuid;
  v_contact2 uuid;
  v_contact3 uuid;
  v_account1 uuid;
  v_account2 uuid;
  v_account3 uuid;
  v_deal1 uuid;
  v_deal2 uuid;
  v_lead1 uuid;
  v_lead2 uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM board_items LIMIT 1) THEN
    RETURN;
  END IF;

  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN RETURN; END IF;

  -- ========== CONTAS (first, for relations) ==========
  SELECT id INTO v_board_id FROM boards WHERE organization_id = v_org_id AND slug = 'contas';
  SELECT id INTO v_group_id FROM board_groups WHERE board_id = v_board_id AND name = 'Empresas';

  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Google', 0) RETURNING id INTO v_account1;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Apple', 1) RETURNING id INTO v_account2;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Amazon', 2) RETURNING id INTO v_account3;

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Domínio';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_account1, v_col_id, '{"value":"https://google.com"}'),
    (v_account2, v_col_id, '{"value":"https://apple.com"}'),
    (v_account3, v_col_id, '{"value":"https://amazon.com"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Setor';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_account1, v_col_id, '{"option_ids":["e5000001-0000-4000-8000-000000000001"]}'),
    (v_account2, v_col_id, '{"option_ids":["e5000001-0000-4000-8000-000000000001"]}'),
    (v_account3, v_col_id, '{"option_ids":["e5000001-0000-4000-8000-000000000002"]}');

  -- ========== CONTATOS ==========
  SELECT id INTO v_board_id FROM boards WHERE organization_id = v_org_id AND slug = 'contatos';
  SELECT id INTO v_group_id FROM board_groups WHERE board_id = v_board_id AND name = 'Contatos';

  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Phoenix Levy', 0) RETURNING id INTO v_contact1;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Madison Doyle', 1) RETURNING id INTO v_contact2;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Mariana Santos', 2) RETURNING id INTO v_contact3;

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Conta';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_account2::text))),
    (v_contact2, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_account1::text))),
    (v_contact3, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_account3::text)));

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Cargo';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, '{"text":"COO"}'),
    (v_contact2, v_col_id, '{"text":"CEO"}'),
    (v_contact3, v_col_id, '{"text":"Diretor"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Tipo';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, '{"option_id":"b2000001-0000-4000-8000-000000000001"}'),
    (v_contact2, v_col_id, '{"option_id":"b2000001-0000-4000-8000-000000000002"}'),
    (v_contact3, v_col_id, '{"option_id":"b2000001-0000-4000-8000-000000000003"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Prioridade';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, '{"option_id":"c3000001-0000-4000-8000-000000000001"}'),
    (v_contact2, v_col_id, '{"option_id":"c3000001-0000-4000-8000-000000000002"}'),
    (v_contact3, v_col_id, '{"option_id":"c3000001-0000-4000-8000-000000000003"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Telefone';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, '{"value":"+1 555-0101"}'),
    (v_contact2, v_col_id, '{"value":"+1 555-0102"}'),
    (v_contact3, v_col_id, '{"value":"+55 11 99999-0001"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'E-mail';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_contact1, v_col_id, '{"value":"phoenix@pear.com"}'),
    (v_contact2, v_col_id, '{"value":"madison@facebook.com"}'),
    (v_contact3, v_col_id, '{"value":"mariana@amazon.com"}');

  -- Link accounts to contacts
  SELECT id INTO v_col_id FROM board_columns WHERE board_id = (SELECT id FROM boards WHERE slug = 'contas') AND name = 'Contato';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_account1, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact2::text))),
    (v_account2, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact1::text))),
    (v_account3, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact3::text)));

  -- ========== LEADS ==========
  SELECT id INTO v_board_id FROM boards WHERE organization_id = v_org_id AND slug = 'leads';
  SELECT id INTO v_group_id FROM board_groups WHERE board_id = v_board_id AND name = 'Novos Leads';

  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Roberto Camargo', 0) RETURNING id INTO v_lead1;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Sergio Nunes', 1) RETURNING id INTO v_lead2;

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Status';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_lead1, v_col_id, '{"option_id":"a1000001-0000-4000-8000-000000000002"}'),
    (v_lead2, v_col_id, '{"option_id":"a1000001-0000-4000-8000-000000000001"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Empresa';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_lead1, v_col_id, '{"text":"Apple"}'),
    (v_lead2, v_col_id, '{"text":"Microsoft"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Cargo';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_lead1, v_col_id, '{"text":"COO"}'),
    (v_lead2, v_col_id, '{"text":"Diretor"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Lead Score';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_lead1, v_col_id, '{"number":3}'),
    (v_lead2, v_col_id, '{"number":2}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'E-mail';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_lead1, v_col_id, '{"value":"roberto@apple.com"}'),
    (v_lead2, v_col_id, '{"value":"sergio@microsoft.com"}');

  -- ========== NEGOCIAÇÕES ==========
  SELECT id INTO v_board_id FROM boards WHERE organization_id = v_org_id AND slug = 'negociacoes';
  SELECT id INTO v_group_id FROM board_groups WHERE board_id = v_board_id AND name = 'Oportunidades ativas';

  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Negociação Google', 0) RETURNING id INTO v_deal1;
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Negociação Apple', 1) RETURNING id INTO v_deal2;

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Etapa';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_deal1, v_col_id, '{"option_id":"d4000001-0000-4000-8000-000000000001"}'),
    (v_deal2, v_col_id, '{"option_id":"d4000001-0000-4000-8000-000000000002"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Valor da negociação';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_deal1, v_col_id, '{"amount":70000,"currency":"BRL"}'),
    (v_deal2, v_col_id, '{"amount":122000,"currency":"BRL"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Contato';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_deal1, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact2::text))),
    (v_deal2, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact1::text)));

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Cronograma';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_deal1, v_col_id, '{"start":"2026-05-01","end":"2026-08-31"}'),
    (v_deal2, v_col_id, '{"start":"2026-06-01","end":"2026-09-30"}');

  -- Link deals on accounts
  SELECT id INTO v_col_id FROM board_columns WHERE board_id = (SELECT id FROM boards WHERE slug = 'contas') AND name = 'Negociação';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_account1, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_deal1::text))),
    (v_account2, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_deal2::text)));

  -- Closed deal
  SELECT id INTO v_group_id FROM board_groups WHERE board_id = v_board_id AND name = 'Fechado/Ganho';
  INSERT INTO board_items (board_id, group_id, name, position) VALUES (v_board_id, v_group_id, 'Negociação Amazon', 0) RETURNING id INTO v_item_id;

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Etapa';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_item_id, v_col_id, '{"option_id":"d4000001-0000-4000-8000-000000000004"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Valor da negociação';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_item_id, v_col_id, '{"amount":95000,"currency":"BRL"}');

  SELECT id INTO v_col_id FROM board_columns WHERE board_id = v_board_id AND name = 'Contato';
  INSERT INTO board_item_values (item_id, column_id, value) VALUES
    (v_item_id, v_col_id, jsonb_build_object('item_ids', jsonb_build_array(v_contact3::text)));

END;
$$;

GRANT EXECUTE ON FUNCTION seed_demo_board_items() TO authenticated;

SELECT seed_demo_board_items();
