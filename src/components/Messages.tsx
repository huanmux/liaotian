// src/components/Messages.tsx
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { supabase, Message, Profile, uploadMedia, MessageReaction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Search, ArrowLeft, X, Paperclip, FileText, Link, CornerUpLeft, Phone, Video, Mic, Play, Pause, Plus, Check, CheckCheck, MessageSquare, Users, Smile, Image as ImageIcon, Film, Music, Folder, FileIcon, MoreVertical, ChevronDown, Edit2, Trash2, Copy, Gift } from 'lucide-react';
import { MessageEmbed } from './MessageEmbed';
import { EmojiPicker } from './EmojiPicker';

// Lazy load components to prevent Circular Dependency ReferenceErrors
const Calls = lazy(() => import('./Calls').then(module => ({ default: module.Calls })));
const Gazebos = lazy(() => import('./Gazebos').then(module => ({ default: module.Gazebos })));

const extractFirstUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '💀'];

// Utility function to group reactions for display
type GroupedReaction = {
  emoji: string;
  count: number;
  hasReacted: boolean;
  userProfiles: Profile[];
};

const groupReactions = (reactions: MessageReaction[] | undefined, currentUserId: string): GroupedReaction[] => {
    if (!reactions) return [];
    
    const grouped = new Map<string, GroupedReaction>();
    
    for (const reaction of reactions) {
        // Handle case where reaction might be partial from realtime before fetch
        const { emoji, user_id, profiles } = reaction;
        
        if (!grouped.has(emoji)) {
            grouped.set(emoji, { emoji, count: 0, hasReacted: false, userProfiles: [] });
        }
        
        const group = grouped.get(emoji)!;
        group.count++;
        if (user_id === currentUserId) group.hasReacted = true;
        // Only push valid profiles
        if (profiles && !Array.isArray(profiles)) group.userProfiles.push(profiles);
    }
    
    return Array.from(grouped.values()).sort((a, b) => {
        const aIndex = QUICK_EMOJIS.indexOf(a.emoji);
        const bIndex = QUICK_EMOJIS.indexOf(b.emoji);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; 
        if (aIndex !== -1) return -1; 
        if (bIndex !== -1) return 1;
        return b.count - a.count; 
    });
};

// Define a type that includes the possible joined reply data
type AppMessage = Message & {
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    media_type?: string | null;
  } | null;
};

