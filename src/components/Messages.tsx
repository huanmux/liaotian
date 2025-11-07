import { useEffect, useState } from 'react';
import { supabase, Message, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Search } from 'lucide-react';

export const Messages = () => {
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);

      const channel = supabase
        .channel(`messages:${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const msg = payload.new as Message;
            if (
              (msg.sender_id === user!.id && msg.recipient_id === selectedUser.id) ||
              (msg.sender_id === selectedUser.id && msg.recipient_id === user!.id)
            ) {
              setMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, user]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*)')
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    const uniqueUsers = new Map<string, Profile>();
    data?.forEach((msg: any) => {
      const otherUser = msg.sender_id === user!.id ? msg.recipient : msg.sender;
      if (otherUser && !uniqueUsers.has(otherUser.id)) {
        uniqueUsers.set(otherUser.id, otherUser);
      }
    });
    setConversations(Array.from(uniqueUsers.values()));
  };

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', user!.id);
    setUsers(data || []);
  };

  const loadMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user!.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase.from('messages').update({ read: true }).eq('recipient_id', user!.id).eq('sender_id', otherUserId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser) return;

    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user!.id,
        recipient_id: selectedUser.id,
        content,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (data) {
      setContent('');
      setImageUrl('');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-6xl mx-auto border-x border-gray-200">
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {(searchQuery ? filteredUsers : conversations).map((profile) => (
            <button
              key={profile.id}
              onClick={() => { setSelectedUser(profile); setSearchQuery(''); }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 ${selectedUser?.id === profile.id ? 'bg-blue-50' : ''}`}
            >
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                className="w-12 h-12 rounded-full"
                alt="Avatar"
              />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">{profile.display_name}</span>
                  {profile.verified && <BadgeCheck size={14} className="text-blue-500" />}
                </div>
                <span className="text-gray-500 text-xs">@{profile.username}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <img
                src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                className="w-10 h-10 rounded-full"
                alt="Avatar"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{selectedUser.display_name}</span>
                  {selectedUser.verified && <BadgeCheck size={16} className="text-blue-500" />}
                </div>
                <span className="text-gray-500 text-sm">@{selectedUser.username}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender_id === user!.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.image_url && <img src={msg.image_url} className="mt-2 rounded-lg max-w-full" alt="Message" />}
                    <span className={`text-xs ${msg.sender_id === user!.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
};