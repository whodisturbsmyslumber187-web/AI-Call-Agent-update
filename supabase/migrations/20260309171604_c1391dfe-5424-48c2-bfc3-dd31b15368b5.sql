
-- Fix knowledge-base bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'knowledge-base';

-- Drop overly broad KB storage policies
DROP POLICY IF EXISTS "Users can read KB files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload KB files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete KB files" ON storage.objects;

-- Create scoped policies for knowledge-base
CREATE POLICY "Users can manage own KB files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );
