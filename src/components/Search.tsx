// src/components/Search.tsx
import { useEffect, useState } from 'react';
import { supabase, Profile, Post } from '../lib/supabase';
import { Search as SearchIcon, X, User, MessageCircle } from 'lucide-react';

const goToProfile = async (profileId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', profileId)
    .single();
  if (data) {
    window.history.replaceState({}, '', `/?${data.username}`);
    window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
  }
};

export const Search = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      const lowerQuery = query.toLowerCase();

      // Search users
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${lowerQuery}%,display_name.ilike.%${lowerQuery}%`)
        .limit(5);

      // Search posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .ilike('content', `%${lowerQuery}%`)
        .limit(10);
        
      setUsers(userData || []);
      setPosts(postData || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-10" onClick={onClose}>
      <div 
        className="bg-[rgb(var(--color-surface))] rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-[rgb(var(--color-border))] sticky top-0 bg-[rgb(var(--color-surface))] rounded-t-2xl z-10">
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-secondary))]" />
            <input
              type="text"
              placeholder="Search users and posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
              autoFocus
            />
          </div>
          <button onClick={onClose} className="p-2 ml-3 hover:bg-[rgb(var(--color-surface-hover))] rounded-full text-[rgb(var(--color-text))]">
            <X size={24} />
          </button>
        </div>

        {loading && query && (
          <div className="p-4 text-center text-[rgb(var(--color-text-secondary))]">
            Loading results for "{query}"...
          </div>
        )}

        {query && !loading && (
          <>
            {users.length > 0 && (
              <div className="p-4 border-b border-[rgb(var(--color-border))]">
                <h3 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-3">
                    <User size={20} className="text-[rgb(var(--color-primary))]" /> Users
                </h3>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onClose();
                      goToProfile(user.id);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--color-surface-hover))] transition text-left"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[rgb(var(--color-text))] truncate">{user.display_name}</div>
                      <div className="text-sm text-[rgb(var(--color-text-secondary))] truncate">@{user.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div className="p-4">
                <h3 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-3">
                    <MessageCircle size={20} className="text-[rgb(var(--color-primary))]" /> Posts
                </h3>
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => {
                        // In a real app, this would navigate to the single post view
                        onClose();
                        // For now, let's just navigate to the user's profile
                        goToProfile(post.user_id);
                    }}
                    className="w-full flex gap-3 p-2 rounded-lg hover:bg-[rgb(var(--color-surface-hover))] transition text-left border-b border-[rgb(var(--color-border))] last:border-b-0"
                  >
                    <img
                      src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-bold text-[rgb(var(--color-text))]">{post.profiles?.display_name}</span>
                        <span className="text-[rgb(var(--color-text-secondary))]">@{post.profiles?.username}</span>
                      </div>
                      <p className="text-[rgb(var(--color-text))] mt-1 line-clamp-2">
                        {post.content}
                      </p>
                      {post.media_url && (
                        <img
                          src={post.media_url}
                          className="mt-2 rounded-xl max-h-48 object-cover w-full"
                          alt=""
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!users.length && !posts.length && (
              <div className="p-12 text-center text-[rgb(var(--color-text-secondary))]">
                No results found for **"{query}"**
              </div>
            )}
          </>
        )}

        {!query && (
          <div className="p-12 text-center text-[rgb(var(--color-text-secondary))]">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Type to search users and posts</p>
          </div>
        )}
      </div>
    </div>
  );
};
