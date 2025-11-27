-- 1. Update the entity_type enum to include 'forum_post'
-- Note: PostgreSQL doesn't support adding values to enums inside a transaction block easily in some clients,
-- but usually this works. If it fails, you might need to drop and recreate the type.
ALTER TYPE public.entity_type ADD VALUE IF NOT EXISTS 'forum_post';

-- 2. Create function to increment comment counts automatically
CREATE OR REPLACE FUNCTION increment_forum_comment_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.forum_posts
  SET comment_count = comment_count + 1
  WHERE id = post_id;
END;
$$;

-- 3. (Optional) Add a like_count column to forum_posts if not present, to match the UI logic
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;
