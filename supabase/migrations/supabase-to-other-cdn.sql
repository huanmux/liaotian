-- 1. Update Gazebo Messages
UPDATE public.gazebo_messages
SET media_url = REPLACE(media_url, 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/', 'https://liaoverse-buckets.vercel.app/media/')
WHERE media_url LIKE 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/%';

-- 2. Update Direct Messages
UPDATE public.messages
SET media_url = REPLACE(media_url, 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/', 'https://liaoverse-buckets.vercel.app/media/')
WHERE media_url LIKE 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/%';

-- 3. Update User Profiles (Avatar and Banner)
UPDATE public.profiles
SET 
  avatar_url = REPLACE(avatar_url, 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/', 'https://liaoverse-buckets.vercel.app/media/'),
  banner_url = REPLACE(banner_url, 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/', 'https://liaoverse-buckets.vercel.app/media/')
WHERE avatar_url LIKE 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/%'
   OR banner_url LIKE 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/%';

-- 4. Update Posts
UPDATE public.posts
SET media_url = REPLACE(media_url, 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/', 'https://liaoverse-buckets.vercel.app/media/')
WHERE media_url LIKE 'https://uhtieumdogkgagbxvlda.supabase.co/storage/v1/object/public/media/%';
