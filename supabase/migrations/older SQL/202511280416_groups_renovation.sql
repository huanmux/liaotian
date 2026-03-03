-- 1. Create a function to get the "Hybrid Feed" 
-- (Posts from people you follow OR Posts from Groups you are in)
CREATE OR REPLACE FUNCTION get_hybrid_feed(p_user_id uuid, p_limit int, p_offset int)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  media_url text,
  media_type text,
  created_at timestamptz,
  group_id uuid,
  like_count int, -- Approximate or joined
  comment_count int
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.user_id, p.content, p.media_url, p.media_type, p.created_at, p.group_id,
    p.like_count, p.comment_count
  FROM posts p
  WHERE 
    -- 1. Post is from a user I follow
    p.user_id IN (SELECT following_id FROM follows WHERE follower_id = p_user_id)
    -- 2. OR Post is from a group I am a member of
    OR p.group_id IN (SELECT gm.group_id FROM group_members gm WHERE gm.user_id = p_user_id)
    -- 3. OR Post is my own
    OR p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2. Add a View for easier Group Metadata (Member counts)
CREATE OR REPLACE VIEW view_group_details AS
SELECT 
  g.id,
  g.name,
  g.description,
  g.icon_url,
  g.banner_url,
  g.type,
  g.tag,
  g.owner_id,
  g.created_at,
  (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
  (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id) as post_count
FROM groups g;
