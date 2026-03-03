-- 1. Add columns to the posts table
ALTER TABLE public.posts 
ADD COLUMN repost_of uuid REFERENCES public.posts(id) ON DELETE SET NULL,
ADD COLUMN repost_count integer DEFAULT 0,
ADD COLUMN is_repost boolean DEFAULT false;

-- 2. Create a function to handle repost counting automatically
CREATE OR REPLACE FUNCTION update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.repost_of IS NOT NULL) THEN
    UPDATE public.posts SET repost_count = repost_count + 1 WHERE id = NEW.repost_of;
  ELSIF (TG_OP = 'DELETE' AND OLD.repost_of IS NOT NULL) THEN
    UPDATE public.posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = OLD.repost_of;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER trigger_update_repost_count
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION update_repost_count();