// --- NEW AudioPlayer COMPONENT ---
interface AudioPlayerProps {
  src: string;
  isOutgoing: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isOutgoing }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const primaryColor = isOutgoing 
    ? 'rgb(var(--color-text-on-primary))' 
    : 'rgb(var(--color-accent))';
  
  const trackColor = isOutgoing 
    ? 'rgba(var(--color-text-on-primary), 0.3)'
    : 'rgb(var(--color-border))';

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const togglePlay = () => setIsPlaying(!audio.paused);
    const onEnded = () => {
        setIsPlaying(false);
        audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlay);
    audio.addEventListener('pause', togglePlay);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', togglePlay);
      audio.removeEventListener('pause', togglePlay);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="flex items-center space-x-2 w-full max-w-full mb-1">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      
      <button 
        onClick={handlePlayPause}
        className={`flex-shrink-0 p-1.5 rounded-full transition-colors`}
        style={{
            backgroundColor: isOutgoing 
                ? 'rgba(var(--color-text-on-primary), 0.15)' 
                : 'rgb(var(--color-surface-hover))',
            color: primaryColor,
        }}
      >
        {isPlaying ? <Pause size={14} fill={primaryColor} /> : <Play size={14} fill={primaryColor} />}
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 appearance-none rounded-full cursor-pointer transition"
          style={{
            background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} 100%)`,
          }}
        />
        <span className="text-[10px] flex-shrink-0 opacity-80" style={{ color: primaryColor }}>
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export const Messages = ({ 
  initialInviteCode, 
  onInviteHandled, 
  initialTab = 'chats',
  initialGazeboId 
}: { 
  initialInviteCode?: string | null, 
  onInviteHandled?: () => void,
  initialTab?: 'chats' | 'gazebos',
  initialGazeboId?: string | null
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'gazebos'>(initialTab);
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<AppMessage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [mediaInputMode, setMediaInputMode] = useState<'file' | 'url' | null>(null);

  const [reactionMenu, setReactionMenu] = useState<{ messageId: string, x: number, y: number, isOutgoing: boolean } | null>(null);
  // NEW: State to control the "Who Reacted" modal
  const [viewingReactionsFor, setViewingReactionsFor] = useState<AppMessage | null>(null);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // --- EDIT & DELETE STATE ---
  const [editingMessage, setEditingMessage] = useState<AppMessage | null>(null);

  // --- GIF PICKER STATE ---
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);

  // --- ACTIONS ---
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setReactionMenu(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    setReactionMenu(null);
    
    // 1. Optimistic Update (Immediate UI feedback)
    setMessages(prev => prev.map(m => m.id === messageId ? { 
        ...m, 
        is_deleted: true
    } : m));

    // 2. Database Update
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_deleted: true
      })
      .eq('id', messageId)
      .eq('sender_id', user!.id)
      .select(); 

    if (error) {
        console.error("Error deleting message:", error);
        // Optional: Revert UI if failed
        loadMessages(selectedUser!.id);
    }
  };

  const handleEditMessage = (message: AppMessage) => {
    setEditingMessage(message);
    setContent(message.content);
    setReactionMenu(null);
    fileInputRef.current?.focus();
  };

  const handleUpdateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !content.trim()) return;

    const previousMessages = [...messages];
    
    // 1. Optimistic Update
    setMessages(prev => prev.map(m => m.id === editingMessage.id ? { 
        ...m, 
        content: content, 
        is_edited: true 
    } : m));
    
    setEditingMessage(null);
    setContent('');

    // 2. Database Update
    const { error } = await supabase
      .from('messages')
      .update({ 
        content: content, 
        is_edited: true 
      })
      .eq('id', editingMessage.id)
      .eq('sender_id', user!.id)
      .select();

    if (error) {
      console.error("Error updating message:", error);
      setMessages(previousMessages); // Revert on error
      alert("Failed to update message");
    }
  };

  // --- TENOR API ---
  const searchGifs = async (query: string = '') => {
      const apiKey = import.meta.env.VITE_TENOR_API_KEY;
      if (!apiKey) return;
      const searchUrl = query 
        ? `https://tenor.googleapis.com/v2/search?q=${query}&key=${apiKey}&client_key=gazebo_app&limit=12&media_filter=minimal`
        : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=gazebo_app&limit=12&media_filter=minimal`;
      
      try {
          const res = await fetch(searchUrl);
          const data = await res.json();
          setGifs(data.results || []);
      } catch (e) {
          console.error("Tenor Error", e);
      }
  };

  useEffect(() => {
      if (showGifPicker) searchGifs(gifQuery);
  }, [showGifPicker, gifQuery]);

  // Handle click outside to close GIF picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
    };

    if (showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGifPicker]);

  const sendGif = async (url: string) => {
      setShowGifPicker(false);
      setMediaInputMode(null);
      
      const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user!.id,
        recipient_id: selectedUser!.id,
        content: '',
        media_url: url,
        media_type: 'image', // Treat GIFs as images
      })
      .select().single();

      if(data) {
          scrollToBottom();
      }
  };

  // --- MEDIA GALLERY STATE ---
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [galleryMedia, setGalleryMedia] = useState<AppMessage[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  const loadGalleryMedia = async () => {
    if (!user || !selectedUser) return;
    setIsGalleryLoading(true);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id})`)
      .not('media_url', 'is', null)
      .neq('media_url', '')
      .order('created_at', { ascending: false });

    if (data) {
        setGalleryMedia(data as AppMessage[]);
    }
    setIsGalleryLoading(false);
  };

  const middleTruncate = (str: string, len: number) => {
    if (str.length <= len) return str;
    const start = str.slice(0, Math.floor(len / 2));
    const end = str.slice(-Math.floor(len / 2));
    return `${start}...${end}`;
  };
  
  const { user } = useAuth();

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    // CHANGE: Find ANY existing reaction by the user on this message (not just matching emoji)
    const existingReaction = message?.reactions?.find(r => r.user_id === user.id);

    if (existingReaction) {
        if (existingReaction.emoji === emoji) {
            // User clicked the same emoji -> Remove it (Toggle off)
            await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
        } else {
            // User clicked a different emoji -> Update existing reaction (One reaction per user)
            await supabase.from('message_reactions')
                .update({ emoji: emoji })
                .eq('id', existingReaction.id);
        }
    } else {
        // No reaction yet -> Insert new one
        await supabase.from('message_reactions').insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji,
            message_type: 'dm'
        });
    }

    setReactionMenu(null);
  }, [user, messages]);

  // NEW: Helper to remove a specific reaction (used in Modal)
  const handleRemoveReaction = async (reactionId: string) => {
      await supabase.from('message_reactions').delete().eq('id', reactionId);
  };

  // --- VOICE MESSAGE STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // --- PAGINATION STATE ---
  const [messagePage, setMessagePage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const MESSAGE_PAGE_SIZE = 10;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);

  const typingChannelRef = useRef<any>(null);
  const outgoingTypingChannelRef = useRef<any>(null);

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return;
    
    // Update DB
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', user.id)
      .eq('sender_id', senderId)
      .eq('read', false);

    // If successful, tell the rest of the app to update the badge
    if (!error) {
        window.dispatchEvent(new CustomEvent('messagesRead'));
    }
  };

  const isUserOnline = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    return (now.getTime() - lastSeenDate.getTime()) < 60000; // user online status calculation delay
  };

  const formatLastSeen = (lastSeen: string | null | undefined): string | null => {
    if (!lastSeen) return null;

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const ONLINE_THRESHOLD = 60000; // user online status calculation delay
    if (diffMs < ONLINE_THRESHOLD) return null;

    const diffSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSeconds / (60 * 60 * 24));
    const hours = Math.floor((diffSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);

    let parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
    } else if (hours > 0) {
        parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
    } else if (minutes > 0) {
        parts.push(`${minutes}m`);
    }

    if (parts.length === 0) return null; 
    return `${parts.join(' ')} ago`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- SCROLL TO REPLY FUNCTION ---
  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: Add a visual flash effect
      element.classList.add('ring-2', 'ring-[rgb(var(--color-primary))]', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[rgb(var(--color-primary))]', 'ring-offset-2');
      }, 1000);
    } else {
      // Optional: Handle case where message is not loaded (pagination)
      console.log('Message not currently loaded in view');
    }
  };

  const goToProfile = async (profileId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', profileId)
      .single();
    if (data) {
      window.history.replaceState({}, '', `/?${data.username}`);
    }
    window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
  };

  const loadConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        created_at,
        sender:profiles!sender_id(id, username, display_name, avatar_url, verified, last_seen),
        recipient:profiles!recipient_id(id, username, display_name, avatar_url, verified, last_seen)
      `)
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    const convMap = new Map<string, { profile: Profile; latest: string }>();
    data?.forEach((msg: any) => {
      const other = msg.sender_id === user!.id ? msg.recipient : msg.sender;
      if (other) {
        const existing = convMap.get(other.id);
        if (!existing || msg.created_at > existing.latest) {
          convMap.set(other.id, { profile: other, latest: msg.created_at });
        }
      }
    });

    const sorted = Array.from(convMap.values())
      .sort((a, b) => b.latest.localeCompare(a.latest))
      .map(c => c.profile);

    setConversations(sorted);
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleOpenDM = (e: any) => {
      const profile = e.detail;
      if (profile && profile.id !== user?.id) {
        setSelectedUser(profile);
        setShowSidebar(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM);
    return () => window.removeEventListener('openDirectMessage', handleOpenDM);
  }, [user]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // NEW: Listen for URL query params to open chat directly
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const username = params.get('user');
      if (username && user) {
          const fetchUser = async () => {
              const { data } = await supabase.from('profiles').select('*').eq('username', username).single();
              if (data && data.id !== user.id) {
                  setSelectedUser(data);
                  setShowSidebar(false);
              }
          };
          fetchUser();
      }
  }, [user]); // Runs on mount or when user loads

  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(20);
      setSearchResults(data || []);
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedUser) {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      if (outgoingTypingChannelRef.current) {
        outgoingTypingChannelRef.current.unsubscribe();
        outgoingTypingChannelRef.current = null;
      }
      return;
    }

    loadMessages(selectedUser.id);
    markMessagesAsRead(selectedUser.id);
    setShowSidebar(false);

    const messageChannel = supabase
      .channel(`messages:${selectedUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' }, // Change event to '*' to catch UPDATES
        async (payload) => {
          const eventType = payload.eventType;
          const newRecord = payload.new as AppMessage;

          // 1. Handle New Messages (INSERT)
          if (eventType === 'INSERT') {
            if (
              (newRecord.sender_id === user!.id && newRecord.recipient_id === selectedUser.id) ||
              (newRecord.sender_id === selectedUser.id && newRecord.recipient_id === user!.id)
            ) {
              let finalMsg = newRecord;
              if (finalMsg.reply_to_id) {
                const { data: repliedToMsgData } = await supabase
                  .from('messages')
                  .select('id, content, sender_id, media_type')
                  .eq('id', finalMsg.reply_to_id)
                  .single();
                
                if (repliedToMsgData) {
                  finalMsg = { ...finalMsg, reply_to: repliedToMsgData } as AppMessage; 
                }
              }

              if (newRecord.sender_id === selectedUser.id && newRecord.recipient_id === user!.id) {
                markMessagesAsRead(selectedUser.id);
                finalMsg.read = true;
              }

              setMessages((prev) => [...prev, finalMsg]);
              scrollToBottom();
              loadConversations();
            }
          }

          // 2. Handle Edits and Deletes (UPDATE)
          if (eventType === 'UPDATE') {
             setMessages((prev) => prev.map((msg) => {
                if (msg.id === newRecord.id) {
                   // Merge the new DB data (content, is_edited, is_deleted)
                   // into the existing object to preserve joined data (reactions, replies)
                   return {
                      ...msg,
                      content: newRecord.content,
                      media_url: newRecord.media_url,
                      media_type: newRecord.media_type,
                      is_edited: newRecord.is_edited,
                      is_deleted: newRecord.is_deleted,
                      read: newRecord.read
                   };
                }
                return msg;
             }));
          }
        }
      )
      // ADDED: Listen for changes to message reactions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        async (payload) => {
           // Handle DELETE
           if (payload.eventType === 'DELETE') {
               const oldReaction = payload.old as any;
               
               // Update Messages List
               setMessages(prev => prev.map(msg => {
                   // Check if this message has the reaction being deleted
                   if (msg.reactions?.some(r => r.id === oldReaction.id)) {
                       return { 
                           ...msg, 
                           reactions: msg.reactions.filter(r => r.id !== oldReaction.id) 
                       };
                   }
                   return msg;
               }));
               
               // Update Modal if open
               setViewingReactionsFor(prev => {
                   if (prev && prev.reactions?.some(r => r.id === oldReaction.id)) {
                       return { ...prev, reactions: prev.reactions.filter(r => r.id !== oldReaction.id) };
                   }
                   return prev;
               });

           } 
           // Handle INSERT
           else if (payload.eventType === 'INSERT') {
               const newReaction = payload.new as any;
               const messageId = newReaction.message_id;

               // Fetch full profile data for the new reaction
               const { data: reactionData } = await supabase
                   .from('message_reactions')
                   .select('*, profiles(id, username, display_name, avatar_url)')
                   .eq('id', newReaction.id)
                   .single();
               
               if (reactionData) {
                   setMessages(prev => prev.map(msg => {
                       if (msg.id === messageId) {
                           const currentReactions = msg.reactions || [];
                           // Prevent duplicates
                           if (currentReactions.some(r => r.id === reactionData.id)) return msg;
                           return { ...msg, reactions: [...currentReactions, reactionData] };
                       }
                       return msg;
                   }));
                   
                   // Update Modal if open
                   setViewingReactionsFor(prev => {
                       if (prev && prev.id === messageId && prev.reactions) {
                           if (prev.reactions.some(r => r.id === reactionData.id)) return prev;
                           return { ...prev, reactions: [...prev.reactions, reactionData] };
                       }
                       return prev;
                   });
               }
           } 
           // Handle UPDATE (Emoji switch)
           else if (payload.eventType === 'UPDATE') {
               const newReaction = payload.new as any;
               
               // Update Messages List
               setMessages(prev => prev.map(msg => {
                   // Check if this message has the reaction being updated
                   if (msg.reactions?.some(r => r.id === newReaction.id)) {
                       return {
                           ...msg,
                           reactions: msg.reactions.map(r => 
                               r.id === newReaction.id 
                               // Only update the emoji, keep the existing profile data!
                               ? { ...r, emoji: newReaction.emoji } 
                               : r
                           )
                       };
                   }
                   return msg;
               }));

               // Update Modal if open
               setViewingReactionsFor(prev => {
                   if (prev && prev.reactions?.some(r => r.id === newReaction.id)) {
                       return {
                           ...prev,
                           reactions: prev.reactions.map(r => 
                               r.id === newReaction.id 
                               ? { ...r, emoji: newReaction.emoji } 
                               : r
                           )
                       };
                   }
                   return prev;
               });
           }
        }
      )
      .subscribe();

    const incomingChannelName = `typing:${selectedUser.id}:${user!.id}`;
    typingChannelRef.current = supabase.channel(incomingChannelName);

    typingChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannelRef.current.presenceState();
        const typing = Object.values(state).flat().some((p: any) => p.typing === true);
        setIsOtherTyping(typing);
      })
      .subscribe();

    const outgoingChannelName = `typing:${user!.id}:${selectedUser.id}`;
    outgoingTypingChannelRef.current = supabase.channel(outgoingChannelName);

    outgoingTypingChannelRef.current
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await outgoingTypingChannelRef.current.track({ typing: false });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      if (outgoingTypingChannelRef.current) {
        outgoingTypingChannelRef.current.untrack();
        outgoingTypingChannelRef.current.unsubscribe();
        outgoingTypingChannelRef.current = null;
      }
    };
  }, [selectedUser, user]);

  const sendTypingStatus = async (typing: boolean) => {
    if (!outgoingTypingChannelRef.current) return;
    try {
      await outgoingTypingChannelRef.current.track({ typing });
    } catch (err) {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContent(value);

    if (value.trim()) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);
    } else {
      sendTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // 1. Handle Files (Images, etc)
    if (e.clipboardData.files.length > 0) {
      const pastedFile = e.clipboardData.files[0];
      setFile(pastedFile);
      setRemoteUrl(''); // Clear URL if file is prioritized
      setMediaInputMode(null); // Reset input mode to default
      e.preventDefault(); // Prevent default paste behavior (optional, depending on preference)
      return;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file && !remoteUrl.trim() || !selectedUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    let media_url = null;
    let media_type = null;

    if (file) {
      if (file.type.startsWith('audio/')) {
        media_type = 'audio';
      }
      
      const result = await uploadMedia(file, 'messages', (percent) => {
        setUploadProgress(percent);
      });
      if (!result) {
        setIsUploading(false);
        return;
      }
      media_url = result.url;
      media_type = media_type || result.type;
    } else if (remoteUrl.trim()) {
      media_url = remoteUrl.trim();
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        media_type = 'image';
      } else if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        media_type = 'video';
      } else if (remoteUrl.match(/\.(mp3|wav|ogg|m4a|weba)$/i)) {
        media_type = 'audio';
      } else {
        media_type = 'document';
      }
    }

    sendTypingStatus(false);
    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user!.id,
        recipient_id: selectedUser.id,
        content,
        media_url,
        media_type,
        reply_to_id: replyingTo ? replyingTo.id : null,
      })
      .select()
      .single();

    if (data) {
      setContent('');
      setFile(null);
      setRemoteUrl('');
      setReplyingTo(null);
      setIsUploading(false);
      setUploadProgress(0);
      setMediaInputMode(null);
    }
  };

  const loadMessages = async (recipientId: string) => {
    setMessages([]);
    setMessagePage(0);
    setHasMoreMessages(true);
    setIsLoadingMore(false);

    // FIX: Explicitly select reactions and the profile of the reactor
    const { data: messagesData, count } = await supabase
      .from('messages')
      .select(`
        id, sender_id, recipient_id, content, created_at, media_url, media_type, read, reply_to_id,
        reactions:message_reactions(
          id, emoji, user_id,
          profiles(id, username, display_name, avatar_url)
        )
      `, { count: 'exact' })
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: false })
      .range(0, MESSAGE_PAGE_SIZE - 1);

    if (!messagesData || messagesData.length === 0) {
      setHasMoreMessages(false);
      return;
    }
    
    const replyIds = messagesData
      .map(m => m.reply_to_id)
      .filter((id): id is string => id !== null && id !== undefined);

    let repliesMap = new Map<string, AppMessage['reply_to']>();

    if (replyIds.length > 0) {
      const { data: repliesData } = await supabase
        .from('messages')
        .select('id, content, sender_id, media_type')
        .in('id', replyIds);

      if (repliesData) {
        repliesData.forEach(r => repliesMap.set(r.id, r));
      }
    }

    const finalMessages = messagesData.map(msg => ({
      ...msg,
      reply_to: msg.reply_to_id ? repliesMap.get(msg.reply_to_id) || null : null,
    }));
    
    setMessages(finalMessages.reverse() as AppMessage[]);

    if (messagesData.length < MESSAGE_PAGE_SIZE || (count !== null && count <= MESSAGE_PAGE_SIZE)) {
      setHasMoreMessages(false);
    }

    setTimeout(scrollToBottom, 100);
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !selectedUser) return;

    setIsLoadingMore(true);
    const nextPage = messagePage + 1;
    const from = nextPage * MESSAGE_PAGE_SIZE;
    const to = from + MESSAGE_PAGE_SIZE - 1;

    const container = messagesContainerRef.current;
    const oldScrollHeight = container?.scrollHeight;

    // FIX: Explicitly select reactions and the profile of the reactor for pagination too
    const { data: messagesData, count } = await supabase
      .from('messages')
      .select(`
        id, sender_id, recipient_id, content, created_at, media_url, media_type, read, reply_to_id,
        reactions:message_reactions(
          id, emoji, user_id,
          profiles(id, username, display_name, avatar_url)
        )
      `, { count: 'exact' })
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (messagesData && messagesData.length > 0) {
      const replyIds = messagesData
        .map(m => m.reply_to_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let repliesMap = new Map<string, AppMessage['reply_to']>();

      if (replyIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('messages')
          .select('id, content, sender_id, media_type')
          .in('id', replyIds);

        if (repliesData) {
          repliesData.forEach(r => repliesMap.set(r.id, r));
        }
      }

      const finalMessages = messagesData.map(msg => ({
        ...msg,
        reply_to: msg.reply_to_id ? repliesMap.get(msg.reply_to_id) || null : null,
      }));

      setMessages(prev => [...(finalMessages as AppMessage[]).reverse(), ...prev]);
      setMessagePage(nextPage);

      if (container && oldScrollHeight) {
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - oldScrollHeight;
        }, 0);
      }
    }

    if (!messagesData || messagesData.length < MESSAGE_PAGE_SIZE || (count !== null && messages.length + (messagesData?.length || 0) >= count)) {
      setHasMoreMessages(false);
    }

    setIsLoadingMore(false);
  };
  
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
    }
  };

  const dispatchStartCall = (targetUser: Profile, type: 'audio' | 'video') => {
    window.dispatchEvent(new CustomEvent('startCall', { 
      detail: { targetUser, type }
    }));
  };

  // --- VOICE RECORDING FUNCTIONS ---

  const handleStartRecording = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording is not supported by your browser.");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const options = { mimeType: 'audio/webm' };
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          recorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const cleanExt = mimeType.split('/')[1]?.split(';')[0] || 'weba';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioFile = new File([audioBlob], `voice-message.${cleanExt}`, { type: mimeType });
          
          setFile(audioFile);
          setIsRecording(false);
          
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
        setFile(null);
        setRemoteUrl('');
        setMediaInputMode(null);
      })
      .catch(err => {
        console.error("Mic error:", err);
        alert("Mic not found or permission was denied. Please check your browser settings.");
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const displayList = searchQuery ? searchResults : conversations;

  const getPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        return <img src={url} className="max-h-24 rounded-lg shadow-sm" alt="Preview" />;
      }
      if (file.type.startsWith('video/')) {
        return <video src={url} className="max-h-24 rounded-lg shadow-sm" controls />;
      }
      if (file.type.startsWith('audio/')) {
        return <AudioPlayer src={url} isOutgoing={true} />; 
      }
      return (
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text))] p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
          <FileText size={16} className="text-[rgb(var(--color-accent))]" />
          <span>{file.name}</span>
        </div>
      );
    }
    if (remoteUrl) {
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return <img src={remoteUrl} className="max-h-24 rounded-lg shadow-sm" alt="Remote preview" />;
      }
      if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        return <video src={remoteUrl} className="max-h-24 rounded-lg shadow-sm" controls />;
      }
      if (remoteUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return <AudioPlayer src={remoteUrl} isOutgoing={true} />;
      }
      return (
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text))] p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
          <Link size={16} className="text-[rgb(var(--color-accent))]" />
          <span className="truncate max-w-[150px]">{remoteUrl}</span>
        </div>
      );
    }
    return null;
  };

  // === GAZEBOS INTERFACE OVERRIDE ===
  if (activeTab === 'gazebos') {
    return (
      <div className="flex h-full bg-[rgb(var(--color-background))] flex-col md:flex-row text-[rgb(var(--color-text))]">
        <Suspense fallback={<div className="p-4">Loading Calls...</div>}>
          <Calls />
        </Suspense>
        
        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex-shrink-0 p-2 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] flex gap-2 z-50">
          <button 
            onClick={() => setActiveTab('chats')} 
            className="flex-1 p-2 rounded font-bold text-sm bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]"
          >
            Chats
          </button>
          <button 
            className="flex-1 p-2 rounded font-bold text-sm bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))]"
          >
            Gazebos
          </button>
        </div>
        
        {/* Desktop Sidebar Stub */}
        <div className="hidden md:flex flex-col w-16 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] items-center py-4 gap-4 z-50 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('chats')} 
            title="Direct Messages" 
            className="p-3 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
          >
            <MessageSquare size={24} />
          </button>
          <button 
            title="Gazebos" 
            className="p-3 rounded-full bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))] shadow-md transition"
          >
            <Users size={24} />
          </button>
        </div>

        {/* Main Gazebo Content */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden">
             <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Gazebos...</div>}>
                 <Gazebos 
                    initialInviteCode={initialInviteCode} 
                    onInviteHandled={onInviteHandled}
                    initialGazeboId={initialGazeboId}
                 />
             </Suspense>
        </div>
      </div>
    );
  }

    // === STANDARD CHAT INTERFACE ===
  return (
    <div className="flex h-full bg-[rgb(var(--color-background))] overflow-hidden">
      <Suspense fallback={null}>
        <Calls />
      </Suspense>
      
      {/* Enhanced Context Menu Overlay */}
      {reactionMenu && (
        <div 
            className="fixed inset-0 z-50" 
            onClick={() => setReactionMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setReactionMenu(null); }}
        >
            <div 
                className="absolute bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl flex flex-col z-50 pointer-events-auto border border-[rgb(var(--color-border))] animate-in fade-in zoom-in-95 duration-200 origin-bottom overflow-hidden min-w-[180px]"
                style={{ 
                    top: reactionMenu.y - 120, 
                    left: Math.min(window.innerWidth - 200, Math.max(10, reactionMenu.x - 90)) 
                }}
                onClick={e => e.stopPropagation()} 
            >
                {/* 1. Emoji Row */}
                <div className="flex items-center gap-1 p-2 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-hover))] justify-center">
                     {QUICK_EMOJIS.slice(0, 4).map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(reactionMenu.messageId, emoji)} className="text-xl p-1.5 hover:scale-125 transition">
                            {emoji}
                        </button>
                    ))}
                    <button onClick={() => setShowFullEmojiPicker(true)} className="p-1 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-accent))]">
                        <Plus size={18} />
                    </button>
                </div>

                {/* 2. Action List */}
                <div className="flex flex-col p-1">
                    <button onClick={() => handleCopyMessage(messages.find(m => m.id === reactionMenu.messageId)?.content || "")} className="flex items-center gap-3 px-3 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] rounded-lg text-left">
                        <Copy size={16} /> Copy Text
                    </button>
                    
                    {reactionMenu.isOutgoing && (
                        <>
                            <button onClick={() => handleEditMessage(messages.find(m => m.id === reactionMenu.messageId) as AppMessage)} className="flex items-center gap-3 px-3 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] rounded-lg text-left">
                                <Edit2 size={16} /> Edit Message
                            </button>
                            <button onClick={() => handleDeleteMessage(reactionMenu.messageId)} className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg text-left">
                                <Trash2 size={16} /> Delete Message
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Full Emoji Picker Modal */}
      {showFullEmojiPicker && reactionMenu && (
          <EmojiPicker 
              onSelect={(emoji) => {
                  handleReaction(reactionMenu.messageId, emoji);
                  setShowFullEmojiPicker(false);
              }}
              onClose={() => setShowFullEmojiPicker(false)}
          />
      )}

      {/* Reaction Details Modal */}
      {viewingReactionsFor && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setViewingReactionsFor(null)}
        >
            <div 
                className="bg-[rgb(var(--color-surface))] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))] transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))]">
                    <h3 className="font-bold text-[rgb(var(--color-text))]">Reactions</h3>
                    <button 
                        onClick={() => setViewingReactionsFor(null)}
                        className="p-1.5 rounded-full hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="p-3 bg-[rgb(var(--color-surface-hover))] text-xs text-[rgb(var(--color-text-secondary))] truncate mx-4 mt-4 rounded-xl border border-[rgb(var(--color-border))] opacity-70 italic">
                         {viewingReactionsFor.content || (viewingReactionsFor.media_type ? `[${viewingReactionsFor.media_type}]` : 'Message')}
                    </div>

                    <div className="p-2 space-y-1">
                        {viewingReactionsFor.reactions?.map(r => (
                            <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-[rgb(var(--color-surface-hover))] rounded-2xl transition group">
                                <div className="relative">
                                    <img 
                                        src={r.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.profiles?.username}`} 
                                        alt={r.profiles?.username}
                                        className="w-8 h-8 rounded-full object-cover bg-[rgb(var(--color-background))]" 
                                    />
                                    <div className="absolute -bottom-1 -right-1 text-sm leading-none drop-shadow-sm">
                                        {r.emoji}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-[rgb(var(--color-text))] flex items-center gap-1">
                                        {r.profiles?.display_name || 'Unknown'}
                                        {r.user_id === user?.id && <span className="text-[10px] text-[rgb(var(--color-text-secondary))] font-normal bg-[rgb(var(--color-surface-hover))] px-1.5 py-0.5 rounded-full">You</span>}
                                    </div>
                                </div>
                                
                                {r.user_id === user?.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveReaction(r.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[rgb(var(--color-text-secondary))] hover:text-red-500 hover:bg-[rgb(var(--color-surface-hover))] rounded-full transition"
                                        title="Remove reaction"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MEDIA GALLERY MODAL */}
      {showMediaGallery && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setShowMediaGallery(false)}
        >
            <div 
                className="bg-[rgb(var(--color-surface))] w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-surface))]">
                    <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Shared Media</h3>
                    <button 
                        onClick={() => setShowMediaGallery(false)}
                        className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-xs md:text-sm font-medium">
                    {['image', 'video', 'audio', 'document'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setGalleryTab(tab as any)}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 transition uppercase tracking-wide ${galleryTab === tab ? 'text-[rgb(var(--color-accent))] border-b-2 border-[rgb(var(--color-accent))] bg-[rgba(var(--color-accent),0.05)]' : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
                        >
                            {tab === 'image' && <ImageIcon size={16} />}
                            {tab === 'video' && <Film size={16} />}
                            {tab === 'audio' && <Music size={16} />}
                            {tab === 'document' && <FileIcon size={16} />}
                            <span className="hidden sm:inline">{tab}s</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[rgb(var(--color-background))] custom-scrollbar">
                    {isGalleryLoading ? (
                        <div className="flex h-full items-center justify-center text-[rgb(var(--color-text-secondary))] animate-pulse">
                            Loading media...
                        </div>
                    ) : (
                        <>
                            {galleryMedia.filter(m => m.media_type === galleryTab).length === 0 ? (
                                <div className="flex h-full items-center justify-center text-[rgb(var(--color-text-secondary))] flex-col gap-2 opacity-50">
                                    <Folder size={48} strokeWidth={1} />
                                    <span>No shared {galleryTab}s</span>
                                </div>
                            ) : (
                                <>
                                    {(galleryTab === 'image' || galleryTab === 'video') && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                                            {galleryMedia.filter(m => m.media_type === galleryTab).map(msg => (
                                                <div key={msg.id} className="aspect-square relative group bg-[rgb(var(--color-surface))] overflow-hidden rounded-md border border-[rgb(var(--color-border))]">
                                                    {galleryTab === 'image' ? (
                                                        <a href={msg.media_url!} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                            <img src={msg.media_url!} className="w-full h-full object-cover hover:scale-105 transition duration-300" alt="Shared" />
                                                        </a>
                                                    ) : (
                                                        <video src={msg.media_url!} className="w-full h-full object-cover" controls />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(galleryTab === 'audio' || galleryTab === 'document') && (
                                        <div className="space-y-2">
                                            {galleryMedia.filter(m => m.media_type === galleryTab).map(msg => (
                                                <div key={msg.id} className="flex items-center gap-3 p-3 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-accent))] transition">
                                                    <div className="w-10 h-10 rounded-full bg-[rgba(var(--color-accent),0.1)] flex items-center justify-center flex-shrink-0 text-[rgb(var(--color-accent))]">
                                                        {galleryTab === 'audio' ? <Mic size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {galleryTab === 'document' ? (
                                                            <a href={msg.media_url!} target="_blank" rel="noopener noreferrer" className="block group">
                                                                 <p className="font-medium text-sm text-[rgb(var(--color-text))] truncate group-hover:text-[rgb(var(--color-accent))] transition">
                                                                    {msg.content || middleTruncate(msg.media_url!.split('/').pop() || 'File', 30)}
                                                                </p>
                                                                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                                                                    {new Date(msg.created_at).toLocaleDateString()}
                                                                </p>
                                                            </a>
                                                        ) : (
                                                            <>
                                                                <p className="text-xs text-[rgb(var(--color-text-secondary))] mb-1">
                                                                    {new Date(msg.created_at).toLocaleDateString()}
                                                                </p>
                                                                <AudioPlayer src={msg.media_url!} isOutgoing={false} />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-80 lg:w-96 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative fixed inset-y-0 left-0 z-40 md:z-auto`}>
        
        <div className="px-4 pt-16 md:pt-4 border-b border-[rgb(var(--color-border))] sticky top-0 bg-[rgb(var(--color-surface))] z-10">
          <div className="flex gap-2 mb-4 bg-[rgb(var(--color-surface-hover))] p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'chats' ? 'bg-[rgb(var(--color-background))] shadow-sm text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))]'}`}
             >
                Chats
             </button>
             <button 
                onClick={() => setActiveTab('gazebos')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'gazebos' ? 'bg-[rgb(var(--color-background))] shadow-sm text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))]'}`}
             >
                Gazebos
             </button>
          </div>

          <h2 className="text-xl font-extrabold text-[rgb(var(--color-text))] mb-3 px-1">Messages</h2>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-3 text-[rgb(var(--color-text-secondary))]" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-accent))] focus:ring-1 focus:ring-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {displayList.length === 0 && (
            <div className="p-8 text-center text-[rgb(var(--color-text-secondary))] flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              <span className="text-sm">{searchQuery ? 'No users found' : 'Start a new chat'}</span>
            </div>
          )}

          {displayList.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                setShowSidebar(false);
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 p-3 transition border-b border-[rgb(var(--color-border))] border-opacity-40 hover:bg-[rgb(var(--color-surface-hover))] ${selectedUser?.id === u.id ? 'bg-[rgba(var(--color-accent),0.05)] border-l-4 border-l-[rgb(var(--color-accent))] pl-2' : ''}`}
            >
              <div className="relative">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                  className="w-12 h-12 rounded-full object-cover bg-[rgb(var(--color-background))]"
                  alt=""
                />
                {isUserOnline(u.last_seen) && (
                  <div
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]"
                  />
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                  {u.display_name}
                  {u.verified && <BadgeCheck size={14} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                </div>
                <div className="text-xs text-[rgb(var(--color-text-secondary))] truncate mt-0.5">
                  {isUserOnline(u.last_seen)
                    ? <span className="text-green-500 font-medium">Online</span>
                    : formatLastSeen(u.last_seen) || `@${u.username}`
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-[rgb(var(--color-background))] transition-all duration-300 ease-in-out ${selectedUser ? '' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] p-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
              <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition active:scale-95">
                <ArrowLeft size={20} className="text-[rgb(var(--color-text))]" />
              </button>
              
              <button onClick={() => goToProfile(selectedUser.id)} className="flex items-center gap-3 flex-1 min-w-0 group">
                <div className="relative">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[rgb(var(--color-accent))] transition"
                    alt=""
                  />
                  {isUserOnline(selectedUser.last_seen) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-bold text-sm flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                    {selectedUser.display_name}
                    {selectedUser.verified && <BadgeCheck size={14} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-[rgb(var(--color-text-secondary))] truncate">
                  {isUserOnline(selectedUser.last_seen) 
                    ? <span className="text-green-500 font-medium">Active now</span>
                    : selectedUser.last_seen 
                        ? `Last seen ${new Date(selectedUser.last_seen).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                        : `@${selectedUser.username}`
                  }
                </div>
                </div>
              </button>
              
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => dispatchStartCall(selectedUser, 'audio')}
                  className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-accent))]"
                  title="Audio call"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={() => dispatchStartCall(selectedUser, 'video')}
                  className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-accent))]"
                  title="Video call"
                >
                  <Video size={18} />
                </button>
                <button
                  onClick={() => {
                      setShowMediaGallery(true);
                      loadGalleryMedia();
                  }}
                  className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-accent))]"
                  title="View Media"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-1 bg-[rgb(var(--color-background))]"
            >
              {isLoadingMore && (
                <div className="flex justify-center p-4 w-full">
                  <div className="logo-loading-container w-6 h-6 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox={SVG_VIEWBOX} className="logo-svg">
                          <defs><clipPath id="logo-clip"><rect id="clip-rect" x="0" y="0" width="100%" height="100%" /></clipPath></defs>
                          <path d={SVG_PATH} fill="none" stroke="rgb(var(--color-primary))" strokeWidth="10" strokeOpacity="0.1" />
                          <path d={SVG_PATH} fill="rgb(var(--color-primary))" clipPath="url(#logo-clip)" className="logo-fill-animated" />
                      </svg>
                  </div>
                </div>
              )}
            
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user!.id;
                // Check if the next message is from the same user to group visually
                const nextMsg = messages[index + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                
                return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex w-full mb-1 group relative ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                    {/* Action Buttons (Hover) */}
                    {isMe && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition duration-200 mr-2 self-center">
                            <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setReactionMenu({ messageId: msg.id, x: rect.left, y: rect.top, isOutgoing: true }); }} className="p-1.5 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]">
                                <Smile size={14} />
                            </button>
                            <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]">
                                <CornerUpLeft size={14} />
                            </button>
                        </div>
                    )}

                  {/* Message Bubble */}
                  <div
                    onContextMenu={(e) => {
                        e.preventDefault(); // Prevent native browser context menu
                        const rect = e.currentTarget.getBoundingClientRect();
                        setReactionMenu({ messageId: msg.id, x: rect.left + (rect.width / 2), y: rect.top, isOutgoing: isMe });
                    }}
                    onTouchStart={(e) => {
                        isLongPress.current = false;
                        longPressTimer.current = setTimeout(() => {
                            isLongPress.current = true;
                            const rect = e.currentTarget.getBoundingClientRect();
                            // Mobile vibration feedback
                            if (navigator.vibrate) navigator.vibrate(50);
                            setReactionMenu({ messageId: msg.id, x: rect.left + (rect.width / 2), y: rect.top, isOutgoing: isMe });
                        }, 500); // 500ms long press
                    }}
                    onTouchEnd={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    }}
                    onTouchMove={() => {
                        // If user scrolls, cancel long press
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    }}
                    // Keep the existing classes
                    className={`relative max-w-[85%] md:max-w-[70%] lg:max-w-[60%] min-w-0 px-3 py-1.5 shadow-sm break-words select-none cursor-pointer
                      ${isMe 
                        ? `bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))] rounded-2xl rounded-tr-sm ${!isLastInGroup ? 'mb-0.5' : ''}`
                        : `bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-2xl rounded-tl-sm ${!isLastInGroup ? 'mb-0.5' : ''}`
                      }
                      ${msg.is_deleted ? 'opacity-70 italic' : ''}
                    `}
                  >
                    {/* Soft Delete Masking */}
                    {msg.is_deleted ? (
                        <div className="flex items-center gap-2 text-sm py-1">
                            <Trash2 size={14} className="opacity-50" />
                            <span>[Message Deleted]</span>
                        </div>
                    ) : (
                    <>
                    {/* Reply Context */}
                    {msg.reply_to_id && msg.reply_to && (() => {
                      const repliedToMsg = msg.reply_to;
                      const isReplyToSelf = repliedToMsg.sender_id === user!.id;
                      
                      return (
                        <div 
                            onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.reply_to_id!); }}
                            className={`flex items-center gap-2 p-1.5 rounded-lg mb-1 cursor-pointer transition select-none ${
                                isMe ? 'bg-black/10 hover:bg-black/20' : 'bg-[rgb(var(--color-surface-hover))] hover:bg-black/5'
                            }`}
                        >
                          <div className={`w-0.5 h-6 rounded-full self-stretch ${isMe ? 'bg-white/50' : 'bg-[rgb(var(--color-accent))]'}`} />
                          <div className="flex-1 min-w-0">
                             <div className={`text-[10px] font-bold ${isMe ? 'text-white/90' : 'text-[rgb(var(--color-accent))]'}`}>
                                {isReplyToSelf ? 'You' : selectedUser?.display_name}
                             </div>
                            <div className={`text-[10px] truncate ${isMe ? 'text-white/70' : 'text-[rgb(var(--color-text-secondary))]'}`}>
                              {repliedToMsg.content 
                                            ? (repliedToMsg.content.length > 20 ? repliedToMsg.content.substring(0, 20) + '...' : repliedToMsg.content)
                                            : <span className="italic">[{repliedToMsg.media_type || '...'}]</span>
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Media Content */}
                    {msg.media_url && !msg.is_deleted && (
                      <div className={`mb-1 ${msg.content ? "pb-1" : ""}`}>
                        {msg.media_type === 'image' && (
                          <img src={msg.media_url} className="rounded-lg w-full h-auto max-h-80 object-cover" alt="Image" loading="lazy" />
                        )}
                        {msg.media_type === 'video' && (
                          <video controls className="rounded-lg w-full max-h-80 bg-black">
                            <source src={msg.media_url} />
                          </video>
                        )}
                        {msg.media_type === 'audio' && (
                            <div className="pt-1">
                                <AudioPlayer src={msg.media_url} isOutgoing={isMe} />
                            </div>
                        )}
                        {msg.media_type === 'document' && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-[rgb(var(--color-surface-hover))] hover:bg-[rgb(var(--color-border))]'}`}
                          >
                            <FileText size={16} /> 
                            <span className="underline decoration-dotted text-xs truncate">Open File</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Text Content & Embeds Logic */}
                    {(() => {
                        const url = msg.content && !msg.media_url ? extractFirstUrl(msg.content) : null;
                        const textToDisplay = url ? msg.content.replace(url, '').trim() : msg.content;

                        return (
                           <>
                             {textToDisplay && (
                                <p className={`whitespace-pre-wrap leading-relaxed text-sm md:text-sm text-left ${isOnlyEmoji(textToDisplay) ? 'text-2xl md:text-3xl' : ''}`}>
                                    {textToDisplay}
                                </p>
                             )}

                             {/* Embeds */}
                             {url && (
                                <div className="mt-2 rounded-lg overflow-hidden text-xs">
                                     <MessageEmbed url={url} />
                                </div>
                             )}
                           </>
                        );
                    })()}
                    </>
                  )}
                    
                    {/* Timestamp & Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 select-none ${isMe ? 'text-white/70' : 'text-[rgb(var(--color-text-secondary))] opacity-60'}`}>
                      {msg.is_edited && !msg.is_deleted && <span className="text-[9px] italic opacity-80">(Edited)</span>}
                      <span className="text-[9px] font-medium tracking-tight">
                        {new Date(msg.created_at).toLocaleString([], { day: 'numeric', month: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {isMe && !msg.is_deleted && (
                        msg.read 
                          ? <CheckCheck size={14} className="text-sky-300 drop-shadow-[0_0_2px_rgba(125,211,252,0.5)]" /> 
                          : <Check size={12} />
                      )}
                    </div>

                    {/* Reactions Pill (Absolute or nested) */}
                     {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
                            {groupReactions(msg.reactions, user!.id).map(reaction => (
                                <button
                                    key={reaction.emoji}
                                    onClick={(e) => { e.stopPropagation(); setViewingReactionsFor(msg); }}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium transition active:scale-95 ${
                                        isMe 
                                            ? 'bg-white/20 text-white hover:bg-white/30' 
                                            : 'bg-[rgb(var(--color-surface-hover))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]'
                                    }`}
                                >
                                    <span>{reaction.emoji}</span>
                                    <span className={reaction.count > 1 ? '' : 'hidden'}>{reaction.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                  </div>

                  {/* Other's Action Buttons */}
                  {!isMe && !msg.is_deleted && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition duration-200 ml-2 self-center">
                        <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setReactionMenu({ messageId: msg.id, x: rect.right, y: rect.top, isOutgoing: false }); }} className="p-1.5 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]">
                            <MoreVertical size={14} /> 
                        </button>
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]">
                            <CornerUpLeft size={14} />
                        </button>
                    </div>
                  )}
                </div>
              )})}

              {/* Typing Indicator */}
              {isOtherTyping && (
                <div className="flex justify-start w-full mb-2">
                  <div className="bg-[rgb(var(--color-surface))] px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm border border-[rgb(var(--color-border))]">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-[rgb(var(--color-text-secondary))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[rgb(var(--color-text-secondary))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[rgb(var(--color-text-secondary))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-2 sm:p-3 md:p-4 bg-[rgb(var(--color-background))]">
                <div className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-3xl shadow-lg flex flex-col relative transition-all duration-200 focus-within:ring-1 focus-within:ring-[rgb(var(--color-accent))] focus-within:border-[rgb(var(--color-accent))]">
                    
                    {/* Reply Preview */}
                    {replyingTo && (
                        <div className="px-4 pt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--color-surface-hover))] rounded-xl w-full border-l-4 border-[rgb(var(--color-accent))]">
                                <div className="flex-1 min-w-0 overflow-hidden"> {/* Added overflow-hidden */}
                                    <div className="text-xs font-bold text-[rgb(var(--color-accent))] mb-0.5 truncate"> {/* Added truncate to name too */}
                                        Replying to {replyingTo.sender_id === user!.id ? 'yourself' : selectedUser?.display_name}
                                    </div>
                                    <p className="text-xs text-[rgb(var(--color-text-secondary))] block whitespace-nowrap overflow-hidden">
                                        {replyingTo.content 
                                            ? (replyingTo.content.length > 20 ? replyingTo.content.substring(0, 20) + '...' : replyingTo.content)
                                            : <span className="italic">[{replyingTo.media_type || 'Media'}]</span>
                                        }
                                    </p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-black/10 text-[rgb(var(--color-text-secondary))]">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* File Preview */}
                    {(file || remoteUrl) && (
                        <div className="px-4 pt-3">
                            <div className="relative inline-block">
                                {getPreview()}
                                <button onClick={() => { setFile(null); setRemoteUrl(''); setMediaInputMode(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* URL Input */}
                    {mediaInputMode === 'url' && !file && !remoteUrl && (
                        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                             <input type="url" autoFocus value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} placeholder="https://..." className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-[rgb(var(--color-text))]" />
                             <button onClick={() => setMediaInputMode(null)} className="text-[rgb(var(--color-text-secondary))]"><X size={16} /></button>
                        </div>
                    )}

                   {/* Editing Preview Bar */}
                    {editingMessage && (
                        <div className="px-4 pt-3 flex items-center justify-between bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))]">
                             <div className="flex items-center gap-2 text-sm font-semibold">
                                 <Edit2 size={16} /> Editing Message
                             </div>
                             <button onClick={() => { setEditingMessage(null); setContent(''); }} className="p-1 hover:bg-white/20 rounded-full">
                                 <X size={16} />
                             </button>
                        </div>
                    )}

                    {/* GIF PICKER UI */}
                    {showGifPicker && (
                        <div 
                            ref={gifPickerRef} 
                            className="absolute bottom-full left-0 right-0 h-80 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] rounded-t-2xl z-20 flex flex-col shadow-2xl"
                        >
                            <div className="p-3 border-b border-[rgb(var(--color-border))] flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-secondary))]" />
                                    <input 
                                        type="text" 
                                        placeholder="Search GIFs..." 
                                        value={gifQuery}
                                        onChange={e => setGifQuery(e.target.value)}
                                        // Fixed: Added text-[rgb(var(--color-text))] and improved focus states
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] rounded-xl border border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-accent))] focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                <button onClick={() => setShowGifPicker(false)} className="p-2 hover:bg-[rgb(var(--color-surface-hover))] rounded-full text-[rgb(var(--color-text-secondary))]">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {/* Fixed: Use CSS Columns (Masonry) instead of Grid to handle variable height GIFs */}
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                <div className="columns-2 md:columns-3 gap-2 space-y-2">
                                    {gifs.map(gif => (
                                        <button 
                                            key={gif.id} 
                                            onClick={() => sendGif(gif.media_formats.gif.url)} 
                                            className="w-full block rounded-lg overflow-hidden hover:opacity-90 hover:ring-2 hover:ring-[rgb(var(--color-accent))] transition-all break-inside-avoid"
                                        >
                                            <img 
                                                src={gif.media_formats.tinygif.url} 
                                                alt="GIF" 
                                                className="w-full h-auto object-cover" 
                                                loading="lazy"
                                            />
                                        </button>
                                    ))}
                                </div>
                                {gifs.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-[rgb(var(--color-text-secondary))] text-sm">
                                        No GIFs found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={editingMessage ? handleUpdateMessage : sendMessage} className="flex items-end gap-2 p-2 relative">
                         {isUploading && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[rgb(var(--color-surface-hover))]">
                                <div className="h-full bg-[rgb(var(--color-accent))] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}

                        {/* Attach Button (Disabled during edit) */}
                        {!editingMessage && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowMediaMenu(!showMediaMenu)}
                                    className={`p-2.5 rounded-full transition duration-200 ${showMediaMenu ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))] rotate-45' : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
                                >
                                    <Paperclip size={20} />
                                </button>
                                
                                {/* Attachment Menu */}
                                {showMediaMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-xl overflow-hidden z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                        <button type="button" className="w-full text-left p-3 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center gap-3" onClick={() => { setShowMediaMenu(false); fileInputRef.current?.click(); setRemoteUrl(''); setMediaInputMode('file'); }}>
                                            <Folder size={18} className="text-[rgb(var(--color-accent))]" /> Upload File
                                        </button>
                                        <button type="button" className="w-full text-left p-3 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center gap-3" onClick={() => { setShowMediaMenu(false); setFile(null); setRemoteUrl(''); setMediaInputMode('url'); }}>
                                            <Link size={18} className="text-[rgb(var(--color-accent))]" /> Paste Link
                                        </button>
                                        <div className="h-px bg-[rgb(var(--color-border))]" />
                                        <button type="button" className="w-full text-left p-3 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center gap-3" onClick={() => { setShowMediaMenu(false); setShowGifPicker(true); }}>
                                            <Gift size={18} className="text-pink-500" /> Insert GIF
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setRemoteUrl(''); }} className="hidden" />

                        {/* Text Input */}
                        <textarea
                            value={content}
                            onChange={(e) => handleInputChange(e as any)}
                            onPaste={handlePaste}
                            placeholder={editingMessage ? "Edit your message..." : (isRecording ? "Recording..." : "Message...")}
                            disabled={isRecording}
                            className="flex-1 py-2.5 px-2 bg-transparent border-none focus:ring-0 resize-none text-sm text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-secondary))] max-h-32 custom-scrollbar"
                            rows={1}
                            style={{ minHeight: '44px' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    editingMessage ? handleUpdateMessage(e) : sendMessage(e);
                                }
                            }}
                        />

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 pb-1">
                            {content.trim() || file || remoteUrl ? (
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className={`p-2.5 rounded-full hover:brightness-110 shadow-md transition-all active:scale-95 disabled:opacity-50 ${editingMessage ? 'bg-green-500 text-white' : 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))]'}`}
                                >
                                    {editingMessage ? <Check size={18} /> : <Send size={18} className={isUploading ? "animate-pulse" : ""} />}
                                </button>
                            ) : (
                                !editingMessage && (
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        className={`p-2.5 rounded-full transition-all duration-200 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 shadow-lg' : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
                                    >
                                        {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Mic size={20} />}
                                    </button>
                                )
                            )}
                        </div>
                    </form>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[rgb(var(--color-background))] flex-col gap-6 p-8">
             <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-surface))] flex items-center justify-center shadow-inner">
                 <MessageSquare size={40} className="text-[rgb(var(--color-text-secondary))] opacity-50" />
             </div>
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">Welcome to Messages</h2>
                <p className="text-[rgb(var(--color-text-secondary))] max-w-xs mx-auto">
                    Select a conversation from the sidebar to start chatting or search for a new connection.
                </p>
             </div>
             <button onClick={() => setShowSidebar(true)} className="md:hidden mt-4 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))] px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition flex items-center gap-2">
                 <ArrowLeft size={18} /> View Chats
             </button>
          </div>
        )}
      </div>

      {showSidebar && !selectedUser && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200" />
      )}
    </div>
  );
};

// Helper for "Big Emoji" detection
function isOnlyEmoji(str: string) {
    const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;
    return emojiRegex.test(str) && str.length < 10; // Simple heuristic
}
