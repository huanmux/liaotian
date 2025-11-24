import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadMedia, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PostItem } from './Post';
import { Users, Plus, X, Search, Image as ImageIcon, Lock, Globe, EyeOff } from 'lucide-react';

// Types
interface Group {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  banner_url: string;
  type: 'public' | 'private' | 'secret';
  tag: string;
  owner_id: string;
  created_at: string;
  is_member?: boolean; // Helper for UI
}

const TAGS = ['Gaming', 'Hobbies', 'Study', 'Trade', 'Reviews', 'Other'];

export const Groups: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Groups
  const fetchGroups = async () => {
    setLoading(true);
    if (!user) return;

    // Fetch groups
    const { data: groupsData } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    
    // Fetch memberships to mark 'is_member'
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberIds = new Set(memberships?.map(m => m.group_id));

    const processed = (groupsData || [])
        .filter(g => g.type !== 'secret' || memberIds.has(g.id) || g.owner_id === user.id) // Hide secret unless member
        .map(g => ({ ...g, is_member: memberIds.has(g.id) }));

    setGroups(processed as Group[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleOpenGroup = (group: Group) => {
    setSelectedGroup(group);
    setViewState('detail');
  };

  if (viewState === 'detail' && selectedGroup) {
    return <GroupDetail group={selectedGroup} onBack={() => { setViewState('list'); setSelectedGroup(null); fetchGroups(); }} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
          <Users className="text-[rgb(var(--color-primary))]" /> Groups
        </h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus size={18} /> Create Group
        </button>
      </div>

      {loading ? (
         <div className="text-center p-8 text-[rgb(var(--color-text-secondary))]">Loading groups...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length === 0 && <div className="col-span-full text-center text-[rgb(var(--color-text-secondary))]">No groups found. Create one!</div>}
          {groups.map(group => (
            <div key={group.id} onClick={() => handleOpenGroup(group)} className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl overflow-hidden cursor-pointer hover:border-[rgb(var(--color-primary))] transition group-card">
              <div className="h-24 bg-[rgb(var(--color-surface-hover))] relative">
                {group.banner_url && <img src={group.banner_url} className="w-full h-full object-cover" alt="Banner" />}
                <div className="absolute -bottom-6 left-4">
                  <img src={group.icon_url || `https://ui-avatars.com/api/?name=${group.name}&background=random`} className="w-12 h-12 rounded-xl border-4 border-[rgb(var(--color-surface))]" alt="Icon" />
                </div>
              </div>
              <div className="pt-8 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">{group.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-medium">{group.tag}</span>
                  </div>
                  {group.type === 'private' && <Lock size={16} className="text-[rgb(var(--color-text-secondary))]" />}
                  {group.type === 'secret' && <EyeOff size={16} className="text-[rgb(var(--color-text-secondary))]" />}
                  {group.type === 'public' && <Globe size={16} className="text-[rgb(var(--color-text-secondary))]" />}
                </div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-2 line-clamp-2">{group.description}</p>
                <div className="mt-4">
                   {group.is_member ? (
                     <span className="text-sm text-green-500 font-bold flex items-center gap-1">Member</span>
                   ) : (
                     <span className="text-sm text-[rgb(var(--color-primary))] font-bold">View Group</span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} onCreated={fetchGroups} />}
    </div>
  );
};

const GroupDetail: React.FC<{ group: Group; onBack: () => void }> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(group.is_member);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Join/Leave
  const toggleMembership = async () => {
    if (!user) return;
    if (isMember) {
      await supabase.from('group_members').delete().match({ group_id: group.id, user_id: user.id });
      setIsMember(false);
    } else {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
      setIsMember(true);
    }
  };

  // Fetch Posts
  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), groups(id, name, icon_url)')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [group.id]);

  const handlePost = async () => {
    if (!user || !postContent.trim()) return;
    setIsPosting(true);
    await supabase.from('posts').insert({
      user_id: user.id,
      content: postContent,
      group_id: group.id
    });
    setPostContent('');
    setIsPosting(false);
    fetchPosts();
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="relative bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
        <div className="h-48 bg-[rgb(var(--color-surface-hover))] relative">
           {group.banner_url && <img src={group.banner_url} className="w-full h-full object-cover" alt="Banner" />}
           <button onClick={onBack} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70"><X size={20}/></button>
        </div>
        <div className="px-4 pb-4">
           <div className="relative -mt-12 mb-4 flex justify-between items-end">
              <img src={group.icon_url || `https://ui-avatars.com/api/?name=${group.name}&background=random`} className="w-24 h-24 rounded-2xl border-4 border-[rgb(var(--color-surface))]" alt="Icon" />
              <button 
                onClick={toggleMembership}
                className={`px-6 py-2 rounded-full font-bold transition ${isMember ? 'bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))]' : 'bg-[rgb(var(--color-primary))] text-white'}`}
              >
                {isMember ? 'Joined' : 'Join Group'}
              </button>
           </div>
           <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">{group.name}</h1>
           <p className="text-[rgb(var(--color-text-secondary))] mt-1">{group.description}</p>
           <div className="flex gap-2 mt-2 text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase">
              <span>{group.type} Group</span> • <span>{group.tag}</span>
           </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto mt-4">
        {isMember && (
          <div className="p-4 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl mb-4 mx-4 md:mx-0">
             <textarea 
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder={`Post something in ${group.name}...`}
                className="w-full bg-transparent outline-none text-[rgb(var(--color-text))]"
             />
             <div className="flex justify-end mt-2">
                <button onClick={handlePost} disabled={isPosting} className="bg-[rgb(var(--color-primary))] text-white px-4 py-1.5 rounded-full text-sm font-bold">Post</button>
             </div>
          </div>
        )}

        {loading ? (
            <div className="p-8 text-center text-[rgb(var(--color-text-secondary))]">Loading posts...</div>
        ) : posts.length === 0 ? (
            <div className="p-8 text-center text-[rgb(var(--color-text-secondary))]">No posts yet. Be the first!</div>
        ) : (
            posts.map(post => (
                <PostItem 
                    key={post.id} 
                    post={post} 
                    currentUserId={user?.id} 
                    isLiked={false} 
                    onLikeToggle={() => {}} 
                    onCommentUpdate={() => {}} 
                    onNavigateToProfile={() => {}} 
                />
            ))
        )}
      </div>
    </div>
  );
};

const CreateGroupModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tag, setTag] = useState(TAGS[0]);
  const [type, setType] = useState('public');
  const [icon, setIcon] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    let iconUrl = '';
    let bannerUrl = '';

    if (icon) {
        const res = await uploadMedia(icon, 'posts'); // reusing posts bucket logic for now
        if (res) iconUrl = res.url;
    }
    if (banner) {
        const res = await uploadMedia(banner, 'posts');
        if (res) bannerUrl = res.url;
    }

    const { data, error } = await supabase.from('groups').insert({
        name,
        description: desc,
        tag,
        type,
        owner_id: user.id,
        icon_url: iconUrl,
        banner_url: bannerUrl
    }).select().single();

    if (data) {
        // Auto join owner
        await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' });
        onCreated();
        onClose();
    } else {
        console.error(error);
        alert('Failed to create group');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
        <div className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center">
                <h2 className="font-bold text-lg text-[rgb(var(--color-text))]">Create New Group</h2>
                <button onClick={onClose}><X className="text-[rgb(var(--color-text))]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Group Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-text))]" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Description</label>
                    <textarea required value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-text))]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Category</label>
                        <select value={tag} onChange={e => setTag(e.target.value)} className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-text))]">
                            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Type</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-text))]">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="secret">Secret</option>
                        </select>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Icon (Optional)</label>
                         <input type="file" accept="image/*" onChange={e => setIcon(e.target.files?.[0] || null)} className="w-full text-xs text-[rgb(var(--color-text-secondary))]" />
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Banner (Optional)</label>
                         <input type="file" accept="image/*" onChange={e => setBanner(e.target.files?.[0] || null)} className="w-full text-xs text-[rgb(var(--color-text-secondary))]" />
                    </div>
                </div>

                <button disabled={creating} type="submit" className="w-full py-3 bg-[rgb(var(--color-primary))] text-white font-bold rounded-lg mt-4 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Group'}
                </button>
            </form>
        </div>
    </div>
  );
};
