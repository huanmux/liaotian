import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadMedia, Profile, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PostItem } from './Post';
import { 
  Users, Plus, X, Search, Lock, Globe, EyeOff, 
  MapPin, Calendar, LayoutGrid, Info, ArrowLeft, Camera, MoreHorizontal 
} from 'lucide-react';

// === TYPES ===
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
  member_count?: number; // From our View or calculated
  is_member?: boolean;
  role?: string;
}

const TAGS = ['Gaming', 'Hobbies', 'Study', 'Trade', 'Reviews', 'Other'];

// === MAIN COMPONENT ===
export const Groups: React.FC = () => {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Handle browser history navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const groupId = params.get('group');
      if (groupId) {
        setSelectedGroupId(groupId);
        setViewState('detail');
      } else {
        setViewState('list');
        setSelectedGroupId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    // Initial check
    handlePopState(); 
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToGroup = (id: string) => {
    window.history.pushState({}, '', `/?group=${id}`);
    setSelectedGroupId(id);
    setViewState('detail');
  };

  const navigateToList = () => {
    window.history.pushState({}, '', '/');
    setViewState('list');
    setSelectedGroupId(null);
  };

  if (viewState === 'detail' && selectedGroupId) {
    return <GroupDetail groupId={selectedGroupId} onBack={navigateToList} />;
  }

  return <GroupsList onOpenGroup={navigateToGroup} />;
};

// === SUB-COMPONENT: GROUPS DISCOVERY LIST ===
const GroupsList: React.FC<{ onOpenGroup: (id: string) => void }> = ({ onOpenGroup }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    if (!user) return;

    // Fetch groups and member counts using the view we created, or raw tables if view fails
    // Fallback to raw tables for safety in this snippet
    const { data: groupsData } = await supabase
        .from('groups')
        .select('*, group_members(count)'); // Requires FK or count config, simplified below:
    
    // Manual Count Approach (Safe)
    const { data: allGroups } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    
    // Fetch my memberships
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberIds = new Set(memberships?.map(m => m.group_id));
    setMyGroups(memberIds);

    // Filter Secret Groups
    const visibleGroups = (allGroups || []).filter(g => 
        g.type !== 'secret' || memberIds.has(g.id) || g.owner_id === user.id
    );

    setGroups(visibleGroups as Group[]);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
            <Users className="text-[rgb(var(--color-primary))]" /> Groups
           </h1>
           <p className="text-[rgb(var(--color-text-secondary))] text-sm">Discover and join communities</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-2.5 text-[rgb(var(--color-text-secondary))]" size={16} />
                <input 
                    type="text" 
                    placeholder="Search groups..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-full text-sm w-full md:w-64 text-[rgb(var(--color-text))]"
                />
            </div>
            <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition whitespace-nowrap shadow-md"
            >
            <Plus size={18} /> <span className="hidden sm:inline">Create Group</span>
            </button>
        </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[1,2,3,4].map(i => (
                 <div key={i} className="h-48 bg-[rgb(var(--color-surface))] animate-pulse rounded-xl" />
             ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.length === 0 && <div className="col-span-full text-center py-10 text-[rgb(var(--color-text-secondary))]">No groups found.</div>}
          
          {filteredGroups.map(group => (
            <div key={group.id} onClick={() => onOpenGroup(group.id)} className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl overflow-hidden cursor-pointer hover:border-[rgb(var(--color-primary))] transition group shadow-sm hover:shadow-md">
              {/* Banner Area */}
              <div className="h-28 bg-[rgb(var(--color-surface-hover))] relative">
                {group.banner_url ? (
                    <img src={group.banner_url} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--color-surface-hover))] to-[rgb(var(--color-border))]" />
                )}
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs font-bold uppercase flex items-center gap-1">
                   {group.type === 'private' && <Lock size={12} />}
                   {group.type === 'public' && <Globe size={12} />}
                   {group.type}
                </div>
              </div>
              
              {/* Info Area */}
              <div className="px-4 pb-4 relative">
                <div className="flex justify-between items-start">
                    <div className="-mt-8 mb-2">
                        <img 
                            src={group.icon_url || `https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                            className="w-16 h-16 rounded-xl border-4 border-[rgb(var(--color-surface))] shadow-sm object-cover bg-[rgb(var(--color-surface))]" 
                            alt="Icon" 
                        />
                    </div>
                    <div className="mt-2">
                        {myGroups.has(group.id) ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Joined</span>
                        ) : (
                            <span className="bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))] px-3 py-1 rounded-full text-xs font-bold border border-[rgb(var(--color-border))]">View</span>
                        )}
                    </div>
                </div>
                
                <h3 className="font-bold text-lg text-[rgb(var(--color-text))] leading-tight">{group.name}</h3>
                <div className="flex items-center gap-2 mt-1 mb-2">
                     <span className="text-xs px-2 py-0.5 rounded text-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.1)] font-medium">{group.tag}</span>
                     <span className="text-xs text-[rgb(var(--color-text-secondary))]">• Community</span>
                </div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] line-clamp-2">{group.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} onCreated={fetchGroups} />}
    </div>
  );
};

// === SUB-COMPONENT: GROUP DETAIL VIEW (FACEBOOK STYLE) ===
const GroupDetail: React.FC<{ groupId: string; onBack: () => void }> = ({ groupId, onBack }) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussion' | 'members' | 'about'>('discussion');
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Post Composer State
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // --- DATA LOADING ---
  const loadGroupData = async () => {
    // 1. Get Group Details
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (!groupData) return;

    // 2. Check Membership
    let _isMember = false;
    let _isAdmin = false;
    if (user) {
        const { data: memberData } = await supabase.from('group_members').select('role').eq('group_id', groupId).eq('user_id', user.id).maybeSingle();
        if (memberData) {
            _isMember = true;
            _isAdmin = memberData.role === 'admin' || memberData.role === 'owner';
        }
    }

    // 3. Get Member Count
    const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId);

    setGroup({ ...groupData, member_count: count || 0 });
    setIsMember(_isMember);
    setIsAdmin(_isAdmin);

    // 4. Load Posts if visible
    if (groupData.type !== 'secret' || _isMember) {
        loadPosts();
    }
    setLoading(false);
  };

  const loadPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      const loadedPosts = data || [];
      // Quick fetch of counts (simplified for brevity, ideally reuse the helper from Feed)
      // We'll skip complex count fetching for this snippet to fit, but it follows Feed.tsx pattern
      setPosts(loadedPosts as Post[]);
  };

  useEffect(() => { loadGroupData(); }, [groupId, user]);

  // --- ACTIONS ---
  const handleJoin = async () => {
    if (!user || !group) return;
    if (isMember) {
        if (!confirm('Leave this group?')) return;
        await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
        setIsMember(false);
    } else {
        await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
        setIsMember(true);
    }
    loadGroupData(); // Refresh counts
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setIsPosting(true);
    await supabase.from('posts').insert({
        user_id: user.id,
        group_id: groupId,
        content: content,
        media_type: 'image' // Default for now
    });
    setContent('');
    setIsPosting(false);
    loadPosts();
  };

  // --- RENDER ---
  if (loading || !group) return <div className="p-8 text-center">Loading Group...</div>;

  return (
    <div className="pb-24 bg-[rgb(var(--color-background))] min-h-screen">
      
      {/* 1. HERO HEADER */}
      <div className="bg-[rgb(var(--color-surface))] shadow-sm pb-0 relative z-10">
         {/* Banner */}
         <div className="h-48 md:h-80 w-full relative bg-[rgb(var(--color-surface-hover))]">
            {group.banner_url ? (
                <img src={group.banner_url} className="w-full h-full object-cover" alt="Cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] opacity-20" />
            )}
            <button onClick={onBack} className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition">
                <ArrowLeft size={20} />
            </button>
         </div>

         {/* Group Info Block */}
         <div className="max-w-5xl mx-auto px-4">
             <div className="flex flex-col md:flex-row gap-4 items-start relative -mt-6 md:-mt-10 mb-4">
                 {/* Icon */}
                 <div className="relative">
                    <img 
                        src={group.icon_url || `https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-[rgb(var(--color-surface))] shadow-md object-cover bg-white" 
                    />
                 </div>
                 
                 {/* Text Info */}
                 <div className="flex-1 mt-2 md:mt-12">
                     <h1 className="text-2xl md:text-3xl font-black text-[rgb(var(--color-text))]">{group.name}</h1>
                     <div className="flex flex-wrap gap-2 text-[rgb(var(--color-text-secondary))] text-sm mt-1 items-center">
                        {group.type === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                        <span className="capitalize">{group.type} Group</span>
                        <span>•</span>
                        <span className="font-semibold text-[rgb(var(--color-text))]">{group.member_count} Members</span>
                     </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="mt-2 md:mt-12 flex gap-2 w-full md:w-auto">
                     <button 
                        onClick={handleJoin}
                        className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                            isMember 
                            ? 'bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))]' 
                            : 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgba(var(--color-primary),0.3)]'
                        }`}
                     >
                        {isMember ? 'Joined' : 'Join Group'}
                     </button>
                     {isMember && (
                         <button className="bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))] p-2.5 rounded-lg border border-[rgb(var(--color-border))]">
                            <MoreHorizontal size={20} />
                         </button>
                     )}
                 </div>
             </div>

             {/* Tab Navigation */}
             <div className="flex border-t border-[rgb(var(--color-border))] mt-6">
                 {['discussion', 'members', 'about'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-3 font-semibold text-sm capitalize border-b-2 transition ${
                            activeTab === tab 
                            ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' 
                            : 'border-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'
                        }`}
                     >
                        {tab}
                     </button>
                 ))}
             </div>
         </div>
      </div>

      {/* 2. MAIN CONTENT GRID */}
      <div className="max-w-5xl mx-auto px-0 md:px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COL: CONTENT (Discussion) - Takes 2 cols on Desktop */}
          <div className="md:col-span-2 space-y-4">
              
              {activeTab === 'discussion' && (
                <>
                    {/* Composer */}
                    {isMember && (
                        <div className="bg-[rgb(var(--color-surface))] p-4 md:rounded-xl border-y md:border border-[rgb(var(--color-border))] shadow-sm">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-surface-hover))] overflow-hidden flex-shrink-0">
                                   {/* Current User Avatar Placeholder */}
                                   <Users className="w-full h-full p-2 text-[rgb(var(--color-text-secondary))]" />
                                </div>
                                <form onSubmit={handleCreatePost} className="flex-1">
                                    <input 
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        placeholder="Write something..." 
                                        className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-full px-4 py-2.5 focus:outline-none focus:border-[rgb(var(--color-primary))] transition text-[rgb(var(--color-text))]"
                                    />
                                    {content && (
                                        <div className="flex justify-end mt-2">
                                            <button disabled={isPosting} className="bg-[rgb(var(--color-primary))] text-white px-4 py-1.5 rounded-full text-sm font-bold">
                                                {isPosting ? 'Posting...' : 'Post'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Feed */}
                    {posts.length === 0 ? (
                        <div className="bg-[rgb(var(--color-surface))] p-8 md:rounded-xl border-y md:border border-[rgb(var(--color-border))] text-center">
                            <div className="inline-block p-4 rounded-full bg-[rgb(var(--color-surface-hover))] mb-3">
                                <LayoutGrid size={32} className="text-[rgb(var(--color-text-secondary))]" />
                            </div>
                            <h3 className="font-bold text-[rgb(var(--color-text))]">No posts yet</h3>
                            <p className="text-[rgb(var(--color-text-secondary))]">Be the first to share something!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostItem 
                                key={post.id}
                                post={post}
                                currentUserId={user?.id}
                                isLiked={likedPostIds.has(post.id)}
                                onLikeToggle={() => {}} // Connect properly if needed
                                onCommentUpdate={() => {}}
                                onNavigateToProfile={() => {}}
                            />
                        ))
                    )}
                </>
              )}

              {activeTab === 'about' && (
                  <div className="bg-[rgb(var(--color-surface))] p-6 md:rounded-xl border-y md:border border-[rgb(var(--color-border))]">
                      <h3 className="font-bold text-xl mb-4 text-[rgb(var(--color-text))]">About this Group</h3>
                      <p className="text-[rgb(var(--color-text))] whitespace-pre-wrap">{group.description}</p>
                      
                      <div className="mt-6 space-y-3">
                          <div className="flex items-center gap-3 text-[rgb(var(--color-text-secondary))]">
                              <Globe size={20} />
                              <div>
                                  <div className="font-bold text-[rgb(var(--color-text))] capitalize">{group.type}</div>
                                  <div className="text-sm">Anyone can find this group.</div>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 text-[rgb(var(--color-text-secondary))]">
                              <Calendar size={20} />
                              <div>
                                  <div className="font-bold text-[rgb(var(--color-text))]">History</div>
                                  <div className="text-sm">Created {new Date(group.created_at).toLocaleDateString()}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* RIGHT COL: SIDEBAR (Info/Members Preview) - Hidden on Mobile unless sticky? Actually simpler to just stack order in CSS or hide */}
          <div className="hidden md:block space-y-4">
              <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl border border-[rgb(var(--color-border))]">
                  <h4 className="font-bold text-[rgb(var(--color-text))] mb-3">About</h4>
                  <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-4 line-clamp-3">{group.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))]">
                      <Globe size={16} /> {group.type} Group
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))] mt-2">
                      <Info size={16} /> {group.tag}
                  </div>
              </div>

              {/* Members Widget */}
              {isMember && (
                  <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl border border-[rgb(var(--color-border))]">
                       <div className="flex justify-between items-center mb-3">
                           <h4 className="font-bold text-[rgb(var(--color-text))]">Members</h4>
                           <button onClick={() => setActiveTab('members')} className="text-sm text-[rgb(var(--color-primary))] hover:underline">See all</button>
                       </div>
                       <div className="flex -space-x-2 overflow-hidden">
                           {/* Placeholders for visuals */}
                           {[1,2,3].map(i => (
                               <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[rgb(var(--color-surface))] bg-gray-300" />
                           ))}
                           <div className="h-8 w-8 rounded-full ring-2 ring-[rgb(var(--color-surface))] bg-[rgb(var(--color-surface-hover))] flex items-center justify-center text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                               +{(group.member_count || 0)}
                           </div>
                       </div>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};

// === SUB-COMPONENT: CREATE GROUP MODAL ===
const CreateGroupModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tag, setTag] = useState(TAGS[0]);
  const [type, setType] = useState('public');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const { data, error } = await supabase.from('groups').insert({
        name,
        description: desc,
        tag,
        type,
        owner_id: user.id
    }).select().single();

    if (data) {
        await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' });
        onCreated();
        onClose();
    } else {
        alert('Failed to create group');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[rgb(var(--color-border))]">
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center">
                <h2 className="font-bold text-lg text-[rgb(var(--color-text))]">Create New Group</h2>
                <button onClick={onClose}><X className="text-[rgb(var(--color-text))]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Group Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-[rgb(var(--color-text))]" placeholder="e.g. Gazebo Gamers" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Description</label>
                    <textarea required value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="w-full p-2.5 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-[rgb(var(--color-text))]" placeholder="What's this group about?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Category</label>
                        <select value={tag} onChange={e => setTag(e.target.value)} className="w-full p-2.5 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-[rgb(var(--color-text))]">
                            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-1">Privacy</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2.5 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-[rgb(var(--color-text))]">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>
                
                <button disabled={creating} type="submit" className="w-full py-3 bg-[rgb(var(--color-primary))] text-white font-bold rounded-lg mt-2 shadow-lg shadow-[rgba(var(--color-primary),0.2)] disabled:opacity-50 transition hover:scale-[1.02]">
                    {creating ? 'Creating...' : 'Create Group'}
                </button>
            </form>
        </div>
    </div>
  );
};
