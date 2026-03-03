ALTER TABLE public.profiles
ADD COLUMN badge_text text DEFAULT '',
ADD COLUMN badge_tooltip text DEFAULT '',
ADD COLUMN badge_url text DEFAULT '';
