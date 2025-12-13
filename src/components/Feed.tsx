import React, { useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StatusTray } from './Status'; // Using your existing Status logic
import { PostItem } from './Post'; // Using your optimized Post logic

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { scrollY } = useScroll();
  
  const headerY = useTransform(scrollY, [0, 50], [0, -50]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*), original_post:repost_of(*, profiles(*))')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      // Add initial counts if not handled by PostItem internal fetch
      setPosts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    
    // Real-time subscription for new posts
    const channel = supabase.channel('realtime-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        fetchPosts(); // Refresh on new post
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
      <motion.header 
        style={{ y: headerY, opacity: headerOpacity }}
        className="sticky top-0 z-40 p-4 backdrop-blur-xl bg-[rgba(var(--color-background),0.8)] border-b border-[rgba(var(--color-border),0.5)] flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--color-text))]">Home</h1>
        <div className="flex gap-2">
           <button className="p-2 rounded-full hover:bg-[rgb(var(--color-surface-hover))]"><Plus size={20} /></button>
        </div>
      </motion.header>

      {/* Real Status Logic */}
      <StatusTray />

      {/* Real Post Logic with M3 Styling */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-4 px-4 pb-24 mt-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]" />
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <PostItemContainer key={post.id} post={post} />
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}

// Wrapper to apply the new M3 Card styling to your existing PostItem logic
const PostItemContainer = ({ post }: { post: any }) => {
  const { user } = useAuth();
  
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-[rgb(var(--color-surface))] rounded-[28px] overflow-hidden border border-[rgba(var(--color-border),0.4)] hover:shadow-lg transition-all duration-300"
    >
      {/* We reuse the logic from your Post.tsx but within this M3 container */}
      <div className="p-5">
         <div className="flex items-center gap-3 mb-4">
            <img src={post.profiles?.avatar_url} className="w-10 h-10 rounded-full" alt="" />
            <div>
               <h3 className="font-bold text-sm leading-tight text-[rgb(var(--color-text))]">{post.profiles?.display_name}</h3>
               <p className="text-xs text-[rgb(var(--color-text-secondary))]">@{post.profiles?.username}</p>
            </div>
         </div>
         
         <p className="text-[rgb(var(--color-text))] mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
         
         {post.media_url && post.media_type === 'image' && (
           <img src={post.media_url} className="rounded-2xl w-full object-cover max-h-96 mb-4" alt="Content" />
         )}

         <div className="flex items-center justify-between pt-2 border-t border-[rgba(var(--color-border),0.2)]">
            <div className="flex gap-4">
               <button className="flex items-center gap-1.5 text-[rgb(var(--color-text-secondary))] hover:text-pink-500 transition-colors">
                  <Heart size={20} />
                  <span className="text-sm">{post.like_count || 0}</span>
               </button>
               <button className="flex items-center gap-1.5 text-[rgb(var(--color-text-secondary))] hover:text-blue-500 transition-colors">
                  <MessageCircle size={20} />
                  <span className="text-sm">{post.comment_count || 0}</span>
               </button>
            </div>
            <button className="text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors">
               <Share2 size={20} />
            </button>
         </div>
      </div>
    </motion.div>
  );
};
