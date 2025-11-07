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
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  created_at: string;
  profiles?: Profile;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  image_url: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
};
