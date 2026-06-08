-- Fix infinite recursion: profiles SELECT policy must not subquery profiles directly.

DROP POLICY IF EXISTS "profiles: view members of same org" ON profiles;

CREATE POLICY "profiles: view members of same org" ON profiles
  FOR SELECT
  USING (organization_id = get_my_organization_id());
