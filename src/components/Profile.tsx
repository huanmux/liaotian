import { useEffect, useState } from 'react';
import { supabase, Profile as ProfileType, Post } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BadgeCheck, Edit2, Check, MessageCircle } from 'lucide-react';

export const Profile = ({ userId, onMessage }: { userId?: string; onMessage?: (profile: ProfileType) => void }) => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { user, profile: currentProfile } = useAuth();

  const targetUserId = userId || user?.id;
  const isOwnProfile = targetUserId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
      loadPosts();
      loadFollowStats();
      if (!isOwnProfile) checkFollowing();
    }
  }, [targetUserId]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle();
    setProfile(data);
    if (data) {
      setDisplayName(data.display_name);
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
      setBannerUrl(data.banner_url || '');
    }
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const loadFollowStats = async () => {
    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
    const { count: followingC } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
    setFollowerCount(followers || 0);
    setFollowingCount(followingC || 0);
  };

  const checkFollowing = async () => {
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user!.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setFollowing(!!data);
  };

  const updateProfile = async () => {
    await supabase.from('profiles').update({
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      banner_url: bannerUrl
    }).eq('id', user!.id);
    setIsEditing(false);
    loadProfile();
  };

  const toggleFollow = async () => {
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user!.id).eq('following_id', targetUserId);
    } else {
      await supabase.from('follows').insert({ follower_id: user!.id, following_id: targetUserId });
    }
    setFollowing(!following);
    loadFollowStats();
  };

  if (!profile) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white">
        {/* Banner */}
        <div className="relative h-48 bg-gray-300">
          {profile.banner_url ? (
            <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600" />
          )}
        </div>

        {/* Avatar + Actions */}
        <div className="relative px-4 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16">
            <div className="relative">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg ring-4 ring-white"
                alt="Avatar"
              />
            </div>

            <div className="mt-4 sm:mt-0 flex gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => isEditing ? updateProfile() : setIsEditing(true)}
                  className="px-5 py-2.5 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                  {isEditing ? 'Save' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onMessage?.(profile)}
                    className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button
                    onClick={toggleFollow}
                    className={`px-6 py-2.5 rounded-full font-semibold transition ${
                      following
                        ? 'bg-white border border-gray-300 hover:bg-gray-50'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          {isEditing ? (
            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Avatar URL"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Banner URL"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                {profile.verified && <BadgeCheck size={22} className="text-blue-500" />}
              </div>
              <p className="text-gray-500">@{profile.username}</p>
              {profile.bio && <p className="mt-3 text-gray-800">{profile.bio}</p>}
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <strong className="text-lg">{followingCount}</strong>{' '}
                  <span className="text-gray-500">Following</span>
                </div>
                <div>
                  <strong className="text-lg">{followerCount}</strong>{' '}
                  <span className="text-gray-500">Followers</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 bg-white">
            <div className="flex gap-3">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                className="w-12 h-12 rounded-full"
                alt="Avatar"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold">{profile.display_name}</span>
                  {profile.verified && <BadgeCheck size={16} className="text-blue-500" />}
                  <span className="text-gray-500 text-sm">@{profile.username}</span>
                  <span className="text-gray-500 text-sm">· {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} className="mt-2 rounded-2xl max-h-96 object-cover" alt="Post" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};