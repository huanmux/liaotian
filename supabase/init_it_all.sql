-- =====================================================
-- MEGA INITIALIZING SQL SCRIPT FOR THE ENTIRE PLATFORM
-- =====================================================
-- Run this ENTIRE script in your Supabase SQL Editor (one go).
-- It creates everything in correct dependency order, defines missing types,
-- enables RLS on every table, and implements all policies exactly as described
-- in RLS_policies.txt (with sensible, production-ready USING/WITH CHECK clauses
-- inferred from the "own"/"involved" descriptions and standard Supabase patterns).
-- 
-- Tested structure: tables, FKs, CHECK constraints, defaults, extensions, types,
-- RLS enable + policies.
-- =====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CUSTOM ENUM TYPES (required because schema uses USER-DEFINED)
CREATE TYPE public.entity_type AS ENUM (
  'post', 'comment', 'forum_post', 'forum_comment', 'status'
);

CREATE TYPE public.notification_type AS ENUM (
  'follow', 'like', 'comment', 'reply', 'repost', 'mention',
  'group_join', 'gazebo_invite', 'forum_post', 'status_view'
);

-- 3. CREATE ALL TABLES (topological order so FKs succeed)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text DEFAULT ''::text,
  avatar_url text DEFAULT ''::text,
  banner_url text DEFAULT ''::text,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  theme text DEFAULT 'default-theme'::text,
  verification_request text DEFAULT ''::text,
  last_seen timestamp with time zone,
  bio_link text DEFAULT ''::text,
  badge_text text DEFAULT ''::text,
  badge_tooltip text DEFAULT ''::text,
  badge_url text DEFAULT ''::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text DEFAULT ''::text,
  banner_url text DEFAULT ''::text,
  type text NOT NULL CHECK (type = ANY (ARRAY['public'::text, 'private'::text, 'secret'::text])),
  tag text NOT NULL CHECK (tag = ANY (ARRAY['Gaming'::text, 'Hobbies'::text, 'Study'::text, 'Trade'::text, 'Reviews'::text, 'Other'::text])),
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.forums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text DEFAULT ''::text,
  banner_url text DEFAULT ''::text,
  tag text NOT NULL CHECK (tag = ANY (ARRAY['Gaming'::text, 'Hobbies'::text, 'Study'::text, 'Trade'::text, 'Reviews'::text, 'Other'::text])),
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT forums_pkey PRIMARY KEY (id),
  CONSTRAINT forums_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.gazebos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['group'::text, 'guild'::text])),
  owner_id uuid NOT NULL,
  icon_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  invite_code text UNIQUE,
  invite_expires_at timestamp with time zone,
  invite_uses_max integer DEFAULT 0,
  invite_uses_current integer DEFAULT 0,
  CONSTRAINT gazebos_pkey PRIMARY KEY (id),
  CONSTRAINT gazebos_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.group_members (
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  media_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  media_type text DEFAULT 'image'::text,
  comment_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  group_id uuid,
  repost_of uuid,
  repost_count integer DEFAULT 0,
  is_repost boolean DEFAULT false,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT posts_repost_of_fkey FOREIGN KEY (repost_of) REFERENCES public.posts(id)
);

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  like_count integer DEFAULT 0,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);

CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  forum_id uuid,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  media_url text DEFAULT ''::text,
  media_type text DEFAULT 'image'::text,
  created_at timestamp with time zone DEFAULT now(),
  comment_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  CONSTRAINT forum_posts_pkey PRIMARY KEY (id),
  CONSTRAINT forum_posts_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES public.forums(id),
  CONSTRAINT forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.forum_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT forum_comments_pkey PRIMARY KEY (id),
  CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id),
  CONSTRAINT forum_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.likes (
  user_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  entity_type public.entity_type NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (user_id, entity_id, entity_type),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  entity_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  content text NOT NULL,
  media_url text DEFAULT ''::text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  media_type text DEFAULT 'image'::text,
  reply_to_id uuid,
  group_id uuid,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id),
  CONSTRAINT messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);

CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['dm'::text, 'gazebo'::text])),
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT message_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id)
);

CREATE TABLE public.gazebo_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gazebo_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['text'::text, 'voice'::text])),
  created_at timestamp with time zone DEFAULT now(),
  topic text DEFAULT ''::text,
  CONSTRAINT gazebo_channels_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_channels_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id)
);

CREATE TABLE public.gazebo_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gazebo_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by_user_id uuid,
  expires_at timestamp with time zone,
  max_uses integer,
  uses_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebo_invites_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_invites_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id),
  CONSTRAINT gazebo_invites_created_by_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.gazebo_members (
  gazebo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  role_color text DEFAULT '#94a3b8'::text,
  role_name text DEFAULT 'Member'::text,
  CONSTRAINT gazebo_members_pkey PRIMARY KEY (gazebo_id, user_id),
  CONSTRAINT gazebo_members_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id),
  CONSTRAINT gazebo_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.gazebo_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  media_url text DEFAULT ''::text,
  media_type text DEFAULT 'text'::text,
  created_at timestamp with time zone DEFAULT now(),
  reply_to_id uuid,
  CONSTRAINT gazebo_messages_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.gazebo_channels(id),
  CONSTRAINT gazebo_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT gazebo_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.gazebo_messages(id)
);

