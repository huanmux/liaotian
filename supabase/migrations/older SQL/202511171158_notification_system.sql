-- 1. Create the notification type enum
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow');

-- 2. Create the notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL, -- The user to notify
  actor_id uuid NOT NULL,     -- The user who performed the action
  type notification_type NOT NULL,
  entity_id uuid NOT NULL,    -- The ID of the post, comment, etc.
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. (Recommended) Create DB Triggers to auto-populate this table
-- Example for new comments:
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Find the owner of the post being commented on
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Only insert a notification if the commenter is not the post owner
  IF post_owner_id IS NOT NULL AND post_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications(recipient_id, actor_id, type, entity_id)
    VALUES(post_owner_id, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment_notification();

-- Example for new likes:
CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Only handle likes for 'post' entities
  IF NEW.entity_type = 'post' THEN
    -- Find the owner of the post being liked
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.entity_id;
    
    -- Only insert a notification if the liker is not the post owner
    IF post_owner_id IS NOT NULL AND post_owner_id <> NEW.user_id THEN
      INSERT INTO public.notifications(recipient_id, actor_id, type, entity_id)
      VALUES(post_owner_id, NEW.user_id, 'like', NEW.entity_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like_notification();
