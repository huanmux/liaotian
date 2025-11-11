// src/components/Messages.tsx
import { useEffect, useState, useRef } from 'react';
import { supabase, Message, Profile, uploadMedia } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Search, ArrowLeft, X, Paperclip, FileText, Link } from 'lucide-react';

export const Messages = () => {
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingChannelRef = useRef<any>(null);
  const outgoingTypingChannelRef = useRef<any>(null);

  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToProfile = async (profileId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', profileId)
      .single();
    if (data) {
      window.history.replaceState({}, '', `/?${data.username}`);
    }
    window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
  };

  const loadConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        created_at,
        sender:profiles!sender_id(id, username, display_name, avatar_url, verified),
        recipient:profiles!recipient_id(id, username, display_name, avatar_url, verified)
      `)
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    const convMap = new Map<string, { profile: Profile; latest: string }>();
    data?.forEach((msg: any) => {
      const other = msg.sender_id === user!.id ? msg.recipient : msg.sender;
      if (other) {
        const existing = convMap.get(other.id);
        if (!existing || msg.created_at > existing.latest) {
          convMap.set(other.id, { profile: other, latest: msg.created_at });
        }
      }
    });

    const sorted = Array.from(convMap.values())
      .sort((a, b) => b.latest.localeCompare(a.latest))
      .map(c => c.profile);

    setConversations(sorted);
  };

  useEffect(() => {
    const handleOpenDM = (e: any) => {
      const profile = e.detail;
      if (profile && profile.id !== user?.id) {
        setSelectedUser(profile);
        setShowSidebar(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM);
    return () => window.removeEventListener('openDirectMessage', handleOpenDM);
  }, [user]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(20);
      setSearchResults(data || []);
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedUser) {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      if (outgoingTypingChannelRef.current) {
        outgoingTypingChannelRef.current.unsubscribe();
        outgoingTypingChannelRef.current = null;
      }
      return;
    }

    loadMessages(selectedUser.id);
    setShowSidebar(false);

    const messageChannel = supabase
      .channel(`messages:${selectedUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user!.id && msg.recipient_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.recipient_id === user!.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
            loadConversations();
          }
        }
      )
      .subscribe();

    const incomingChannelName = `typing:${selectedUser.id}:${user!.id}`;
    typingChannelRef.current = supabase.channel(incomingChannelName);

    typingChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannelRef.current.presenceState();
        const typing = Object.values(state).flat().some((p: any) => p.typing === true);
        setIsOtherTyping(typing);
      })
      .subscribe();

    const outgoingChannelName = `typing:${user!.id}:${selectedUser.id}`;
    outgoingTypingChannelRef.current = supabase.channel(outgoingChannelName);

    outgoingTypingChannelRef.current
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await outgoingTypingChannelRef.current.track({ typing: false });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      if (outgoingTypingChannelRef.current) {
        outgoingTypingChannelRef.current.untrack();
        outgoingTypingChannelRef.current.unsubscribe();
        outgoingTypingChannelRef.current = null;
      }
    };
  }, [selectedUser, user]);

  const sendTypingStatus = async (typing: boolean) => {
    if (!outgoingTypingChannelRef.current) return;
    try {
      await outgoingTypingChannelRef.current.track({ typing });
    } catch (err) {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContent(value);

    if (value.trim()) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);
    } else {
      sendTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file && !remoteUrl.trim() || !selectedUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    let media_url = null;
    let media_type = null;

    if (file) {
      const result = await uploadMedia(file, 'messages', (percent) => {
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

    sendTypingStatus(false);
    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user!.id,
        recipient_id: selectedUser.id,
        content,
        media_url,
        media_type,
      })
      .select()
      .single();

    if (data) {
      setContent('');
      setFile(null);
      setRemoteUrl('');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const loadMessages = async (recipientId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(scrollToBottom, 100);
  };

  const displayList = searchQuery ? searchResults : conversations;

  const getPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        return <img src={url} className="max-h-32 rounded-lg" alt="Preview" />;
      }
      if (file.type.startsWith('video/')) {
        return <video src={url} className="max-h-32 rounded-lg" controls />;
      }
      return (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
          <FileText size={16} />
          <span>{file.name}</span>
        </div>
      );
    }
    if (remoteUrl) {
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return <img src={remoteUrl} className="max-h-32 rounded-lg" alt="Remote preview" />;
      }
      if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) {
        return <video src={remoteUrl} className="max-h-32 rounded-lg" controls />;
      }
      return (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
          <Link size={16} />
          <span className="truncate max-w-[150px]">{remoteUrl}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-[rgb(var(--color-background))] overflow-hidden">
      <div className={`w-full md:w-96 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative fixed inset-y-0 left-0 z-40 md:z-auto`}>
        <div className="p-4 border-b border-[rgb(var(--color-border))] sticky top-0 bg-[rgb(var(--color-surface))] z-10">
          <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] mb-4">Chats</h2>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3.5 text-[rgb(var(--color-text-secondary))]" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 && (
            <div className="p-8 text-center text-[rgb(var(--color-text-secondary))]">
              {searchQuery ? 'No users found' : 'No conversations yet'}
            </div>
          )}

          {displayList.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                setShowSidebar(false);
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 p-4 transition border-b border-[rgb(var(--color-border))] ${selectedUser?.id === u.id ? 'bg-[rgb(var(--color-surface-hover))]' : 'hover:bg-[rgb(var(--color-surface-hover))]'}`}
            >
              <img
                src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                className="w-14 h-14 rounded-full object-cover"
                alt=""
              />
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                  {u.display_name}
                  {u.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                </div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))] truncate">@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[rgb(var(--color-background))] transition-all duration-300 ease-in-out ${selectedUser ? '' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            <div className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] p-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
              <button onClick={() => setShowSidebar(true)} className="md:hidden p-1 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition">
                <ArrowLeft size={24} className="text-[rgb(var(--color-text-secondary))]" />
              </button>
              <button onClick={() => goToProfile(selectedUser.id)} className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div className="text-left min-w-0">
                  <div className="font-bold flex items-center gap-1 truncate text-[rgb(var(--color-text))]">
                    {selectedUser.display_name}
                    {selectedUser.verified && <BadgeCheck size={16} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
                  </div>
                  <div className="text-sm text-[rgb(var(--color-text-secondary))] truncate">@{selectedUser.username}</div>
                </div>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgb(var(--color-background))]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[65%] px-3 py-2 rounded-xl shadow-md ${
                      msg.sender_id === user!.id
                        ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))] rounded-br-none'
                        : 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-tl-none'
                    }`}
                  >
                    {msg.media_url && (
                      <div className="mt-2">
                        {msg.media_type === 'image' && (
                          <img src={msg.media_url} className="mb-2 rounded-lg max-w-full h-auto" alt="Message" />
                        )}
                        {msg.media_type === 'video' && (
                          <video controls className="mb-2 rounded-lg max-w-full">
                            <source src={msg.media_url} />
                          </video>
                        )}
                        {msg.media_type === 'document' && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[rgb(var(--color-primary))] underline"
                          >
                            <FileText size={14} /> Open File
                          </a>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 text-right ${
                        msg.sender_id === user!.id ? 'text-[rgba(var(--color-text-on-primary),0.9)]' : 'text-[rgb(var(--color-text-secondary))]'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-[rgb(var(--color-surface))] px-3 py-2 rounded-xl shadow-sm border border-[rgb(var(--color-border))] rounded-tl-none">
                    <div className="flex gap-1 items-end">
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))]">
              {(file || remoteUrl) && (
                <div className="mb-3 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    {getPreview()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoteUrl('');
                    }}
                    className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full transition text-[rgb(var(--color-text))]"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {isUploading && (
                <div className="mb-3 w-full bg-[rgb(var(--color-border))] rounded-full h-2 overflow-hidden">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
                  title="Attach file"
                >
                  <Paperclip size={24} />
                </button>

                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => {
                      setRemoteUrl(e.target.value);
                      setFile(null);
                    }}
                    placeholder="Paste media URL..."
                    className="flex-1 px-3 py-2 text-sm border border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={content}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] text-base bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                />

                <button
                  type="submit"
                  disabled={isUploading || (!content.trim() && !file && !remoteUrl.trim())}
                  className={`p-2 rounded-full transition ${isUploading || (!content.trim() && !file && !remoteUrl.trim()) ? 'bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]' : 'bg-[rgba(var(--color-accent),1)] text-[rgb(var(--color-text-on-primary))] hover:bg-[rgba(var(--color-primary),1)]'}`}
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[rgb(var(--color-text-secondary))] flex-col">
            <span className="text-xl font-semibold mb-2">Welcome to Messages</span>
            <span className="text-center px-8">
              {showSidebar ? 'Select a chat on the left to start messaging.' : 'Tap the arrow to open the chat list.'}
            </span>
            <button onClick={() => setShowSidebar(true)} className="md:hidden mt-4 bg-[rgba(var(--color-accent),1)] text-[rgb(var(--color-text-on-primary))] px-4 py-2 rounded-full hover:bg-[rgba(var(--color-primary),1)] transition">
              <ArrowLeft className="mr-2 inline" /> Back to Chats
            </button>
          </div>
        )}
      </div>

      {showSidebar && !selectedUser && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" />
      )}
    </div>
  );
};
