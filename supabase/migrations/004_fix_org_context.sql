-- Fix org context: allow users to read their own profile and resolve org via SECURITY DEFINER

CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_my_organization_id() TO authenticated;

-- Own-profile policy (fixes circular RLS on profiles SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles: view own profile'
  ) THEN
    CREATE POLICY "profiles: view own profile" ON profiles
      FOR SELECT USING (id = auth.uid());
  END IF;
END $$;
