-- Online status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Replying to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;

-- Group chats
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Updated policies for messages to support groups
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view DMs" ON messages 
  FOR SELECT TO authenticated 
  USING ((auth.uid() = sender_id OR auth.uid() = recipient_id) AND group_id IS NULL);

CREATE POLICY "Users can view group messages" ON messages 
  FOR SELECT TO authenticated 
  USING (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send DMs" ON messages 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = sender_id AND group_id IS NULL);

CREATE POLICY "Users can send group messages" ON messages 
  FOR INSERT TO authenticated 
  WITH CHECK (group_id IS NOT NULL AND auth.uid() = sender_id AND EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can mark DMs as read" ON messages 
  FOR UPDATE TO authenticated 
  USING ((auth.uid() = recipient_id) AND group_id IS NULL) 
  WITH CHECK (auth.uid() = recipient_id);

-- Policies for groups and group_members
CREATE POLICY "Groups viewable by members" ON groups 
  FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()));

CREATE POLICY "Creators can create groups" ON groups 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update groups" ON groups 
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete groups" ON groups 
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Members viewable by members" ON group_members 
  FOR SELECT USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));

CREATE POLICY "Users can join groups" ON group_members 
  FOR INSERT TO authenticated 
  WITH CHECK (true);  -- Open join; restrict if needed

CREATE POLICY "Users can leave groups" ON group_members 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS messages_group_id_idx ON messages(group_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
