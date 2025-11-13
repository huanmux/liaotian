// Feed.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, Post, uploadMedia } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Edit3, Image, FileText, X, Paperclip, Link, Heart, MessageCircle, LayoutGrid, Smartphone } from 'lucide-react';
import { Shots } from './Shots';

const FOLLOW_ONLY_FEED = import.meta.env.VITE_FOLLOW_ONLY_FEED === 'true';

// Auxiliary types for the new features
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

// --- PAGINATION START ---
const POST_PAGE_SIZE = 10;
// --- PAGINATION END ---

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'posts' | 'shots'>('posts');

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState('');
  const [lightboxMediaType, setLightboxMediaType] = useState<'image' | 'video' | null>(null);

  // Social features state
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [activeLikesModal, setActiveLikesModal] = useState<string | null>(null);
  const [likersList, setLikersList] = useState<Liker[]>([]);
  const [activeCommentsModal, setActiveCommentsModal] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // --- PAGINATION STATE START ---
  const [postPage, setPostPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  // --- PAGINATION STATE END ---

  const openLightbox = (url: string, type: 'image' | 'video') => {
    setLightboxMediaUrl(url);
    setLightboxMediaType(type);
    setShowLightbox(true);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOnline = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return false;
    const now = new Date().getTime();
    const lastSeenTime = new Date(lastSeen).getTime();
    const diff = now - lastSeenTime;
    return diff < 300000; // 5 minutes
  };

  const fetchUserLikes = useCallback(async (currentPosts: Post[]) => {
    if (!user || currentPosts.length === 0) return;
    const postIds = currentPosts.map(p => p.id);
    const { data } = await supabase
      .from('likes')
      .select('entity_id')
      .eq('user_id', user.id)
      .eq('entity_type', 'post')
      .in('entity_id', postIds);
    
    if (data) {
      // --- MODIFICATION: Add to existing set, don't replace
      setLikedPostIds(prevSet => new Set([...prevSet, ...data.map(d => d.entity_id)]));
    }
  }, [user]);

  // --- MODIFICATION: Load only first page
  const loadPosts = useCallback(async () => {
    setPosts([]);
    setPostPage(0);
    setHasMorePosts(true);

    let query = supabase.from('posts').select('*, profiles(*)').order('created_at', { ascending: false });
    
    if (FOLLOW_ONLY_FEED && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) || [];
      const allowedIds = [...followingIds, user.id];

      query = query.in('user_id', allowedIds);
    }
    
    const { data } = await query.range(0, POST_PAGE_SIZE - 1);
    
    const loadedPosts = data || [];
    setPosts(loadedPosts);
    
    if (loadedPosts.length < POST_PAGE_SIZE) {
      setHasMorePosts(false);
    }
    
    fetchUserLikes(loadedPosts);
  }, [user, fetchUserLikes]);
  
  // --- NEW: Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMorePosts || !hasMorePosts) return;
    
    setIsLoadingMorePosts(true);
    const nextPage = postPage + 1;
    const from = nextPage * POST_PAGE_SIZE;
    const to = from + POST_PAGE_SIZE - 1;

    let query = supabase.from('posts').select('*, profiles(*)').order('created_at', { ascending: false });
    
    if (FOLLOW_ONLY_FEED && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) || [];
      const allowedIds = [...followingIds, user.id];

      query = query.in('user_id', allowedIds);
    }
    
    const { data } = await query.range(from, to);
    
    const newPosts = data || [];
    setPosts(current => [...current, ...newPosts]);
    setPostPage(nextPage);
    
    if (newPosts.length < POST_PAGE_SIZE) {
      setHasMorePosts(false);
    }
    
    fetchUserLikes(newPosts);
    setIsLoadingMorePosts(false);
  }, [isLoadingMorePosts, hasMorePosts, postPage, user, fetchUserLikes]);

  // Handle Likes - MODIFIED LOGIC
  const handleInitialLike = async (post: Post) => {
    if (!user) return;

    // 1. If the user hasn't liked it yet, apply the like immediately
    if (!likedPostIds.has(post.id)) {
        const newSet = new Set(likedPostIds);
        newSet.add(post.id);
        setLikedPostIds(newSet);

        // Optimistic UI Update
        setPosts(current => current.map(p => {
            if (p.id === post.id) return { ...p, like_count: (p.like_count + 1) };
            return p;
        }));

        // DB Insert
        await supabase.from('likes').insert({ user_id: user.id, entity_id: post.id, entity_type: 'post' });
    }

    // 2. Open the modal (Requirement: Always open modal on click)
    openLikesList(post.id);
  };

  // New function to remove like ONLY from the modal
  const handleRemoveLikeFromModal = async (postId: string) => {
      if (!user) return;

      // Optimistic UI Update
      const newSet = new Set(likedPostIds);
      newSet.delete(postId);
      setLikedPostIds(newSet);

      setPosts(current => current.map(p => {
          if (p.id === postId) return { ...p, like_count: Math.max(0, p.like_count - 1) };
          return p;
      }));

      // Remove user from the displayed list immediately
      setLikersList(prev => prev.filter(liker => liker.user_id !== user.id));

      // DB Delete
      await supabase.from('likes').delete().match({ user_id: user.id, entity_id: postId, entity_type: 'post' });
  };

  const openLikesList = async (postId: string) => {
    setActiveLikesModal(postId);
    const { data } = await supabase
      .from('likes')
      .select('user_id, profiles(*)')
      .eq('entity_id', postId)
      .eq('entity_type', 'post');
    if (data) setLikersList(data as unknown as Liker[]);
  };

  // Handle Comments
  const openCommentsList = async (postId: string) => {
    setActiveCommentsModal(postId);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setCommentsList(data as Comment[]);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommentsModal || !newCommentText.trim()) return;
    
    setIsPostingComment(true);
    const postId = activeCommentsModal;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newCommentText.trim()
      })
      .select('*, profiles(*)')
      .single();

    if (!error && data) {
      setCommentsList(prev => [...prev, data as Comment]);
      setNewCommentText('');
      // Update post comment count in feed optimistically
      setPosts(current => current.map(p => {
        if (p.id === postId) return { ...p, comment_count: (p.comment_count || 0) + 1 };
        return p;
      }));
    }
    setIsPostingComment(false);
  };

  // --- FIX: Split useEffect into two hooks ---

  // Effect 1: Handles initial load and Supabase subscriptions
  useEffect(() => {
    loadPosts();

    const channel = supabase.channel('public:posts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
      if (FOLLOW_ONLY_FEED && user) {
        if (payload.new.user_id === user.id) {
          const { data } = await supabase.from('posts').select('*, profiles(*)').eq('id', payload.new.id).single();
          if (data) setPosts(current => [data, ...current]);
          return;
        }

        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('following_id', payload.new.user_id);

        if (!followData?.length) return;
      }
      const { data } = await supabase.from('posts').select('*, profiles(*)').eq('id', payload.new.id).single();
      if (data) setPosts(current => [data, ...current]);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadPosts]); // Only depends on user and the memoized loadPosts

  // Effect 2: Handles scroll listening for composer shrink and pagination
  useEffect(() => {
    const handleScroll = () => {
      // Handle composer shrink
      const scrolled = window.scrollY > 100;
      if (scrolled && isExpanded) setIsExpanded(false);
      setHasScrolled(scrolled);
      
      // --- PAGINATION: Handle infinite scroll
      if (
        activeTab === 'posts' && // Only scroll load on posts tab
        window.innerHeight + document.documentElement.scrollTop + 200 >= document.documentElement.offsetHeight &&
        hasMorePosts &&
        !isLoadingMorePosts
      ) {
        loadMorePosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isExpanded, hasMorePosts, isLoadingMorePosts, loadMorePosts, activeTab]); // Depends on scroll-related state

  // --- END FIX ---

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file && !remoteUrl.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    let media_url = null;
    let media_type = null;

    if (file) {
      const result = await uploadMedia(file, 'posts', (percent) => {
        setUploadProgress(percent);
      });
      if (!result) {
        setIsUploading(false);
        return;
      }
      media_url = result.url;
      media_type = result.type;
    } else if (remoteUrl.trim()) {
      media_url = remoteUrl.trim();
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        media_type = 'image';
      } else if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        media_type = 'video';
      } else {
        media_type = 'document';
      }
    }

    await supabase
      .from('posts')
      .insert({ 
        user_id: user!.id, 
        content, 
        media_url,
        media_type 
      });

    setContent('');
    setFile(null);
    setRemoteUrl('');
    setIsExpanded(false);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const goToProfile = async (profileId: string) => {
    // Close modals if open
    setActiveLikesModal(null);
    setActiveCommentsModal(null);

    const { data } = await supabase.from('profiles').select('username').eq('id', profileId).single();
    if (data) {
      window.history.replaceState({}, '', `/?${data.username}`);
      window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
    }
  };

  const getPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        return <img src={url} className="max-h-48 rounded-lg object-cover" alt="Preview" />;
      }
      if (file.type.startsWith('video/')) {
        return <video src={url} className="max-h-48 rounded-lg" controls />;
      }
      return (
        <div className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg">
          <FileText size={20} className="text-[rgb(var(--color-text-secondary))]" />
          <span className="text-sm text-[rgb(var(--color-text))]" >{file.name}</span>
        </div>
      );
    }
    if (remoteUrl) {
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return <img src={remoteUrl} className="max-h-48 rounded-lg object-cover" alt="Remote preview" />;
      }
      if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        return <video src={remoteUrl} className="max-h-48 rounded-lg" controls />;
      }
      return (
        <div className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg">
          <Link size={20} className="text-[rgb(var(--color-text-secondary))]" />
          <span className="text-sm truncate max-w-[200px] text-[rgb(var(--color-text))]">{remoteUrl}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* COMPOSER - Only visible when Posts tab is active */}
      {activeTab === 'posts' && (
      <div ref={scrollRef} className="sticky top-0 z-40 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] shadow-sm">
        {isExpanded ? (
          <form onSubmit={createPost} className="p-4 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              className="w-full px-4 py-3 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-2xl focus:outline-none focus:border-[rgb(var(--color-accent))] resize-none text-[rgb(var(--color-text))]"
              autoFocus
            />
            
            {(file || remoteUrl) && (
              <div className="flex items-center justify-between p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg">
                <div className="flex-1">
                  {getPreview()}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setRemoteUrl('');
                  }}
                  className="ml-2 p-1 hover:bg-[rgb(var(--color-border))] rounded-full transition"
                >
                  <X size={18} className="text-[rgb(var(--color-text-secondary))]" />
                </button>
              </div>
            )}

            {isUploading && (
              <div className="w-full bg-[rgb(var(--color-border))] rounded-full h-2 overflow-hidden">
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

            <div className="flex gap-2 items-center flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[rgb(var(--color-surface-hover))] rounded-full text-sm hover:bg-[rgb(var(--color-border))] transition flex items-center gap-2 text-[rgb(var(--color-text))]"
              >
                <Paperclip size={16} className="text-[rgb(var(--color-text-secondary))]" /> {file ? 'Change File' : 'Attach'}
              </button>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[rgb(var(--color-text-secondary))]">or</span>
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => {
                    setRemoteUrl(e.target.value);
                    setFile(null);
                  }}
                  placeholder="Paste image/video/file URL..."
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] text-[rgb(var(--color-text))]"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading || (!content.trim() && !file && !remoteUrl.trim())}
                className="ml-auto bg-[rgba(var(--color-accent),1)] disabled:bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-on-primary))] px-6 py-2 rounded-full hover:bg-[rgba(var(--color-primary),1)] flex items-center gap-2 font-semibold transition"
              >
                <Send size={16} />
                {isUploading ? 'Uploading...' : 'Post'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 flex items-center gap-3 hover:bg-[rgb(var(--color-surface-hover))] transition"
          >
            <Edit3 size={20} className="text-[rgb(var(--color-text-secondary))]" />
            <span className="text-[rgb(var(--color-text-secondary))]" >Write a post...</span>
          </button>
        )}
      </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] sticky top-[0px] z-30">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'posts' ? 'border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]' : 'border-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
        >
            <LayoutGrid size={18} /> Posts
        </button>
        <button 
          onClick={() => setActiveTab('shots')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'shots' ? 'border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]' : 'border-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
        >
            <Smartphone size={18} /> Shots
        </button>
      </div>

      <div>
        {/* CONDITIONAL RENDERING: POSTS vs SHOTS */}
        {activeTab === 'shots' ? (
            <Shots />
        ) : (
        <>
        {posts.length === 0 && !isLoadingMorePosts && ( // <-- Modified condition
          <div className="text-center py-12 text-[rgb(var(--color-text-secondary))]" >
            {FOLLOW_ONLY_FEED ? 'No posts from people you follow yet.' : 'No posts yet. Be the first!'}
          </div>
        )}
        {posts.map((post) => (
          <div key={post.id} className="border-b border-[rgb(var(--color-border))] p-4 hover:bg-[rgb(var(--color-surface-hover))] transition bg-[rgb(var(--color-surface))]" >
            <div className="flex gap-4 items-start">
              <button onClick={() => goToProfile(post.user_id)} className="flex-shrink-0 relative">
                <img
                  src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`}
                  className="w-12 h-12 rounded-full hover:opacity-80 transition"
                  alt="Avatar"
                />
                {isOnline(post.profiles?.last_seen) && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[rgb(var(--color-surface))] rounded-full" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => goToProfile(post.user_id)} className="font-bold hover:underline text-[rgb(var(--color-text))]" >
                    {post.profiles?.display_name}
                  </button>
                  {post.profiles?.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))]" />}
                  <span className="text-[rgb(var(--color-text-secondary))] text-sm">@{post.profiles?.username}</span>
                  <span className="text-[rgb(var(--color-text-secondary))] text-sm">· {new Date(post.created_at).toLocaleDateString()} at {formatTime(post.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[rgb(var(--color-text))]" >{post.content}</p>
                {post.media_url && (
                  <div className="mt-3">
                    {post.media_type === 'image' && (
                      <img 
                        src={post.media_url} 
                        className="rounded-2xl max-h-96 object-cover w-full cursor-pointer transition hover:opacity-90" 
                        alt="Post" 
                        onClick={() => openLightbox(post.media_url, 'image')}
                      />
                    )}
                    {post.media_type === 'video' && (
                      <video controls className="rounded-2xl max-h-96 w-full">
                        <source src={post.media_url} />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {post.media_type === 'document' && (
                      <a
                        href={post.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg hover:bg-[rgb(var(--color-border))] transition inline-block text-[rgb(var(--color-text))]" 
                      >
                        <FileText size={20} className="text-[rgb(var(--color-text-secondary))]" /> Download File
                      </a>
                    )}
                  </div>
                )}
                
                {/* Action Bar */}
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-1 group">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleInitialLike(post); }}
                      className={`p-2 rounded-full transition ${
                        likedPostIds.has(post.id) 
                          ? 'text-pink-500 bg-pink-500/10' 
                          : 'text-[rgb(var(--color-text-secondary))] hover:bg-pink-500/10 hover:text-pink-500'
                      }`}
                    >
                      <Heart size={18} fill={likedPostIds.has(post.id) ? "currentColor" : "none"} />
                    </button>
                    {(post.like_count > 0) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openLikesList(post.id); }}
                        className="text-sm text-[rgb(var(--color-text-secondary))] hover:underline"
                      >
                        {post.like_count}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 group">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openCommentsList(post.id); }}
                      className="p-2 rounded-full transition text-[rgb(var(--color-text-secondary))] hover:bg-blue-500/10 hover:text-blue-500"
                    >
                      <MessageCircle size={18} />
                    </button>
                    {(post.comment_count > 0) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openCommentsList(post.id); }}
                        className="text-sm text-[rgb(var(--color-text-secondary))] hover:underline"
                      >
                        {post.comment_count}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* --- PAGINATION INDICATORS START --- */}
        {isLoadingMorePosts && (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-[rgb(var(--color-accent))] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!isLoadingMorePosts && !hasMorePosts && posts.length > 0 && (
          <div className="text-center py-8 text-sm text-[rgb(var(--color-text-secondary))]">
            You've reached the end of the feed.
          </div>
        )}
        {/* --- PAGINATION INDICATORS END --- */}
        </>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && lightboxMediaUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowLightbox(false)}
        >
          <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            {lightboxMediaType === 'image' && (
              <img 
                src={lightboxMediaUrl} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                alt="Full size view"
              />
            )}
            {lightboxMediaType === 'video' && (
              <video 
                controls 
                autoPlay
                className="max-w-full max-h-[90vh] rounded-2xl"
              >
                <source src={lightboxMediaUrl} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <button 
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Likes Modal */}
      {activeLikesModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4"
          onClick={() => setActiveLikesModal(null)}
        >
          <div 
            className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl max-h-[70vh] flex flex-col shadow-2xl border border-[rgb(var(--color-border))]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Likes</h3>
              <button onClick={() => setActiveLikesModal(null)} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full">
                <X size={20} className="text-[rgb(var(--color-text))]" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {likersList.length === 0 ? (
                 <p className="text-center text-[rgb(var(--color-text-secondary))]">No likes yet.</p>
              ) : (
                likersList.map((liker, idx) => (
                  <div key={`${liker.user_id}-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img 
                        src={liker.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.profiles?.username}`}
                        className="w-10 h-10 rounded-full cursor-pointer"
                        alt="Avatar"
                        onClick={() => goToProfile(liker.user_id)}
                        />
                        <div>
                        <button onClick={() => goToProfile(liker.user_id)} className="font-bold hover:underline text-[rgb(var(--color-text))] text-sm block">
                            {liker.profiles?.display_name}
                            {liker.profiles?.verified && <BadgeCheck size={14} className="inline ml-1 text-[rgb(var(--color-accent))]" />}
                        </button>
                        <span className="text-sm text-[rgb(var(--color-text-secondary))]">@{liker.profiles?.username}</span>
                        </div>
                    </div>
                    {/* Requirement: Unliking is only possible from here */}
                    {liker.user_id === user?.id && (
                        <button 
                            onClick={() => handleRemoveLikeFromModal(activeLikesModal)}
                            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                            title="Remove Like"
                        >
                            <Heart size={16} className="fill-current" />
                        </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {activeCommentsModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4"
          onClick={() => setActiveCommentsModal(null)}
        >
          <div 
            className="bg-[rgb(var(--color-surface))] w-full max-w-lg rounded-2xl h-[80vh] flex flex-col shadow-2xl border border-[rgb(var(--color-border))]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Comments</h3>
              <button onClick={() => setActiveCommentsModal(null)} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full">
                <X size={20} className="text-[rgb(var(--color-text))]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {commentsList.length === 0 ? (
                 <div className="h-full flex items-center justify-center">
                   <p className="text-[rgb(var(--color-text-secondary))]">No comments yet. Be the first!</p>
                 </div>
              ) : (
                commentsList.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                       src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`}
                       className="w-9 h-9 rounded-full cursor-pointer flex-shrink-0"
                       alt="Avatar"
                       onClick={() => goToProfile(comment.user_id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <button onClick={() => goToProfile(comment.user_id)} className="font-bold hover:underline text-[rgb(var(--color-text))] text-sm">
                          {comment.profiles?.display_name}
                        </button>
                        {comment.profiles?.verified && <BadgeCheck size={12} className="text-[rgb(var(--color-accent))]" />}
                        <span className="text-xs text-[rgb(var(--color-text-secondary))]">{formatTime(comment.created_at)}</span>
                      </div>
                      <p className="text-[rgb(var(--color-text))] text-sm mt-0.5 whitespace-pre-wrap break-words bg-[rgb(var(--color-surface-hover))] p-2 rounded-r-xl rounded-bl-xl inline-block">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="p-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-b-2xl">
              <div className="flex items-center gap-2 bg-[rgb(var(--color-surface-hover))] rounded-full px-4 py-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[rgb(var(--color-text))]"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={!newCommentText.trim() || isPostingComment}
                  className="text-[rgb(var(--color-accent))] disabled:opacity-50 hover:text-[rgb(var(--color-primary))] transition"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
