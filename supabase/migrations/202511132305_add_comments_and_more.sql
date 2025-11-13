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
