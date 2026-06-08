-- Point user_id FK to profiles so PostgREST can embed profile data
ALTER TABLE board_item_activities
  DROP CONSTRAINT IF EXISTS board_item_activities_user_id_fkey;

ALTER TABLE board_item_activities
  ADD CONSTRAINT board_item_activities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
