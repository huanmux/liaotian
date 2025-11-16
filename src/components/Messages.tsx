// src/components/Messages.tsx
import { useEffect, useState, useRef } from 'react';
import { supabase, Message, Profile, uploadMedia } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Search, ArrowLeft, X, Paperclip, FileText, Link, CornerUpLeft, Phone, Video, Mic, Play, Pause } from 'lucide-react';
import { Calls } from './Calls';

const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

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

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlay);
    audio.addEventListener('pause', togglePlay);
    audio.addEventListener('ended', () => {
        setIsPlaying(false);
        audio.currentTime = 0; // Reset after playing
    });

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', togglePlay);
      audio.removeEventListener('pause', togglePlay);
      audio.removeEventListener('ended', () => {});
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
        className={`flex-shrink-0 p-2 rounded-full transition-colors`}
        style={{
            backgroundColor: isOutgoing 
                ? 'rgba(var(--color-text-on-primary), 0.15)' 
                : 'rgb(var(--color-surface-hover))',
            color: primaryColor,
        }}
      >
        {isPlaying ? <Pause size={16} fill={primaryColor} /> : <Play size={16} fill={primaryColor} />}
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
        <span className="text-xs flex-shrink-0" style={{ color: primaryColor }}>
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

// --- END AudioPlayer COMPONENT ---


