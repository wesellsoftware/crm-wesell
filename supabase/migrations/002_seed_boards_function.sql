-- Seed boards function (SECURITY DEFINER) + signup hook

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

  -- Contatos
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

  -- Negociações
  INSERT INTO boards (organization_id, slug, name, icon, position)
  VALUES (p_org_id, 'negociacoes', 'Negociações', 'dollar-sign', 1)
  RETURNING id INTO v_board_id;

  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Oportunidades ativas', '#4342F5', 0),
    (v_board_id, 'Fechado/Ganho', '#45F47F', 1);

  INSERT INTO board_columns (board_id, name, type, position, settings, is_primary) VALUES
    (v_board_id, 'Oportunidade', 'text', 0, '{}', true),
    (v_board_id, 'Cronograma', 'timeline', 1, '{}', false),
    (v_board_id, 'Etapa', 'status', 2, jsonb_build_object('options', v_deal_stage), false),
    (v_board_id, 'Responsável', 'person', 3, '{}', false),
    (v_board_id, 'Valor da negociação', 'currency', 4, '{"currency":"BRL"}', false),
    (v_board_id, 'Contato', 'relation', 5, '{"target_board_slug":"contatos"}', false);

  -- Leads
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

  -- Contas
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

GRANT EXECUTE ON FUNCTION seed_organization_boards(uuid) TO authenticated;

-- Update signup trigger to seed boards
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_org_id   uuid;
  v_org_name text;
  v_fullname text;
begin
  v_org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    split_part(new.email, '@', 2)
  );
  v_fullname := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.organizations (name)
  values (v_org_name)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (new.id, v_org_id, v_fullname, 'admin');

  insert into public.stages (organization_id, name, color, position) values
    (v_org_id, 'Prospecção',    '#4342F5', 0),
    (v_org_id, 'Qualificação',  '#7845F4', 1),
    (v_org_id, 'Proposta',      '#D7FE65', 2),
    (v_org_id, 'Negociação',    '#EDED4A', 3),
    (v_org_id, 'Fechamento',    '#45F47F', 4);

  perform seed_organization_boards(v_org_id);

  return new;
end;
$function$;

-- Seed existing organizations
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM organizations LOOP
    PERFORM seed_organization_boards(r.id);
  END LOOP;
END;
$$;
