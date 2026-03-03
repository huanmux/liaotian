-- Fix 400 Bad Request by making recipient_id nullable for group messages
ALTER TABLE messages ALTER COLUMN recipient_id DROP NOT NULL;
-- Drop old SELECT policies on messages
DROP POLICY IF EXISTS "Users can view DMs" ON messages;
DROP POLICY IF EXISTS "Users can view group messages" ON messages;

-- Unified RLS policy for messages (SELECT)
CREATE POLICY "Users can view messages" ON messages FOR SELECT TO authenticated
  USING (
    -- DM check: Current user is sender OR recipient
    (group_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
    OR
    -- Group check: Current user is a member of the group
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    ))
  );

-- Retain the INSERT policies (assuming they are correct for DM/Group checks):
-- CREATE POLICY "Users can send DMs" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND group_id IS NULL);
-- CREATE POLICY "Users can send group messages" ON messages FOR INSERT TO authenticated WITH CHECK (group_id IS NOT NULL AND auth.uid() = sender_id AND EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()));
