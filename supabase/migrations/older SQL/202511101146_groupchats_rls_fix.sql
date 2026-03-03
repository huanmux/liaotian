-- ===============================================
-- FIX 1: Break Direct Recursion on group_members SELECT
-- The original policy was self-referential, causing infinite recursion.
-- We must restrict the SELECT RLS on the lookup table to the current user's rows only.
-- This allows the EXISTS checks in other policies (messages, groups) to work without recursion.
-- NOTE: This restricts the ability of the frontend to fetch the full member list in a single query.
-- ===============================================
DROP POLICY IF EXISTS "Members viewable by members" ON group_members;
CREATE POLICY "Members viewable by self" ON group_members
  FOR SELECT TO authenticated
  USING (group_members.user_id = auth.uid());

-- ===============================================
-- FIX 2: Fix Group Creation Failure on groups SELECT
-- The original policy failed because during INSERT...SELECT, no group_members row exists yet.
-- This new policy ensures the group creator can always see the group immediately.
-- This is the correct RLS for viewing groups when group_members SELECT is restricted.
-- ===============================================
DROP POLICY IF EXISTS "Groups viewable by members" ON groups;
CREATE POLICY "Groups viewable by members" ON groups
  FOR SELECT TO authenticated
  USING (
    -- Creator can view the group (crucial for group creation flow)
    groups.creator_id = auth.uid()
    OR
    -- Existing member can view the group (uses the now non-recursive group_members SELECT RLS)
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
  );

-- ===============================================
-- NOTE: The policies below are retained as they do not cause recursion,
-- but you should re-run them with the above fixes included in the full script.
-- ===============================================

-- Policies for groups (Retained)
DROP POLICY IF EXISTS "Creators can create groups" ON groups;
CREATE POLICY "Creators can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins and creators can update groups" ON groups;
CREATE POLICY "Admins and creators can update groups" ON groups FOR UPDATE USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true)) WITH CHECK (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins and creators can delete groups" ON groups;
CREATE POLICY "Admins and creators can delete groups" ON groups FOR DELETE USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true));

-- Policies for group_members (Retained)
DROP POLICY IF EXISTS "Admins and creators can insert members" ON group_members;
CREATE POLICY "Admins and creators can insert members" ON group_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true));

DROP POLICY IF EXISTS "Admins and creators can update member roles" ON group_members;
CREATE POLICY "Admins and creators can update member roles" ON group_members FOR UPDATE USING ((EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true)) AND auth.uid() <> user_id) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins, creators, and member can delete members" ON group_members;
CREATE POLICY "Admins, creators, and member can delete members" ON group_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true));
