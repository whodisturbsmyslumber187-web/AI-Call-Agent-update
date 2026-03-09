
-- Fix overly broad RLS policies on messages, conversations, reservations

-- Messages: scope to conversations owned by user's businesses
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN businesses b ON b.id = c.business_id
      WHERE b.user_id = auth.uid()
    )
  );

-- Conversations: scope to user's businesses  
DROP POLICY IF EXISTS "Authenticated users can read conversations" ON public.conversations;
CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id IS NULL OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Reservations: scope reads and updates to user's businesses
DROP POLICY IF EXISTS "Authenticated users can read reservations" ON public.reservations;
CREATE POLICY "Users can read own reservations" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Fix recordings bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'recordings';

-- Drop permissive SELECT policy on recordings
DROP POLICY IF EXISTS "Anyone can read recordings" ON storage.objects;

-- Create scoped policy for recordings
CREATE POLICY "Users can read own recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'recordings' AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );
