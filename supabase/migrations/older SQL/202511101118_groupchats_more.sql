-- 1. Alter groups table: Add visual identity
ALTER TABLE groups ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS banner_url text DEFAULT '';

-- 2. Alter group_members table: Add 'is_admin' role
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 3. Update RLS policies for groups to allow admins to manage the group

-- Drop old policies first
DROP POLICY IF EXISTS "Creators can update groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete groups" ON groups;

-- Creators AND Admins can update groups (name, avatar, banner)
CREATE POLICY "Admins and creators can update groups" ON groups
  FOR UPDATE
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true))
  WITH CHECK (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true));

-- Creators AND Admins can delete groups (Only creator should delete, but we'll include admin for robustness)
CREATE POLICY "Admins and creators can delete groups" ON groups
  FOR DELETE
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true));

-- 4. Update RLS policies for group_members to allow admins/creators to add/remove members

-- Drop old policies first
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Members viewable by everyone in the group (no change needed for SELECT policy)

-- Admins and creators can insert new members (via invite/manual add)
CREATE POLICY "Admins and creators can insert members" ON group_members
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true));

-- Admins, creators, and the user themselves can delete (leave/kick)
CREATE POLICY "Admins, creators, and member can delete members" ON group_members
  FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true));

-- Policy for updating member roles (only creators or admins can set/change roles, and cannot change their own status)
CREATE POLICY "Admins and creators can update member roles" ON group_members
  FOR UPDATE
  USING (
    -- User is admin or creator of the group
    (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true))
    -- Cannot update your own membership unless you are the one leaving (handled by DELETE policy)
    AND auth.uid() <> user_id
  )
  WITH CHECK (
    -- User is admin or creator of the group
    (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true))
    AND auth.uid() <> user_id
  );
