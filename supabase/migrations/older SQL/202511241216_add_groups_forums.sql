-- 1. GROUPS TABLE
CREATE TABLE public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon_url text DEFAULT '',
  banner_url text DEFAULT '',
  type text NOT NULL CHECK (type IN ('public', 'private', 'secret')),
  tag text NOT NULL CHECK (tag IN ('Gaming', 'Hobbies', 'Study', 'Trade', 'Reviews', 'Other')),
  owner_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. GROUP MEMBERS
CREATE TABLE public.group_members (
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 3. MODIFY POSTS TABLE (To link posts to groups)
ALTER TABLE public.posts ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- 4. FORUMS TABLE
CREATE TABLE public.forums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon_url text DEFAULT '',
  banner_url text DEFAULT '',
  tag text NOT NULL CHECK (tag IN ('Gaming', 'Hobbies', 'Study', 'Trade', 'Reviews', 'Other')),
  owner_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. FORUM POSTS (Separate from main feed)
CREATE TABLE public.forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id uuid REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  media_url text DEFAULT '',
  media_type text DEFAULT 'image',
  created_at timestamptz DEFAULT now(),
  comment_count integer DEFAULT 0
);

-- 6. FORUM COMMENTS
CREATE TABLE public.forum_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);






-- ============================================================
-- 1. ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. GROUPS POLICIES
-- ============================================================

-- SELECT: Everyone can see Public/Private groups. 
-- Secret groups are only visible to members or the owner.
CREATE POLICY "View groups" ON public.groups
FOR SELECT USING (
  type IN ('public', 'private') OR 
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

-- INSERT: Authenticated users can create groups
CREATE POLICY "Create groups" ON public.groups
FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);

-- UPDATE/DELETE: Only the owner can edit/delete the group
CREATE POLICY "Owner manage groups" ON public.groups
FOR ALL USING (
  auth.uid() = owner_id
);

-- ============================================================
-- 3. GROUP MEMBERS POLICIES
-- ============================================================

-- SELECT: Authenticated users can view members (needed to see who is in a group)
CREATE POLICY "View group members" ON public.group_members
FOR SELECT TO authenticated USING (true);

-- INSERT: Users can join groups (add themselves)
CREATE POLICY "Join group" ON public.group_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- DELETE: Users can leave groups (remove themselves)
CREATE POLICY "Leave group" ON public.group_members
FOR DELETE USING (
  auth.uid() = user_id
);

-- ============================================================
-- 4. FORUMS POLICIES
-- ============================================================

-- SELECT: Authenticated users can view forums
CREATE POLICY "View forums" ON public.forums
FOR SELECT TO authenticated USING (true);

-- INSERT: Authenticated users can create forums (or restrict to admins if preferred)
CREATE POLICY "Create forums" ON public.forums
FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);

-- UPDATE/DELETE: Only owner
CREATE POLICY "Owner manage forums" ON public.forums
FOR ALL USING (
  auth.uid() = owner_id
);

-- ============================================================
-- 5. FORUM POSTS POLICIES
-- ============================================================

-- SELECT: Authenticated users can read posts
CREATE POLICY "View forum posts" ON public.forum_posts
FOR SELECT TO authenticated USING (true);

-- INSERT: Authenticated users can create posts
CREATE POLICY "Create forum posts" ON public.forum_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE/DELETE: Users can manage their own posts
CREATE POLICY "Manage own forum posts" ON public.forum_posts
FOR ALL USING (
  auth.uid() = user_id
);

-- ============================================================
-- 6. FORUM COMMENTS POLICIES
-- ============================================================

-- SELECT: Authenticated users can read comments
CREATE POLICY "View forum comments" ON public.forum_comments
FOR SELECT TO authenticated USING (true);

-- INSERT: Authenticated users can comment
CREATE POLICY "Create forum comments" ON public.forum_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE/DELETE: Users can manage their own comments
CREATE POLICY "Manage own forum comments" ON public.forum_comments
FOR ALL USING (
  auth.uid() = user_id
);

-- ============================================================
-- 7. UPDATE POSTS TABLE POLICY (OPTIONAL BUT RECOMMENDED)
-- ============================================================
-- Since you added group_id to posts, you might want to ensure 
-- posts in 'secret' groups aren't visible in the main feed 
-- unless the user is a member. 

-- NOTE: This assumes you already have a "Select all posts" policy.
-- If you want to strictly enforce group privacy on posts, you would 
-- need to modify the existing posts select policy. 
-- For now, the existing posts policy likely allows reading all posts, 
-- which is fine for Public/Private groups.