export const Messages = () => {
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

  const typingChannelRef = useRef<any>(null);
  const outgoingTypingChannelRef = useRef<any>(null);

  const { user } = useAuth();

  const isUserOnline = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    return (now.getTime() - lastSeenDate.getTime()) < 300000;
  };

  const formatLastSeen = (lastSeen: string | null | undefined): string | null => {
    if (!lastSeen) return null;

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const FIVE_MINUTES = 300000;
    if (diffMs < FIVE_MINUTES) return null;

    const diffSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSeconds / (60 * 60 * 24));
    const hours = Math.floor((diffSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);

    let parts = [];
    if (days > 0) {
        parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        else if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    } else if (hours > 0) {
        parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    } else if (minutes > 0) {
        parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) return null; 
    return `Last seen ${parts.join(' ')} ago`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setShowSidebar(false);

    const messageChannel = supabase
      .channel(`messages:${selectedUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as AppMessage;
          if (
            (msg.sender_id === user!.id && msg.recipient_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.recipient_id === user!.id)
          ) {
            let finalMsg = msg;
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

            setMessages((prev) => [...prev, finalMsg]);
            scrollToBottom();
            loadConversations();
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file && !remoteUrl.trim() || !selectedUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    let media_url = null;
    let media_type = null;

    if (file) {
      // If it's a locally generated audio file, ensure media_type is 'audio'
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
      media_type = media_type || result.type; // Prioritize our 'audio' type, otherwise use uploadMedia's result
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
    
    const { data, count } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, created_at, media_url, media_type, reply_to_id, reply_to:messages!reply_to_id(id, content, sender_id, media_type)', { count: 'exact' })
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: false })
      .range(0, MESSAGE_PAGE_SIZE - 1); 
      
    setMessages(data ? (data as AppMessage[]).reverse() : []); 
    
    if (!data || data.length < MESSAGE_PAGE_SIZE || (count !== null && count <= MESSAGE_PAGE_SIZE)) {
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
    
    const { data, count } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, created_at, media_url, media_type, reply_to_id, reply_to:messages!reply_to_id(id, content, sender_id, media_type)', { count: 'exact' })
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: false })
      .range(from, to);
  
    if (data && data.length > 0) {
      setMessages(prev => [...(data as AppMessage[]).reverse(), ...prev]);
      setMessagePage(nextPage);
      
      if (container && oldScrollHeight) {
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - oldScrollHeight;
        }, 0);
      }
    }
  
    if (!data || data.length < MESSAGE_PAGE_SIZE || (count !== null && messages.length + (data?.length || 0) >= count)) {
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
        // Use 'audio/webm' as it's broadly supported
        const options = { mimeType: 'audio/webm' };
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          // Fallback if webm isn't supported
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
          
          setFile(audioFile); // This will trigger the preview
          setIsRecording(false);
          
          // Stop all tracks from the stream to turn off the mic indicator
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
        // Clear other attachments
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

  // --- END VOICE RECORDING FUNCTIONS ---


  const displayList = searchQuery ? searchResults : conversations;

  const getPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        return <img src={url} className="max-h-32 rounded-lg" alt="Preview" />;
      }
      if (file.type.startsWith('video/')) {
        return <video src={url} className="max-h-32 rounded-lg" controls />;
      }
      if (file.type.startsWith('audio/')) {
        // Use the custom AudioPlayer for preview
        return <AudioPlayer src={url} isOutgoing={true} />; 
      }
      return (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
          <FileText size={16} />
          <span>{file.name}</span>
        </div>
      );
    }
    if (remoteUrl) {
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return <img src={remoteUrl} className="max-h-32 rounded-lg" alt="Remote preview" />;
      }
      if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        return <video src={remoteUrl} className="max-h-32 rounded-lg" controls />;
      }
      if (remoteUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        // Use the custom AudioPlayer for remote URL preview
        return <AudioPlayer src={remoteUrl} isOutgoing={true} />;
      }
      return (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
          <Link size={16} />
          <span className="truncate max-w-[150px]">{remoteUrl}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full bg-[rgb(var(--color-background))] overflow-hidden">
      <Calls />
      <div className={`w-full md:w-96 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative fixed inset-y-0 left-0 z-40 md:z-auto`}>
        <div className="p-4 border-b border-[rgb(var(--color-border))] sticky top-0 bg-[rgb(var(--color-surface))] z-10">
          <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] mb-4">Chats</h2>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3.5 text-[rgb(var(--color-text-secondary))]" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 && (
            <div className="p-8 text-center text-[rgb(var(--color-text-secondary))]">
              {searchQuery ? 'No users found' : 'No conversations yet'}
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
              className={`w-full flex items-center gap-3 p-4 transition border-b border-[rgb(var(--color-border))] ${selectedUser?.id === u.id ? 'bg-[rgb(var(--color-surface-hover))]' : 'hover:bg-[rgb(var(--color-surface-hover))]'}`}
            >
              <div className="relative">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                  className="w-14 h-14 rounded-full object-cover"
                  alt=""
                />
                {isUserOnline(u.last_seen) && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]"
                  />
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                  {u.display_name}
                  {u.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                </div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))] truncate">
                  {isUserOnline(u.last_seen)
                    ? 'Online'
                    : formatLastSeen(u.last_seen) || `@${u.username}`
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[rgb(var(--color-background))] transition-all duration-300 ease-in-out ${selectedUser ? '' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            <div className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] p-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
              <button onClick={() => setShowSidebar(true)} className="md:hidden p-1 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition">
                <ArrowLeft size={24} className="text-[rgb(var(--color-text-secondary))]" />
              </button>
              <button onClick={() => goToProfile(selectedUser.id)} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                    className="w-10 h-10 rounded-full object-cover"
                    alt=""
                  />
                  {isUserOnline(selectedUser.last_seen) && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]"
                    />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-bold flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                    {selectedUser.display_name}
                    {selectedUser.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                  </div>
                  <div className="text-sm text-[rgb(var(--color-text-secondary))] truncate">
                    {isUserOnline(selectedUser.last_seen)
                      ? 'Online'
                      : formatLastSeen(selectedUser.last_seen) || `@${selectedUser.username}`
                    }
                  </div>
                </div>
              </button>
              
              <div className="flex gap-1 pr-1">
                <button
                  onClick={() => dispatchStartCall(selectedUser, 'audio')}
                  className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition text-[rgb(var(--color-text-secondary))]"
                  title="Start audio call"
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => dispatchStartCall(selectedUser, 'video')}
                  className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition text-[rgb(var(--color-text-secondary))]"
                  title="Start video call"
                >
                  <Video size={20} />
                </button>
              </div>
            </div>

            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgb(var(--color-background))]"
            >
              {isLoadingMore && (
                <div className="flex justify-center p-4">
                  <div className="logo-loading-container w-6 h-6 relative">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox={SVG_VIEWBOX}
                          className="logo-svg"
                      >
                          <defs>
                              <clipPath id="logo-clip">
                                  <rect
                                      id="clip-rect"
                                      x="0"
                                      y="0"
                                      width="100%"
                                      height="100%"
                                  />
                              </clipPath>
                          </defs>
                          <path
                              d={SVG_PATH}
                              fill="none"
                              stroke="rgb(var(--color-primary))"
                              strokeWidth="10"
                              strokeOpacity="0.1" 
                          />
                          <path
                              d={SVG_PATH}
                              fill="rgb(var(--color-primary))" 
                              clipPath="url(#logo-clip)"
                              className="logo-fill-animated"
                          />
                      </svg>
                  </div>
                </div>
              )}
            
              {messages.map((msg) => {
                
                // Determine if the message is *only* an audio message (no content)
                const isOnlyAudio = msg.media_type === 'audio' && !msg.content.trim();
                
                // Conditional class for max width. If it's only audio, we want it to take up more space.
                const messageWidthClass = isOnlyAudio 
                    ? 'max-w-[90%] sm:max-w-[80%] md:max-w-[85%]'
                    : 'max-w-[90%] sm:max-w-[60%] md:max-w-[65%]';

                return (
                <div
                  key={msg.id}
                  className={`flex items-center gap-2 group ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender_id === user!.id && (
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] opacity-0 group-hover:opacity-100 transition hover:bg-[rgb(var(--color-surface-hover))]"
                      title="Reply"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  )}

                  <div
                    className={`${messageWidthClass} px-3 py-2 rounded-xl shadow-md ${
                      msg.sender_id === user!.id
                        ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))] rounded-br-none'
                        : 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-tl-none'
                    }`}
                  >
                    {msg.reply_to_id && (() => {
                      const repliedToMsg = msg.reply_to ? msg.reply_to : messages.find(m => m.id === msg.reply_to_id);
                      if (!repliedToMsg) return null;
                      const isReplyToSelf = repliedToMsg.sender_id === user!.id;
                      
                      return (
                        <div className={`p-2 rounded-lg mb-2 ${
                          msg.sender_id === user!.id
                            ? 'bg-[rgba(var(--color-surface),0.2)]' 
                            : 'bg-[rgb(var(--color-surface-hover))]' 
                        }`}>
                          <div className={`font-bold text-xs mb-0.5 ${
                            msg.sender_id === user!.id 
                              ? 'text-[rgba(var(--color-text-on-primary),0.9)]' 
                              : 'text-[rgb(var(--color-accent))]'
                          }`}>
                            {isReplyToSelf ? 'You' : selectedUser?.display_name}
                          </div>
                          <p className="text-xs opacity-90 truncate whitespace-pre-wrap break-words">
                            {repliedToMsg.content ? repliedToMsg.content : (
                              <span className="flex items-center gap-1 italic opacity-80">
                                {repliedToMsg.media_type === 'image' && <Paperclip size={12} className="inline-block" />}
                                {repliedToMsg.media_type === 'image' && 'Image'}
                                {repliedToMsg.media_type === 'video' && <Paperclip size={12} className="inline-block" />}
                                {repliedToMsg.media_type === 'video' && 'Video'}
                                {repliedToMsg.media_type === 'audio' && <Mic size={12} className="inline-block" />}
                                {repliedToMsg.media_type === 'audio' && 'Voice Message'}
                                {repliedToMsg.media_type === 'document' && <FileText size={12} className="inline-block" />}
                                {repliedToMsg.media_type === 'document' && 'File'}
                                {!repliedToMsg.content && !repliedToMsg.media_type && '[Message]'}
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })()}

                    {msg.media_url && (
                      <div className={msg.content.trim() ? "mt-2" : ""}>
                        {msg.media_type === 'image' && (
                          <img src={msg.media_url} className={`${msg.content.trim() ? "mb-2" : ""} rounded-lg max-w-full h-auto`} alt="Message" />
                        )}
                        {msg.media_type === 'video' && (
                          <video controls className={`${msg.content.trim() ? "mb-2" : ""} rounded-lg max-w-full`}>
                            <source src={msg.media_url} />
                          </video>
                        )}
                        {/* CUSTOM AUDIO PLAYER IMPLEMENTATION */}
                        {msg.media_type === 'audio' && (
                          <div className={msg.content.trim() ? "mb-2" : ""}>
                            <AudioPlayer src={msg.media_url} isOutgoing={msg.sender_id === user!.id} />
                          </div>
                        )}
                        {msg.media_type === 'document' && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] underline"
                          >
                            <FileText size={14} /> Open File
                          </a>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 text-right ${
                        msg.sender_id === user!.id ? 'text-[rgba(var(--color-text-on-primary),0.9)]' : 'text-[rgb(var(--color-text-secondary))]'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {msg.sender_id !== user!.id && (
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] opacity-0 group-hover:opacity-100 transition hover:bg-[rgb(var(--color-surface-hover))]"
                      title="Reply"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  )}
                </div>
              )})}

              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-[rgb(var(--color-surface))] px-3 py-2 rounded-xl shadow-sm border border-[rgb(var(--color-border))] rounded-tl-none">
                    <div className="flex gap-1 items-end">
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '4ds00ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[rgb(var(--color-surface))]">
              {replyingTo && (
                <div className="p-3 bg-[rgb(var(--color-surface-hover))] flex items-center justify-between mx-3 mt-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[rgb(var(--color-text-secondary))] flex items-center gap-1">
                      <CornerUpLeft size={14} />
                      Replying to {replyingTo.sender_id === user!.id ? 'yourself' : selectedUser?.display_name}
                    </div>
                    <p className="text-sm text-[rgb(var(--color-text))] truncate mt-0.5">
                      {replyingTo.content ? replyingTo.content : (
                        <span className="flex items-center gap-1 italic opacity-80">
                          {replyingTo.media_type === 'image' && <Paperclip size={12} className="inline-block" />}
                          {replyingTo.media_type === 'image' && 'Image'}
                          {replyingTo.media_type === 'video' && <Paperclip size={12} className="inline-block" />}
                          {replyingTo.media_type === 'video' && 'Video'}
                          {replyingTo.media_type === 'audio' && <Mic size={12} className="inline-block" />}
                          {replyingTo.media_type === 'audio' && 'Voice Message'}
                          {replyingTo.media_type === 'document' && <FileText size={12} className="inline-block" />}
                          {replyingTo.media_type === 'document' && 'File'}
                          {!replyingTo.content && !replyingTo.media_type && '[Message]'}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-[rgb(var(--color-surface))] rounded-full transition text-[rgb(var(--color-text))]"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {(file || remoteUrl) && (
                <div className="mb-3 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg flex items-center justify-between mx-3 mt-3">
                  <div className="flex-1 pr-2">
                    {getPreview()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoteUrl('');
                      setMediaInputMode(null);
                    }}
                    className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full transition text-[rgb(var(--color-text))]"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {mediaInputMode === 'url' && !file && !remoteUrl && (
                  <div className="p-3">
                      <div className="flex items-center gap-2">
                          <input
                              type="url"
                              value={remoteUrl}
                              onChange={(e) => {
                                setRemoteUrl(e.target.value);
                                setFile(null);
                              }}
                              placeholder="Paste media URL..."
                              className="flex-1 px-3 py-2 text-sm border border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                          />
                          <button
                              type="button"
                              onClick={() => {
                                setRemoteUrl('');
                                setMediaInputMode(null);
                              }}
                              className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
                              title="Cancel URL input"
                          >
                              <X size={20} />
                          </button>
                      </div>
                  </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] relative">
              {isUploading && (
                <div className="mb-3 w-full bg-[rgb(var(--color-border))] rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[rgba(var(--color-accent),1)] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setRemoteUrl('');
                }}
                className="hidden"
              />

              {showMediaMenu && (
                  <div className="absolute bottom-full left-3 mb-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg shadow-xl overflow-hidden z-30">
                      <button
                          type="button"
                          className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2"
                          onClick={() => {
                              setShowMediaMenu(false);
                              fileInputRef.current?.click();
                              setRemoteUrl('');
                              setMediaInputMode('file');
                          }}
                      >
                          <Paperclip size={18} /> Upload file
                      </button>
                      <button
                          type="button"
                          className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2"
                          onClick={() => {
                              setShowMediaMenu(false);
                              setFile(null);
                              setRemoteUrl('');
                              setMediaInputMode('url');
                          }}
                      >
                          <Link size={18} /> Fetch from URL
                      </button>
                  </div>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediaMenu(!showMediaMenu);
                  }}
                  className="p-2 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
                  title="Attach file or link"
                  disabled={isRecording}
                >
                  <Paperclip size={20} />
                </button>
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition ${
                    isRecording 
                      ? 'text-red-500 bg-red-500/10 animate-pulse' 
                      : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice message"}
                  disabled={isUploading}
                >
                  <Mic size={20} />
                </button>

                <input
                  type="text"
                  placeholder={isRecording ? "Recording... (press mic to stop)" : "Type a message..."}
                  value={content}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] text-base bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                  disabled={isRecording}
                />

                <button
                  type="submit"
                  disabled={isUploading || isRecording || (!content.trim() && !file && !remoteUrl.trim())}
                  className={`p-2 rounded-full transition ${isUploading || isRecording || (!content.trim() && !file && !remoteUrl.trim()) ? 'bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]' : 'bg-[rgba(var(--color-accent),1)] text-[rgb(var(--color-text-on-primary))] hover:bg-[rgba(var(--color-primary),1)]'}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[rgb(var(--color-text-secondary))] flex-col">
            <span className="text-xl font-semibold mb-2">Welcome to Messages</span>
            <span className="text-center px-8">
              {showSidebar ? 'Select a chat on the left to start messaging.' : 'Tap the arrow to open the chat list.'}
            </span>
            <button onClick={() => setShowSidebar(true)} className="md:hidden mt-4 bg-[rgba(var(--color-accent),1)] text-[rgb(var(--color-text-on-primary))] px-4 py-2 rounded-full hover:bg-[rgba(var(--color-primary),1)] transition">
              <ArrowLeft className="mr-2 inline" /> Back to Chats
            </button>
          </div>
        )}
      </div>

      {showSidebar && !selectedUser && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" />
      )}
    </div>
  );
};
