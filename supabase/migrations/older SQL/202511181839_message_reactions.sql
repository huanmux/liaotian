-- SQL COMMANDS TO UPDATE DATABASE
-- Create the message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['dm'::text, 'gazebo'::text])), -- 'dm' or 'gazebo' to differentiate message source
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT message_reactions_pkey PRIMARY KEY (id),
  -- Ensures a user can only react with a specific emoji once per message
  CONSTRAINT unique_reaction_per_user_and_message UNIQUE (message_id, user_id, emoji),
  
  CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Add an index for faster lookups by message ID
CREATE INDEX message_reactions_message_id_idx ON public.message_reactions USING btree (message_id);
