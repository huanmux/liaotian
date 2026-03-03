/**
 * Creates a "security definer" function to remove a follower.
 * This bypasses RLS but internally checks auth.uid()
 * to ensure a user can ONLY remove their *own* followers.
 */
create or replace function remove_follower(p_follower_id uuid)
returns void
language plpgsql
security definer -- This bypasses RLS
set search_path = public
as $$
begin
  delete from public.follows
  where
    follower_id = p_follower_id -- The follower to remove
    and following_id = auth.uid(); -- The user calling the function (me)
end;
$$;
