// src/components/Messages.tsx
import { useEffect, useState, useRef } from 'react';
import { supabase, Message, Profile, uploadMedia } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, BadgeCheck, Search, ArrowLeft, X, Paperclip, FileText, Link, CornerUpLeft } from 'lucide-react';

// Define a type that includes the possible joined reply data
type AppMessage = Message & {
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
  } | null;
};

export const Messages = () => {
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<AppMessage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [mediaInputMode, setMediaInputMode] = useState<'file' | 'url' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingChannelRef = useRef<any>(null);
  const outgoingTypingChannelRef = useRef<any>(null);

  const { user } = useAuth();

  // --- ONLINE STATUS CHECKER ---
  const isUserOnline = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    // Consider online if last_seen is within the last 5 minutes (300,000 ms)
    return (now.getTime() - lastSeenDate.getTime()) < 300000;
  };
  // -----------------------------

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
        sender:profiles!sender_id(id, username, display_name, avatar_url, verified, last_seen),
        recipient:profiles!recipient_id(id, username, display_name, avatar_url, verified, last_seen)
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
        async (payload) => { // Make async
          const msg = payload.new as AppMessage;
          if (
            (msg.sender_id === user!.id && msg.recipient_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.recipient_id === user!.id)
          ) {
            
            // --- MODIFICATION START ---
            let finalMsg = msg;
            // If it's a reply and the joined data isn't present, fetch it.
            // This handles the case where the subscription payload doesn't include the join
            // (which it never does) and the render-time fallback might fail
            // if the message isn't in the local state (e.g., reply to old message).
            if (finalMsg.reply_to_id && !finalMsg.reply_to) {
              
              // We CANNOT trust `messages.find()` here due to stale closures.
              // So we just fetch. The render-time fallback will still work
              // and this fetch only adds data if it was missing.
              const { data: repliedToMsgData } = await supabase
                .from('messages')
                .select('id, content, sender_id')
                .eq('id', finalMsg.reply_to_id)
                .single();
              
              if (repliedToMsgData) {
                finalMsg.reply_to = repliedToMsgData;
              }
            }
            // --- MODIFICATION END ---

            setMessages((prev) => [...prev, finalMsg]); // Add the potentially modified message
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
        reply_to_id: replyingTo ? replyingTo.id : null,
      })
      .select()
      .single();

    if (data) {
      setContent('');
      setFile(null);
      setRemoteUrl('');
      setReplyingTo(null);
      setIsUploading(false);
      setUploadProgress(0);
      setMediaInputMode(null);
    }
  };

  const loadMessages = async (recipientId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, reply_to:messages!reply_to_id(id, content, sender_id)')
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: true });
    setMessages(data as AppMessage[] || []);
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
    <div className="flex h-screen mb-[-40] bg-[rgb(var(--color-background))] overflow-hidden">
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
              <div className="relative">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                  className="w-14 h-14 rounded-full object-cover"
                  alt=""
                />
                {isUserOnline(u.last_seen) && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]"
                  />
                )}
              </div>
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
                <div className="relative">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                    className="w-10 h-10 rounded-full object-cover"
                    alt=""
                  />
                  {isUserOnline(selectedUser.last_seen) && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-[rgb(var(--color-surface))]"
                    />
                  )}
                </div>
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
                  className={`flex items-center gap-2 group ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Show reply icon on the left for sent messages */}
                  {msg.sender_id === user!.id && (
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] opacity-0 group-hover:opacity-100 transition hover:bg-[rgb(var(--color-surface-hover))]"
                      title="Reply"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  )}

                  <div
                    className={`max-w-[90%] sm:max-w-[60%] md:max-w-[65%] px-3 py-2 rounded-xl shadow-md ${
                      msg.sender_id === user!.id
                        ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-on-primary))] rounded-br-none'
                        : 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-tl-none'
                    }`}
                  >
                    {(() => {
                      // Find the replied-to message. Use joined data first, fallback to in-memory search.
                      const repliedToMsg = msg.reply_to ? msg.reply_to : (msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null);
                      
                      if (!repliedToMsg) return null;
                      
                      const isReplyToSelf = repliedToMsg.sender_id === user!.id;
                      
                      return (
                        <div className={`p-2 rounded-lg mb-2 ${
                          msg.sender_id === user!.id
                            ? 'bg-[rgba(var(--color-surface),0.2)]' // Different color for self-reply
                            : 'bg-[rgb(var(--color-surface-hover))]' // Different color for other-reply
                        }`}>
                          <div className={`font-bold text-xs mb-0.5 ${
                            msg.sender_id === user!.id 
                              ? 'text-[rgba(var(--color-text-on-primary),0.9)]' 
                              : 'text-[rgb(var(--color-accent))]'
                          }`}>
                            {isReplyToSelf ? 'You' : selectedUser?.display_name}
                          </div>
                          <p className="text-xs opacity-90 truncate whitespace-pre-wrap break-words">
                            {repliedToMsg.content}
                          </p>
                        </div>
                      );
                    })()}

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
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Show reply icon on the right for received messages */}
                  {msg.sender_id !== user!.id && (
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] opacity-0 group-hover:opacity-100 transition hover:bg-[rgb(var(--color-surface-hover))]"
                      title="Reply"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  )}
                </div>
              ))}

              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-[rgb(var(--color-surface))] px-3 py-2 rounded-xl shadow-sm border border-[rgb(var(--color-border))] rounded-tl-none">
                    <div className="flex gap-1 items-end">
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                      <span className="w-2 h-2 bg-[rgb(var(--color-text-secondary))] rounded-full animate-pulse" style={{ animationDelay: '4ds00ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[rgb(var(--color-surface))]">
              {replyingTo && (
                <div className="p-3 bg-[rgb(var(--color-surface-hover))] flex items-center justify-between mx-3 mt-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[rgb(var(--color-text-secondary))] flex items-center gap-1">
                      <CornerUpLeft size={14} />
                      Replying to {replyingTo.sender_id === user!.id ? 'yourself' : selectedUser?.display_name}
                    </div>
                    <p className="text-sm text-[rgb(var(--color-text))] truncate mt-0.5">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-[rgb(var(--color-surface))] rounded-full transition text-[rgb(var(--color-text))]"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {(file || remoteUrl) && (
                <div className="mb-3 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg flex items-center justify-between mx-3 mt-3">
                  <div className="flex-1 pr-2">
                    {getPreview()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoteUrl('');
                      setMediaInputMode(null);
                    }}
                    className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full transition text-[rgb(var(--color-text))]"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              {mediaInputMode === 'url' && !file && !remoteUrl && (
                  <div className="p-3">
                      <div className="flex items-center gap-2">
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
                          <button
                              type="button"
                              onClick={() => {
                                setRemoteUrl('');
                                setMediaInputMode(null);
                              }}
                              className="p-1 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
                              title="Cancel URL input"
                          >
                              <X size={20} />
                          </button>
                      </div>
                  </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] relative">
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

              {/* Media Selection Pop-up */}
              {showMediaMenu && (
                  <div className="absolute bottom-full left-3 mb-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg shadow-xl overflow-hidden z-30">
                      <button
                          type="button"
                          className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2"
                          onClick={() => {
                              setShowMediaMenu(false);
                              fileInputRef.current?.click();
                              setRemoteUrl('');
                              setMediaInputMode('file');
                          }}
                      >
                          <Paperclip size={18} /> Upload file
                      </button>
                      <button
                          type="button"
                          className="w-full text-left p-3 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-hover))] transition flex items-center gap-2"
                          onClick={() => {
                              setShowMediaMenu(false);
                              setFile(null);
                              setRemoteUrl('');
                              setMediaInputMode('url');
                          }}
                      >
                          <Link size={18} /> Fetch from URL
                      </button>
                  </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediaMenu(!showMediaMenu);
                  }}
                  className="p-2 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] transition"
                  title="Attach file or link"
                >
                  <Paperclip size={24} />
                </button>

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
