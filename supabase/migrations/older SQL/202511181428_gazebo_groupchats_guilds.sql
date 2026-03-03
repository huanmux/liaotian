-- 1. The main Gazebo table (handles both Groups and Guilds)
CREATE TABLE public.gazebos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('group', 'guild')),
  owner_id uuid NOT NULL,
  icon_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebos_pkey PRIMARY KEY (id),
  CONSTRAINT gazebos_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

-- 2. Members of a Gazebo
CREATE TABLE public.gazebo_members (
  gazebo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebo_members_pkey PRIMARY KEY (gazebo_id, user_id),
  CONSTRAINT gazebo_members_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id) ON DELETE CASCADE,
  CONSTRAINT gazebo_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. Channels within a Gazebo (Guilds have many, Groups usually have 1 default)
CREATE TABLE public.gazebo_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gazebo_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'voice')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebo_channels_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_channels_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id) ON DELETE CASCADE
);

-- 4. Messages specifically for Gazebo Text Channels
CREATE TABLE public.gazebo_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  media_url text DEFAULT ''::text,
  media_type text DEFAULT 'text',
  created_at timestamp with time zone DEFAULT now(),
  reply_to_id uuid,
  CONSTRAINT gazebo_messages_pkey PRIMARY KEY (id),
  CONSTRAINT gazebo_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.gazebo_channels(id) ON DELETE CASCADE,
  CONSTRAINT gazebo_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT gazebo_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.gazebo_messages(id)
);

-- RLS Policies (Simplified for context - allow all authenticated for now)
ALTER TABLE public.gazebos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gazebo_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for now" ON public.gazebos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public access for now" ON public.gazebo_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public access for now" ON public.gazebo_channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public access for now" ON public.gazebo_messages FOR ALL USING (auth.role() = 'authenticated');




-- Add invite system
ALTER TABLE public.gazebos 
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE,
ADD COLUMN IF NOT EXISTS invite_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS invite_uses_max integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS invite_uses_current integer DEFAULT 0;

-- Role colors & display
ALTER TABLE public.gazebo_members
ADD COLUMN IF NOT EXISTS role_color text DEFAULT '#94a3b8',
ADD COLUMN IF NOT EXISTS role_name text DEFAULT 'Member';

-- Optional: channel topics/descriptions
ALTER TABLE public.gazebo_channels
ADD COLUMN IF NOT EXISTS topic text DEFAULT '';


-- 2. Create a new table for custom gazebo invite links.
--    This table allows the owner to create short, memorable, and trackable invite codes.
CREATE TABLE public.gazebo_invites (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    gazebo_id uuid NOT NULL,
    invite_code text NOT NULL UNIQUE, -- The custom short code, e.g. 'dev-team'
    created_by_user_id uuid, -- Who created it (the owner)
    expires_at timestamp with time zone,
    max_uses integer,
    uses_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gazebo_invites_pkey PRIMARY KEY (id),
    CONSTRAINT gazebo_invites_gazebo_id_fkey FOREIGN KEY (gazebo_id) REFERENCES public.gazebos(id) ON DELETE CASCADE,
    CONSTRAINT gazebo_invites_created_by_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id)
);
