// src/components/Post.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase, Post as PostType } from '../lib/supabase';
import { MessageEmbed } from './MessageEmbed';
import { SPECIAL_EVENT_MODE } from '../App';
import { 
  Heart, 
  MessageCircle, 
  MoreVertical, 
  Trash2, 
  FileText, 
  BadgeCheck, 
  Play, 
  Pause, 
  X, 
  Send, 
  Link as LinkIcon, 
  Camera,
  Share2,
  Edit3,
  Check
} from 'lucide-react';

// --- TYPES ---
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
    verified: boolean;
  };
}

export interface Liker {
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
    verified: boolean;
  };
}

// --- UTILS ---
const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

// Embed helper to extract first URL
const extractFirstUrl = (text: string): string | null => {
  const match = text.match(/(https?:\/\/[^\s]+)/);
  return match ? match[0] : null;
};

export const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const primaryColor = 'rgb(var(--color-accent))';
  const trackColor = 'rgb(var(--color-border))';

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const setAudioData = () => { setDuration(audio.duration); setCurrentTime(audio.currentTime); };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const togglePlay = () => setIsPlaying(!audio.paused);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlay);
    audio.addEventListener('pause', togglePlay);
    audio.addEventListener('ended', () => { setIsPlaying(false); audio.currentTime = 0; });
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
    if (audio) { isPlaying ? audio.pause() : audio.play(); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) { audio.currentTime = time; setCurrentTime(time); }
  };

  return (
    <div className="flex items-center space-x-2 w-full max-w-full p-2 bg-[rgb(var(--color-surface-hover))] rounded-xl">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button onClick={handlePlayPause} className="flex-shrink-0 p-2 rounded-full transition-colors" style={{ backgroundColor: primaryColor, color: 'rgb(var(--color-text-on-primary))' }}>
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <input type="range" min="0" max={duration} step="0.01" value={currentTime} onChange={handleSeek} className="w-full h-1 appearance-none rounded-full cursor-pointer transition" style={{ background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} 100%)` }} />
        <span className="text-xs flex-shrink-0 text-[rgb(var(--color-text-secondary))]">{formatTime(currentTime)}/{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Replaces getEmbeddedMedia. purely handles generating the YouTube iframe from a URL string.
const getYoutubeEmbed = (url: string) => {
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([\w-]{11})/i);
  
  if (youtubeMatch && youtubeMatch[1]) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden bg-black">
        <iframe 
          title="YouTube" 
          className="w-full aspect-video" 
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
    );
  }
  return null;
};

// --- SUB COMPONENTS ---

const Lightbox: React.FC<{ url: string; type: 'image' | 'video'; onClose: () => void }> = ({ url, type, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
    <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
      {type === 'image' && <img src={url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Full size" />}
      {type === 'video' && (
        <video controls autoPlay className="max-w-full max-h-[90vh] rounded-2xl">
          <source src={url} /> Your browser does not support the video tag.
        </video>
      )}
    </div>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"><X size={24} /></button>
  </div>
);

// --- MAIN POST COMPONENT ---

interface PostItemProps {
  post: PostType;
  currentUserId?: string;
  isLiked: boolean;
  onLikeToggle: (post: PostType) => void; // Parent handles the logic and passes updated post or triggers refresh
  onCommentUpdate: (post: PostType) => void; // Parent updates count
  onDelete?: (post: PostType) => void; // Optional, mostly for Profile
  onNavigateToProfile: (userId: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  currentUserId,
  isLiked,
  onLikeToggle,
  onCommentUpdate,
  onDelete,
  onNavigateToProfile
}) => {
  // Modal States
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxType, setLightboxType] = useState<'image' | 'video' | null>(null);
  
  // Logic States
  const [likersList, setLikersList] = useState<Liker[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Edit Logic
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [displayContent, setDisplayContent] = useState(post.content);

  // Delete Logic
  const [deleteProgress, setDeleteProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isOnline = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return false;
    return (new Date().getTime() - new Date(lastSeen).getTime()) < 300000;
  };

  // Sync local content with prop updates
  useEffect(() => {
    setDisplayContent(post.content);
    setEditContent(post.content);
  }, [post.content]);

  // --- SHARE LOGIC ---
  const handleShare = () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setOpenMenu(false);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // --- EDIT LOGIC ---
  const handleUpdatePost = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }
    
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent })
      .eq('id', post.id);

    if (!error) {
      setDisplayContent(editContent);
      setIsEditing(false);
      // Note: We update local display content immediately. 
      // The parent prop might lag until a refresh/realtime event, 
      // but this ensures the UI feels responsive.
    } else {
      alert("Failed to update post.");
    }
  };

  // --- LIKES LOGIC ---
  const fetchLikers = async () => {
    const { data } = await supabase.from('likes').select('user_id, profiles(*)').eq('entity_id', post.id).eq('entity_type', 'post');
    if (data) setLikersList(data as unknown as Liker[]);
  };

  const handleLikeClick = async () => {
    if (!currentUserId) return;
    onLikeToggle(post); // Optimistic update in parent
    
    if (!isLiked) {
       await supabase.from('likes').insert({ user_id: currentUserId, entity_id: post.id, entity_type: 'post' });
    }
    setShowLikesModal(true);
    fetchLikers();
  };

  const removeLikeFromModal = async () => {
      if (!currentUserId) return;
      // Call parent to toggle state back
      onLikeToggle(post);
      // Update local list
      setLikersList(prev => prev.filter(l => l.user_id !== currentUserId));
      // DB
      await supabase.from('likes').delete().match({ user_id: currentUserId, entity_id: post.id, entity_type: 'post' });
  };

  useEffect(() => {
    if (showLikesModal) fetchLikers();
  }, [showLikesModal]);


  // --- COMMENTS LOGIC ---
  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', post.id).order('created_at', { ascending: true });
    if (data) setCommentsList(data as Comment[]);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newCommentText.trim()) return;
    setIsPostingComment(true);
    const { data, error } = await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId, content: newCommentText.trim() }).select('*, profiles(*)').single();
    if (!error && data) {
        setCommentsList(prev => [...prev, data as Comment]);
        setNewCommentText('');
        onCommentUpdate({ ...post, comment_count: (post.comment_count || 0) + 1 });
    }
    setIsPostingComment(false);
  };

  useEffect(() => {
    if (showCommentsModal) fetchComments();
  }, [showCommentsModal]);

  // --- DELETE LOGIC ---
  const startDeleteHold = () => {
    setDeleteProgress(0);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 2; // 50ms * 50 steps = 2.5s approx (sped up for UX)
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        if (onDelete) onDelete(post);
        setShowDeleteModal(false);
        return;
      }
      setDeleteProgress(progress);
    }, 50);
  };
  const cancelDeleteHold = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setDeleteProgress(0);
  };

  const isAuthor = currentUserId === post.user_id;

  // Type helper to access groups safely without changing global types immediately
  const groupData = (post as any).groups;

  return (
    <>
      <div className="border-b border-[rgb(var(--color-border))] p-4 hover:bg-[rgb(var(--color-surface-hover))] transition bg-[rgb(var(--color-surface))]">
        {/* SPECIAL EVENT RGB OVERLAY */}
        {SPECIAL_EVENT_MODE && <div className="special-event-overlay" />}
        
        <div className="flex gap-4 items-start">
          <button onClick={() => onNavigateToProfile(post.user_id)} className="flex-shrink-0 relative">
            <img src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`} className="w-12 h-12 rounded-full hover:opacity-80 transition" alt="Avatar" />
            {isOnline(post.profiles?.last_seen) && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[rgb(var(--color-surface))] rounded-full" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => onNavigateToProfile(post.user_id)} className="font-bold hover:underline text-[rgb(var(--color-text))]">{post.profiles?.display_name}</button>
              {post.profiles?.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))]" />}
              <span className="text-[rgb(var(--color-text-secondary))] text-sm">@{post.profiles?.username}</span>
              <span className="text-[rgb(var(--color-text-secondary))] text-sm">· {new Date(post.created_at).toLocaleDateString()} at {formatTime(post.created_at)}</span>
            </div>

            {groupData && (
                <div 
                   className="flex items-center gap-2 mt-1 cursor-pointer group w-fit" 
                   // Note: You might want to pass a handler to PostItem to perform navigation (e.g. setView('groups'))
                   // For now, this is purely visual as requested.
                >
                   <img src={groupData.icon_url || `https://ui-avatars.com/api/?name=${groupData.name}&background=random`} className="w-5 h-5 rounded-md border border-[rgb(var(--color-border))]" alt="Group" />
                   <span className="text-xs font-bold text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-primary))] transition">{groupData.name}</span>
                </div>
            )}
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                 <textarea 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)} 
                    className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-[rgb(var(--color-text))] outline-none resize-none focus:border-[rgb(var(--color-primary))]"
                    rows={3}
                    autoFocus
                 />
                 <div className="flex gap-2 justify-end">
                    <button onClick={() => { setIsEditing(false); setEditContent(displayContent); }} className="text-sm text-[rgb(var(--color-text-secondary))] hover:underline">Cancel</button>
                    <button onClick={handleUpdatePost} className="text-sm bg-[rgb(var(--color-primary))] text-white px-3 py-1 rounded-full font-bold">Save</button>
                 </div>
              </div>
            ) : (
              <>
                 {/* UNIFIED EMBED LOGIC & URL CLEANING */}
                 {(() => {
                    let textToDisplay = displayContent;
                    let embedComponent = null;

                    // 1. If user uploaded a file directly, that takes priority.
                    if (!post.media_url) {
                       // 2. Extract the first URL found in the text
                       const url = extractFirstUrl(displayContent);
                       
                       if (url) {
                          // Clean the URL from the displayed text
                          textToDisplay = displayContent.replace(url, '').trim();

                          // 3. Check if it's YouTube -> Render Iframe
                          const youtubeEmbed = getYoutubeEmbed(url);
                          if (youtubeEmbed) {
                             embedComponent = youtubeEmbed;
                          } else {
                             // 4. If not YouTube -> Render MessageEmbed
                             embedComponent = <MessageEmbed url={url} />;
                          }
                       }
                    }

                    return (
                       <>
                          {/* Only render text paragraph if there is text remaining after stripping URL */}
                          {textToDisplay && (
                             <p className="mt-1 whitespace-pre-wrap break-words text-[rgb(var(--color-text))]">
                                {textToDisplay}
                             </p>
                          )}
                          {embedComponent}
                       </>
                    );
                 })()}
              </>
            )}

            {post.media_url && (
              <div className="mt-3">
                {post.media_type === 'image' && <img src={post.media_url} className="rounded-2xl max-h-96 object-cover w-full cursor-pointer transition hover:opacity-90" alt="Post" onClick={() => { setLightboxType('image'); setShowLightbox(true); }} />}
                {post.media_type === 'video' && (
                    <div className="relative cursor-pointer" onClick={() => { setLightboxType('video'); setShowLightbox(true); }}>
                         <video src={post.media_url} className="rounded-2xl max-h-96 w-full object-cover" />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition rounded-2xl">
                            <Play size={48} className="text-white opacity-80" />
                         </div>
                    </div>
                )}
                {post.media_type === 'audio' && <div className="rounded-2xl w-full"><AudioPlayer src={post.media_url} /></div>}
                {post.media_type === 'document' && (
                  <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg hover:bg-[rgb(var(--color-border))] transition inline-block text-[rgb(var(--color-text))]">
                    <FileText size={20} className="text-[rgb(var(--color-text-secondary))]" /> Download File
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-1 group">
                <button onClick={(e) => { e.stopPropagation(); handleLikeClick(); }} className={`p-2 rounded-full transition ${isLiked ? 'text-pink-500 bg-pink-500/10' : 'text-[rgb(var(--color-text-secondary))] hover:bg-pink-500/10 hover:text-pink-500'}`}>
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </button>
                {post.like_count > 0 && <button onClick={(e) => { e.stopPropagation(); setShowLikesModal(true); }} className="text-sm text-[rgb(var(--color-text-secondary))] hover:underline">{post.like_count}</button>}
              </div>
              <div className="flex items-center gap-1 group">
                <button onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); }} className="p-2 rounded-full transition text-[rgb(var(--color-text-secondary))] hover:bg-blue-500/10 hover:text-blue-500">
                  <MessageCircle size={18} />
                </button>
                {post.comment_count > 0 && <button onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); }} className="text-sm text-[rgb(var(--color-text-secondary))] hover:underline">{post.comment_count}</button>}
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setOpenMenu(!openMenu); }} className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition">
               {shareCopied ? <Check size={20} className="text-green-500" /> : <MoreVertical size={20} />}
            </button>
            {openMenu && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg shadow-xl overflow-hidden z-10">
                  {/* Share Option - Everyone */}
                  <button onClick={handleShare} className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2">
                    <Share2 size={18} /> Share Post
                  </button>

                  {/* Edit/Delete Options - Author Only */}
                  {isAuthor && (
                    <>
                      <button onClick={() => { setIsEditing(true); setOpenMenu(false); }} className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2">
                         <Edit3 size={18} /> Edit Post
                      </button>
                      <button onClick={() => { setShowDeleteModal(true); setOpenMenu(false); }} className="w-full text-left p-3 text-red-500 hover:bg-red-50 transition flex items-center gap-2">
                        <Trash2 size={18} /> Delete Post
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showLightbox && post.media_url && <Lightbox url={post.media_url} type={lightboxType || 'image'} onClose={() => setShowLightbox(false)} />}

      {showLikesModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4" onClick={() => setShowLikesModal(false)}>
          <div className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl max-h-[70vh] flex flex-col shadow-2xl border border-[rgb(var(--color-border))]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Likes</h3>
              <button onClick={() => setShowLikesModal(false)} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full"><X size={20} className="text-[rgb(var(--color-text))]" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {likersList.length === 0 ? <p className="text-center text-[rgb(var(--color-text-secondary))]">No likes yet.</p> : likersList.map((liker, idx) => (
                <div key={`${liker.user_id}-${idx}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToProfile(liker.user_id)}>
                    <img src={liker.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.profiles?.username}`} className="w-10 h-10 rounded-full" alt="Avatar" />
                    <div>
                      <div className="font-bold hover:underline text-[rgb(var(--color-text))] text-sm flex items-center">
                         {liker.profiles?.display_name} {liker.profiles?.verified && <BadgeCheck size={14} className="ml-1 text-[rgb(var(--color-accent))]" />}
                      </div>
                      <span className="text-sm text-[rgb(var(--color-text-secondary))]">@{liker.profiles?.username}</span>
                    </div>
                  </div>
                  {liker.user_id === currentUserId && (
                    <button onClick={removeLikeFromModal} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"><Heart size={16} className="fill-current" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCommentsModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4" onClick={() => setShowCommentsModal(false)}>
           <div className="bg-[rgb(var(--color-surface))] w-full max-w-lg rounded-2xl h-[80vh] flex flex-col shadow-2xl border border-[rgb(var(--color-border))]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Comments</h3>
              <button onClick={() => setShowCommentsModal(false)} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full"><X size={20} className="text-[rgb(var(--color-text))]" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
               {commentsList.length === 0 ? <div className="h-full flex items-center justify-center text-[rgb(var(--color-text-secondary))]">No comments yet.</div> : commentsList.map((comment) => (
                 <div key={comment.id} className="flex gap-3">
                   <img src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`} className="w-9 h-9 rounded-full cursor-pointer flex-shrink-0" alt="Avatar" onClick={() => onNavigateToProfile(comment.user_id)} />
                   <div className="flex-1">
                     <div className="flex items-baseline gap-2">
                       <button onClick={() => onNavigateToProfile(comment.user_id)} className="font-bold hover:underline text-[rgb(var(--color-text))] text-sm">{comment.profiles?.display_name}</button>
                       <span className="text-xs text-[rgb(var(--color-text-secondary))]">{formatTime(comment.created_at)}</span>
                     </div>
                     <p className="text-[rgb(var(--color-text))] text-sm mt-0.5 whitespace-pre-wrap break-words bg-[rgb(var(--color-surface-hover))] p-2 rounded-r-xl rounded-bl-xl inline-block">{comment.content}</p>
                   </div>
                 </div>
               ))}
            </div>
            <form onSubmit={handlePostComment} className="p-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-b-2xl">
              <div className="flex items-center gap-2 bg-[rgb(var(--color-surface-hover))] rounded-full px-4 py-2">
                <input type="text" value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent border-none outline-none text-sm text-[rgb(var(--color-text))]" autoFocus />
                <button type="submit" disabled={!newCommentText.trim() || isPostingComment} className="text-[rgb(var(--color-accent))] disabled:opacity-50 hover:text-[rgb(var(--color-primary))] transition"><Send size={18} /></button>
              </div>
            </form>
           </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowDeleteModal(false); cancelDeleteHold(); }}>
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl w-full max-w-sm flex flex-col p-6 text-[rgb(var(--color-text))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><Trash2 size={24} className="text-red-500 flex-shrink-0" /><h3 className="font-bold text-xl">Confirm Deletion</h3></div>
            <p className="mb-6">Are you sure? This action cannot be undone!</p>
            <button
              onMouseDown={startDeleteHold} onMouseUp={cancelDeleteHold} onMouseLeave={cancelDeleteHold}
              onTouchStart={startDeleteHold} onTouchEnd={cancelDeleteHold}
              className="relative w-full py-3 rounded-xl font-bold text-lg text-white bg-red-500 overflow-hidden disabled:opacity-50 transition duration-100"
            >
              <div className="absolute inset-0 bg-red-700 transition-all duration-50" style={{ width: `${deleteProgress}%` }} />
              <span className="relative z-10">{deleteProgress > 0 ? `Hold to Delete` : 'Hold to Delete'}</span>
            </button>
            <button onClick={() => { setShowDeleteModal(false); cancelDeleteHold(); }} className="mt-3 w-full py-2 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] rounded-xl transition">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};
