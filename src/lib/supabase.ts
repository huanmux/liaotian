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
  media_type: 'image' | 'video' | 'document' | 'audio';
  created_at: string;
  profiles?: Profile;
};

export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: Profile; // For joining/fetching the user who reacted
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video' | 'document' | 'audio';
  read: boolean;
  created_at: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  sender?: Profile;
  recipient?: Profile;
  reactions?: MessageReaction[];
};

export type Status = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  text_overlay: any;  // JSONB object
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  profiles?: Profile;
};

export type Gazebo = {
  id: string;
  name: string;
  type: 'group' | 'guild';
  owner_id: string;
  icon_url: string;
  created_at: string;
  invite_code: string | null;
  invite_expires_at: string | null;
  invite_uses_max: number;
  invite_uses_current: number;
};

export type GazeboMember = {
  user_id: string;
  gazebo_id: string;
  role: 'owner' | 'admin' | 'member';
  role_name: string;
  role_color: string;
  profiles: Profile;
};

export type GazeboChannel = {
  id: string;
  gazebo_id: string;
  name: string;
  type: 'text' | 'voice';
};

export type GazeboMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video' | 'document' | 'audio';
  created_at: string;
  sender?: Profile; // We will join this manually or via view
  reply_to?: GazeboMessage | null;
  reactions?: MessageReaction[];
};

// === STORAGE HELPERS ===
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const uploadStatusMedia = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; type: string } | null> => {
  return uploadMedia(file, 'statuses', onProgress);
};

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
  const validAudio = ['mp3', 'weba', 'ogg', 'wav', 'm4a'];
  const validDoc = ['pdf', 'doc', 'docx', 'txt', 'json','rtf','exe','zip'];

  let type: string;
  if (validImage.includes(ext)) type = 'image';
  else if (validVideo.includes(ext)) {
    // Handle webm, which can be audio or video
    if (ext === 'webm' && file.type.startsWith('audio/')) {
      type = 'audio';
    } else {
      type = 'video';
    }
  }
  else if (validAudio.includes(ext)) type = 'audio';
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