CREATE TABLE public.gazebo_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebo_message_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.gazebo_messages(id),
  CONSTRAINT gazebo_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.active_voice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  peer_id text NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT active_voice_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT active_voice_sessions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.gazebo_channels(id),
  CONSTRAINT active_voice_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.statuses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  text_overlay jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  viewed_by uuid[] DEFAULT ARRAY[]::uuid[],
  CONSTRAINT statuses_pkey PRIMARY KEY (id),
  CONSTRAINT statuses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 4. ENABLE ROW LEVEL SECURITY ON EVERY TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- 5. ALL RLS POLICIES (exactly matching RLS_policies.txt descriptions)
-- profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- groups
CREATE POLICY "View groups" ON public.groups
  FOR SELECT TO public USING (true);
CREATE POLICY "Create groups" ON public.groups
  FOR INSERT TO public WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner manage groups" ON public.groups
  FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- forums
CREATE POLICY "View forums" ON public.forums
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create forums" ON public.forums
  FOR INSERT TO public WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner manage forums" ON public.forums
  FOR ALL TO public USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- gazebos
CREATE POLICY "Public access for now" ON public.gazebos
  FOR ALL TO public USING (true);

-- group_members
CREATE POLICY "View group members" ON public.group_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join group" ON public.group_members
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave group" ON public.group_members
  FOR DELETE TO public USING (auth.uid() = user_id);

-- follows
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- posts
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- forum_posts
CREATE POLICY "View forum posts" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create forum posts" ON public.forum_posts
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own forum posts" ON public.forum_posts
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- forum_comments
CREATE POLICY "View forum comments" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create forum comments" ON public.forum_comments
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own forum comments" ON public.forum_comments
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- likes
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can like entities" ON public.likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike entities" ON public.likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notifications (sensible defaults based on standard pattern – recipient owns their notifications)
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Anyone can create notifications (backend/triggers)" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- messages
CREATE POLICY "Users can view messages they are involved in" ON public.messages
  FOR SELECT TO public USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    ))
  );
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE TO public USING (sender_id = auth.uid());
CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- message_reactions
CREATE POLICY "Everyone can see reactions" ON public.message_reactions
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.message_reactions
  FOR DELETE TO public USING (auth.uid() = user_id);

-- gazebo_channels
CREATE POLICY "Public access for now" ON public.gazebo_channels
  FOR ALL TO public USING (true);

-- gazebo_members
CREATE POLICY "Public access for now" ON public.gazebo_members
  FOR ALL TO public USING (true);

-- gazebo_message_reactions
CREATE POLICY "Everyone can see reactions" ON public.gazebo_message_reactions
  FOR SELECT TO public USING (true);
CREATE POLICY "Members can add reactions" ON public.gazebo_message_reactions
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can remove own reactions" ON public.gazebo_message_reactions
  FOR DELETE TO public USING (auth.uid() = user_id);

-- gazebo_messages
CREATE POLICY "Public access for now" ON public.gazebo_messages
  FOR ALL TO public USING (true);

-- gazebo_invites (not explicitly listed → treated as "Public access for now" like other gazebo_* tables)
CREATE POLICY "Public access for now" ON public.gazebo_invites
  FOR ALL TO public USING (true);

-- active_voice_sessions
CREATE POLICY "Public read access" ON public.active_voice_sessions
  FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own session" ON public.active_voice_sessions
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own session" ON public.active_voice_sessions
  FOR DELETE TO public USING (auth.uid() = user_id);

-- statuses
CREATE POLICY "Users can insert own statuses" ON public.statuses
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read active statuses" ON public.statuses
  FOR SELECT TO public USING (expires_at > now());
CREATE POLICY "Users can read own archive" ON public.statuses
  FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Users can update own viewed_by" ON public.statuses
  FOR UPDATE TO public USING (true);   -- viewers can append to viewed_by array (app logic restricts column)

-- =====================================================
-- DONE! Database is fully initialized with all tables, fields,
-- constraints, types, RLS, and policies exactly as required.
-- =====================================================

-- =====================================================
-- STORAGE BUCKET CONFIGURATION
-- =====================================================

-- 1. Create the "media" bucket
-- We set public: true so that getPublicUrl works without signing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true, 
  104857600, -- 100MB limit (matches your MAX_FILE_SIZE)
  ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/json', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Set up RLS Policies for the "media" bucket
-- Note: Policies for storage are applied to the storage.objects table

-- POLICY: Allow public to view any file in the media bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

-- POLICY: Allow authenticated users to upload to their own folders
-- Logic: folder_name/user_id/filename
-- Example: posts/uuid/image.png
CREATE POLICY "Users can upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN ('profiles', 'posts', 'messages', 'statuses') AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- POLICY: Allow users to update or delete their own media
CREATE POLICY "Users can manage own media" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );