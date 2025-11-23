-- 1. Create the table
CREATE TABLE public.gazebo_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gazebo_message_reactions_pkey PRIMARY KEY (id),
  -- Crucial Foreign Keys
  CONSTRAINT gazebo_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.gazebo_messages(id) ON DELETE CASCADE,
  CONSTRAINT gazebo_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. Add RLS (Security)
ALTER TABLE public.gazebo_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see reactions" ON public.gazebo_message_reactions FOR SELECT USING (true);
CREATE POLICY "Members can add reactions" ON public.gazebo_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can remove own reactions" ON public.gazebo_message_reactions FOR DELETE USING (auth.uid() = user_id);
