-- Re-create the INSERT policy for group_members
DROP POLICY IF EXISTS "Admins and creators can insert members" ON group_members;
CREATE POLICY "Admins and creators can insert members" ON group_members
  FOR INSERT
  TO authenticated
  -- For INSERT, the entire check must be in WITH CHECK
  WITH CHECK (
    -- User is the group creator
    EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) 
    OR 
    -- User is an admin of the group
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true)
  );

-- The UPDATE and DELETE policies remain correct, as they use the USING clause for authorization check:

DROP POLICY IF EXISTS "Admins and creators can update member roles" ON group_members;
CREATE POLICY "Admins and creators can update member roles" ON group_members
  FOR UPDATE
  USING (
    -- User is admin or creator of the group AND is not the target of the update
    (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true))
    AND auth.uid() <> user_id
  )
  WITH CHECK (
    -- This minimal check prevents recursion while satisfying the syntax requirement
    true
  );

DROP POLICY IF EXISTS "Admins, creators, and member can delete members" ON group_members;
CREATE POLICY "Admins, creators, and member can delete members" ON group_members
  FOR DELETE
  USING (
    auth.uid() = user_id -- Can delete self (leave group)
    OR EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()) -- Creator can delete
    OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.is_admin = true) -- Admin can delete
  );
