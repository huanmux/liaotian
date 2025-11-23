-- 1. Add the missing Foreign Key constraint so Supabase knows how to join them
ALTER TABLE public.message_reactions
ADD CONSTRAINT message_reactions_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES public.messages(id)
ON DELETE CASCADE; -- If a message is deleted, delete its reactions

-- 2. (Optional but recommended) Add an index for faster loading
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id 
ON public.message_reactions(message_id);



-- 1. Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Everyone can SEE reactions
CREATE POLICY "Everyone can see reactions"
ON public.message_reactions
FOR SELECT
USING (true);

-- 3. Policy: Authenticated users can INSERT reactions
CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can DELETE their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);



-- 1. Drop the old constraint that forces reactions to only be for DMs
ALTER TABLE public.message_reactions
DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;

-- 2. (Optional) You can leave it without a FK if you want to support both tables, 
-- or use a polymorphic approach. For simplicity, we remove the strict check 
-- so the code can insert Gazebo Message IDs.


ALTER TABLE public.message_reactions
ADD CONSTRAINT message_reactions_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES public.messages(id)
ON DELETE CASCADE;   -- or whatever rule you originally had

