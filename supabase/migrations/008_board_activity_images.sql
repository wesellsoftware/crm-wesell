-- Storage for activity/comment images + update policy for editable comments

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'board-activities',
  'board-activities',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "board_activities: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'board-activities');

CREATE POLICY "board_activities: org members upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'board-activities'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "board_activities: org members update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'board-activities'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'board-activities'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "board_activities: org members delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'board-activities'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "board_item_activities_update" ON board_item_activities FOR UPDATE
  USING (get_item_org_id(item_id) = get_user_org_id() AND user_id = auth.uid())
  WITH CHECK (get_item_org_id(item_id) = get_user_org_id() AND user_id = auth.uid());
