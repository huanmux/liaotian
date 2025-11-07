import { useEffect, useState, useRef } from 'react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck } from 'lucide-react';

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { user } = useAuth();

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    loadPosts();

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setPosts((current) => [data, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const { data, error } = await supabase
      .from('posts')
      .insert({ 
        user_id: user!.id, 
        content, 
        image_url: imageUrl || null 
      })
      .select('*, profiles(*)')
      .single();

    if (data && !error) {
      setContent('');
      setImageUrl('');
      // No need to push — realtime will add it
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={createPost} className="border-b border-gray-200 p-4 bg-white sticky top-14 z-40">
        <textarea
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none focus:outline-none text-lg placeholder-gray-500"
          rows={3}
        />
        <div className="flex items-center gap-3 mt-3">
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="bg-blue-500 disabled:bg-gray-300 text-white px-6 py-2 rounded-full hover:bg-blue-600 flex items-center gap-2 font-semibold transition"
          >
            <Send size={16} />
            Post
          </button>
        </div>
      </form>

      <div>
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 transition bg-white">
            <div className="flex gap-3">
              <img
                src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`}
                className="w-12 h-12 rounded-full flex-shrink-0"
                alt="Avatar"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-bold">{post.profiles?.display_name}</span>
                  {post.profiles?.verified && <BadgeCheck size={16} className="text-blue-500" />}
                  <span className="text-gray-500 text-sm">@{post.profiles?.username}</span>
                  <span className="text-gray-500 text-sm">· {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} className="mt-3 rounded-2xl max-h-96 object-cover w-full" alt="Post" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};