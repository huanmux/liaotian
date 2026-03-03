ALTER TABLE profiles
ADD COLUMN bio_link text DEFAULT '';

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE, -- For replies to other comments
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookup of comments on a specific post
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);

-- Index for quick lookup of replies to a specific parent comment
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);

-- Index for quick ordering by time
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

ALTER TABLE posts
ADD COLUMN comment_count integer DEFAULT 0;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments on public posts
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- Users can create a comment/reply
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments/replies
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TYPE public.like_entity_type AS ENUM ('post', 'comment');

CREATE TABLE IF NOT EXISTS likes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL, -- References either posts(id) or comments(id)
  entity_type like_entity_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, entity_id, entity_type)
);

-- Index for quick lookup of likes on a specific post/comment
CREATE INDEX IF NOT EXISTS likes_entity_idx ON likes(entity_id, entity_type);

-- Add like_count to the posts table
ALTER TABLE posts
ADD COLUMN like_count integer DEFAULT 0;

-- Add like_count to the comments table
ALTER TABLE comments
ADD COLUMN like_count integer DEFAULT 0;

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view the likes data (needed for calculating counts)
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

-- Users can insert a like
CREATE POLICY "Users can like entities"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove a like (unlike)
CREATE POLICY "Users can unlike entities"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
