-- Add columns for Edit and Soft Delete functionality
ALTER TABLE public.messages 
ADD COLUMN is_edited BOOLEAN DEFAULT false,
ADD COLUMN is_deleted BOOLEAN DEFAULT false;




-- Enable RLS on the table if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to UPDATE their own messages (for editing/deleting)
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Policy to allow users to INSERT messages (if missing)
CREATE POLICY "Users can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to VIEW messages (if missing)
-- (Adjust logic if you want strict privacy, this is a general permissible read)
CREATE POLICY "Users can view messages they are involved in"
ON public.messages
FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
);
