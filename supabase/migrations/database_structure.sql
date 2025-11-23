-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.likes (
  user_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  entity_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (user_id, entity_id, entity_type),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  entity_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
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
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text DEFAULT ''::text,
  avatar_url text DEFAULT ''::text,
  banner_url text DEFAULT ''::text,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  theme text DEFAULT 'lt-classic'::text,
  verification_request text DEFAULT ''::text,
  last_seen timestamp with time zone,
  bio_link text DEFAULT ''::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.statuses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  text_overlay jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  viewed_by ARRAY DEFAULT ARRAY[]::uuid[],
  CONSTRAINT statuses_pkey PRIMARY KEY (id),
  CONSTRAINT statuses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
