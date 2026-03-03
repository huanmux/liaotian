-- Rename columns
ALTER TABLE posts RENAME COLUMN image_url TO media_url;
ALTER TABLE messages RENAME COLUMN image_url TO media_url;

-- Add media_type
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT DO NOTHING;

-- Policies
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Users can delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = (SELECT id::text FROM auth.users WHERE id = auth.uid()));
