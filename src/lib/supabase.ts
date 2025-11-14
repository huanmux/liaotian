// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  verified: boolean;
  created_at: string;
  theme: string;
  verification_request: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video' | 'document';
  created_at: string;
  profiles?: Profile;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video' | 'document';
  read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
};

// === STORAGE HELPERS ===
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const uploadMedia = async (
  file: File,
  folder: 'posts' | 'messages' | 'profiles',
  onProgress?: (percent: number) => void
): Promise<{ url: string; type: string } | null> => {
  const user = (await supabase.auth.getUser())?.data.user;
  if (!user) return null;

  if (file.size > MAX_FILE_SIZE) {
    alert(`File too large. Max 100 MB.`);
    return null;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg','bmp'];
  const validVideo = ['mp4', 'webm', 'mov', 'avi'];
  const validDoc = ['pdf', 'doc', 'docx', 'txt', 'json','rtf','exe','zip','mp3','ogg','wav'];

  let type: string;
  if (validImage.includes(ext)) type = 'image';
  else if (validVideo.includes(ext)) type = 'video';
  else if (validDoc.includes(ext)) type = 'document';
  else {
    alert('Unsupported file type');
    return null;
  }

  if (folder === 'profiles' && type !== 'image') {
    alert('Images only for profiles');
    return null;
  }

  const fileName = `${folder}/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error && error.message !== 'The resource already exists') {
    console.error('Upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
  return { url: publicUrl, type };
};
