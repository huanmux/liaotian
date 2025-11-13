// src/components/Shots.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, Music2, User, X, BadgeCheck, Send } from 'lucide-react';

const FOLLOW_ONLY_FEED = import.meta.env.VITE_FOLLOW_ONLY_FEED === 'true';

interface Comment {
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

interface Liker {
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
    verified: boolean;
  };
}

export const Shots = () => {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction States
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [activeCommentsId, setActiveCommentsId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeLikesId, setActiveLikesId] = useState<string | null>(null);
  const [likersList, setLikersList] = useState<Liker[]>([]);

  const fetchUserLikes = useCallback(async (posts: Post[]) => {
    if (!user || posts.length === 0) return;
    const postIds = posts.map(p => p.id);
    const { data } = await supabase
      .from('likes')
      .select('entity_id')
      .eq('user_id', user.id)
      .eq('entity_type', 'post')
      .in('entity_id', postIds);
    
    if (data) {
      setLikedPostIds(prev => new Set([...prev, ...data.map(d => d.entity_id)]));
    }
  }, [user]);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('media_type', 'video')
      .order('created_at', { ascending: false })
      .limit(20);

    if (FOLLOW_ONLY_FEED && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      const allowedIds = [...followingIds, user.id];
      query = query.in('user_id', allowedIds);
    }

    const { data } = await query;
    const loadedVideos = data || [];
    setVideos(loadedVideos);
    fetchUserLikes(loadedVideos);
    setLoading(false);
  }, [user, fetchUserLikes]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Intersection Observer for Auto-Play
  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.6
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoElement = entry.target.querySelector('video');
        if (!videoElement) return;

        if (entry.isIntersecting) {
          videoElement.play().catch(() => {});
        } else {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
      });
    }, options);

    const items = document.querySelectorAll('.shot-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [videos]);

  // Interaction Logic (Duplicated from Feed but tailored for UI)
  const handleLikeInteraction = async (post: Post) => {
    if (!user) return;
    
    // 1. If not liked, like it.
    if (!likedPostIds.has(post.id)) {
      const newSet = new Set(likedPostIds);
      newSet.add(post.id);
      setLikedPostIds(newSet);

      // Optimistic Count Update
      setVideos(current => current.map(v => v.id === post.id ? { ...v, like_count: v.like_count + 1 } : v));
      
      await supabase.from('likes').insert({ user_id: user.id, entity_id: post.id, entity_type: 'post' });
    }

    // 2. Open Modal (Requested Behavior)
    openLikesList(post.id);
  };

  const handleUnlikeFromModal = async (postId: string) => {
    if (!user) return;
    
    // Remove from set
    const newSet = new Set(likedPostIds);
    newSet.delete(postId);
    setLikedPostIds(newSet);

    // Optimistic Count Update
    setVideos(current => current.map(v => v.id === postId ? { ...v, like_count: Math.max(0, v.like_count - 1) } : v));

    // Remove from DB
    await supabase.from('likes').delete().match({ user_id: user.id, entity_id: postId, entity_type: 'post' });
    
    // Remove self from the displayed list
    setLikersList(prev => prev.filter(liker => liker.user_id !== user.id));
  };

  const openLikesList = async (postId: string) => {
    setActiveLikesId(postId);
    const { data } = await supabase
      .from('likes')
      .select('user_id, profiles(*)')
      .eq('entity_id', postId)
      .eq('entity_type', 'post');
    if (data) setLikersList(data as unknown as Liker[]);
  };

  const openComments = async (postId: string) => {
    setActiveCommentsId(postId);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setCommentsList(data as Comment[]);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommentsId || !newCommentText.trim()) return;

    const postId = activeCommentsId;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: newCommentText.trim() })
      .select('*, profiles(*)')
      .single();

    if (!error && data) {
      setCommentsList(prev => [...prev, data as Comment]);
      setNewCommentText('');
      setVideos(current => current.map(v => v.id === postId ? { ...v, comment_count: (v.comment_count || 0) + 1 } : v));
    }
  };

  const goToProfile = (profileId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-[rgb(var(--color-accent))] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[rgb(var(--color-text-secondary))] p-8 text-center">
        <Music2 size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">No Shots Yet</h3>
        <p>No video content available in your feed. Follow people who post video content, or post a video yourself to see them here!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-180px)] bg-black rounded-xl overflow-hidden">
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video) => (
          <div key={video.id} className="shot-item relative w-full h-full snap-start bg-black">
            {/* Video Layer */}
            <video
              src={video.media_url!}
              className="w-full h-full object-cover"
              playsInline
              loop
              muted={false} // In a real app, you'd manage mute state globally
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Right Sidebar (Actions) */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
              <div className="flex flex-col items-center gap-1">
                 <button onClick={() => goToProfile(video.user_id)} className="relative">
                    <img 
                      src={video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.profiles?.username}`}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                 </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleLikeInteraction(video)}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full transition active:scale-90"
                >
                  <Heart 
                    size={28} 
                    className={likedPostIds.has(video.id) ? "fill-red-500 text-red-500" : "text-white"} 
                  />
                </button>
                <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{video.like_count}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => openComments(video.id)}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full transition active:scale-90"
                >
                  <MessageCircle size={28} className="text-white" />
                </button>
                <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{video.comment_count}</span>
              </div>

              <button className="p-3 bg-white/10 backdrop-blur-sm rounded-full transition active:scale-90">
                <Share2 size={28} className="text-white" />
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-4 left-4 right-16 z-10 text-white">
              <button onClick={() => goToProfile(video.user_id)} className="font-bold text-lg hover:underline flex items-center gap-1 mb-2 shadow-black drop-shadow-md">
                @{video.profiles?.username}
                {video.profiles?.verified && <BadgeCheck size={16} className="text-blue-400" />}
              </button>
              <p className="text-sm line-clamp-2 opacity-90 mb-3 shadow-black drop-shadow-md">
                {video.content}
              </p>
              <div className="flex items-center gap-2 text-xs opacity-70">
                 <Music2 size={14} className="animate-spin-slow" />
                 <span>Original Sound - {video.profiles?.display_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shared Interaction Modals (Reused styles for consistency) */}
      {activeLikesId && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
           <div className="bg-[rgb(var(--color-surface))] w-full max-w-sm h-[60vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center">
                <h3 className="font-bold text-[rgb(var(--color-text))]">Likes</h3>
                <button onClick={() => setActiveLikesId(null)}><X size={20} className="text-[rgb(var(--color-text))]" /></button>
             </div>
             <div className="overflow-y-auto p-4 space-y-4 flex-1">
               {likersList.map(liker => (
                 <div key={liker.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={liker.profiles.avatar_url} className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-bold text-sm text-[rgb(var(--color-text))]">{liker.profiles.display_name}</p>
                            <p className="text-xs text-[rgb(var(--color-text-secondary))]">@{liker.profiles.username}</p>
                        </div>
                    </div>
                    {/* Special "Unlike" button if this is the current user */}
                    {liker.user_id === user?.id && (
                        <button 
                            onClick={() => handleUnlikeFromModal(activeLikesId)}
                            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                            title="Remove like"
                        >
                            <Heart size={16} className="fill-current" />
                        </button>
                    )}
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {activeCommentsId && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[rgb(var(--color-surface))] w-full max-w-sm h-[70vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center">
                <h3 className="font-bold text-[rgb(var(--color-text))]">Comments</h3>
                <button onClick={() => setActiveCommentsId(null)}><X size={20} className="text-[rgb(var(--color-text))]" /></button>
             </div>
             <div className="overflow-y-auto p-4 space-y-4 flex-1">
                {commentsList.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                        <img src={comment.profiles.avatar_url} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex gap-2 items-baseline">
                                <span className="font-bold text-xs text-[rgb(var(--color-text))]">{comment.profiles.display_name}</span>
                                <span className="text-[10px] text-[rgb(var(--color-text-secondary))]">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-[rgb(var(--color-text))]">{comment.content}</p>
                        </div>
                    </div>
                ))}
             </div>
             <form onSubmit={handlePostComment} className="p-3 border-t border-[rgb(var(--color-border))] flex gap-2">
                <input 
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    placeholder="Say something..." 
                    className="flex-1 bg-[rgb(var(--color-surface-hover))] rounded-full px-4 py-2 text-sm outline-none text-[rgb(var(--color-text))]"
                />
                <button type="submit" className="text-[rgb(var(--color-accent))]"><Send size={20} /></button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
