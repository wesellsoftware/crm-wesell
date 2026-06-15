-- Ensure auth.users trigger exists for handle_new_user (signup + invite flows)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_org_id       uuid;
  v_org_name     text;
  v_fullname     text;
  v_invite_org   uuid;
begin
  v_fullname := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Invited user: join existing organization as Colaborador
  v_invite_org := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;

  if v_invite_org is not null then
    if not exists (select 1 from public.organizations where id = v_invite_org) then
      raise exception 'Organização de convite inválida: %', v_invite_org;
    end if;

    insert into public.profiles (id, organization_id, full_name, role)
    values (new.id, v_invite_org, v_fullname, 'member');

    return new;
  end if;

  -- New signup: create organization and admin
  v_org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    split_part(new.email, '@', 2)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
