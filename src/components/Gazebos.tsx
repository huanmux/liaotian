// src/components/Gazebos.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Profile, Gazebo, GazeboChannel, GazeboMessage, uploadMedia, MessageReaction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import {
  Hash, Volume2, Plus, Settings, Users, X, Send, Paperclip, Mic, Link as LinkIcon,
  Trash2, Edit3, Copy, Crown, Shield, ChevronDown, Menu,
  FileText, LogOut, Image as ImageIcon, Play, Pause,
  PhoneOff, UserMinus, ShieldAlert, CornerUpLeft, Video, Smile
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '💀'];

// --- Types ---
type GazebosProps = {
  initialInviteCode?: string | null;
  onInviteHandled?: () => void;
  initialGazeboId?: string | null;
};

type MemberWithProfile = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profiles: Profile;
};

type InviteLink = {
  id: string;
  invite_code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
};

type AppGazeboMessage = GazeboMessage & {
    reply_to?: {
        id: string;
        content: string;
        user_id: string;
        media_type?: string;
        sender?: { display_name: string }
    } | null;
    reactions?: MessageReaction[];
};

type VoicePeer = {
    peerId: string; // The PeerJS ID (user_id + '-voice')
    userId: string;
    stream?: MediaStream;
    call?: Peer.MediaConnection;
};

// --- AudioPlayer Helper ---
const AudioPlayer = ({ src, isOutgoing }: { src: string, isOutgoing: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
  
    const primaryColor = isOutgoing ? 'rgb(var(--color-text-on-primary))' : 'rgb(var(--color-accent))';
    const trackColor = isOutgoing ? 'rgba(var(--color-text-on-primary), 0.3)' : 'rgb(var(--color-border))';
  
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const setAudioData = () => setDuration(audio.duration);
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const togglePlay = () => setIsPlaying(!audio.paused);
      const onEnded = () => { setIsPlaying(false); audio.currentTime = 0; };
  
      audio.addEventListener('loadedmetadata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('play', togglePlay);
      audio.addEventListener('pause', togglePlay);
      audio.addEventListener('ended', onEnded);
      return () => {
        audio.removeEventListener('loadedmetadata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('play', togglePlay);
        audio.removeEventListener('pause', togglePlay);
        audio.removeEventListener('ended', onEnded);
      };
    }, []);
  
    const handlePlayPause = () => {
      if (audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play();
    };
  
    return (
      <div className="flex items-center space-x-2 w-full max-w-full mb-1">
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
        <button onClick={handlePlayPause} className="flex-shrink-0 p-2 rounded-full transition-colors" style={{ backgroundColor: isOutgoing ? 'rgba(var(--color-text-on-primary), 0.15)' : 'rgb(var(--color-surface-hover))', color: primaryColor }}>
          {isPlaying ? <Pause size={16} fill={primaryColor} /> : <Play size={16} fill={primaryColor} />}
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => { if(audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }} className="w-full h-1 appearance-none rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} ${((currentTime / duration) * 100) || 0}%, ${trackColor} 100%)` }} />
          <span className="text-[10px]" style={{ color: primaryColor }}>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
    );
};

// --- Utility: Date Formatting ---
const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

// --- Main Component ---
export const Gazebos = ({ initialInviteCode, onInviteHandled, initialGazeboId }: GazebosProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [gazebos, setGazebos] = useState<Gazebo[]>([]);
  const [activeGazebo, setActiveGazebo] = useState<Gazebo | null>(null);
  const [channels, setChannels] = useState<GazeboChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<GazeboChannel | null>(null);
  const [messages, setMessages] = useState<AppGazeboMessage[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);

  // Pagination State
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // UI State
  const [mobileView, setMobileView] = useState<'servers' | 'channels' | 'chat'>('servers');
  const [showMembersPanel, setShowMembersPanel] = useState(true);
  
  // Modal/Overlay States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showJoinCreateModal, setShowJoinCreateModal] = useState(false);
  const [showCreateGazeboModal, setShowCreateGazeboModal] = useState(false);
  const [showJoinGazeboModal, setShowJoinGazeboModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  
  // Editing & Reply & Reaction States
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<AppGazeboMessage | null>(null);
  const [showReactionMenuId, setShowReactionMenuId] = useState<string | null>(null);

  // Message Input State
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [mediaInputMode, setMediaInputMode] = useState<'file' | 'url' | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Creation & Icon State
  const [newGazeboIcon, setNewGazeboIcon] = useState<string | null>(null);

  // Voice State
  const [voiceConnected, setVoiceConnected] = useState<{channelId: string, name: string} | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, VoicePeer>>({}); // peerId -> VoicePeer
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voicePeerRef = useRef<Peer | null>(null);
  const voicePresenceRef = useRef<any>(null);

  // Derived State
  const isOwner = activeGazebo?.owner_id === user?.id;
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const memberRole = currentUserMember?.role || 'member';
  const isAdmin = isOwner || memberRole === 'admin';

  const PAGE_SIZE = 20;

  // --- Initialization ---

  useEffect(() => {
    if (!user) return;
    const fetchGazebos = async () => {
      const { data } = await supabase.from('gazebo_members').select('gazebo_id, gazebos(*)').eq('user_id', user.id);
      if (data) {
        const list = data.map(d => d.gazebos).filter(Boolean) as Gazebo[];
        setGazebos(list);
        
        // Handle Initial Routing
        if (initialInviteCode) {
           handleInviteJoin(initialInviteCode).then(g => {
               if (g) { setActiveGazebo(g); setMobileView('channels'); }
               if (onInviteHandled) onInviteHandled();
           });
        } else if (initialGazeboId) {
            const target = list.find(g => g.id === initialGazeboId);
            if (target) { setActiveGazebo(target); setMobileView('channels'); }
            else if (list.length > 0 && window.innerWidth > 768) setActiveGazebo(list[0]);
        } else if (list.length > 0 && !activeGazebo) {
            if (window.innerWidth > 768) setActiveGazebo(list[0]);
        }
      }
    };
    fetchGazebos();
  }, [user, initialInviteCode, initialGazeboId]);

  // --- Active Gazebo Data & Realtime Subs ---
  useEffect(() => {
    if (!activeGazebo) { setChannels([]); setMembers([]); setActiveChannel(null); return; }
    
    const loadData = async () => {
        const { data: cData } = await supabase.from('gazebo_channels').select('*').eq('gazebo_id', activeGazebo.id).order('created_at');
        setChannels(cData || []);
        
        // Auto-pick default channel
        if (cData && cData.length > 0) {
            // Prefer text channel, else first available
            const defaultCh = cData.find(c => c.type === 'text') || cData[0];
            // Only switch if we aren't already on a valid channel for this server
            if (!activeChannel || activeChannel.gazebo_id !== activeGazebo.id) {
               setActiveChannel(defaultCh);
            }
        }

        const { data: mData } = await supabase.from('gazebo_members').select('user_id, role, profiles(*)').eq('gazebo_id', activeGazebo.id);
        const mList: MemberWithProfile[] = (mData || []).map(m => ({
            user_id: m.user_id, 
            role: m.role as any,
            profiles: m.profiles as Profile
        }));
        setMembers(mList);
    };
    loadData();

    const channelSub = supabase.channel(`gazebo_updates:${activeGazebo.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gazebo_channels', filter: `gazebo_id=eq.${activeGazebo.id}` }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gazebo_members', filter: `gazebo_id=eq.${activeGazebo.id}` }, () => loadData())
        .subscribe();

    return () => { supabase.removeChannel(channelSub); };
  }, [activeGazebo?.id]);

  // --- Voice Channel Logic (PeerJS Mesh) ---
  useEffect(() => {
    // Cleanup function for previous voice connection
    return () => {
        if (voicePeerRef.current) {
            voicePeerRef.current.destroy();
            voicePeerRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        if (voicePresenceRef.current) {
            voicePresenceRef.current.unsubscribe();
        }
    };
  }, []); // Run once on mount/unmount generally, specific logic below

  useEffect(() => {
      if (!voiceConnected || !user) {
          // If disconnected, clean up
          if (voicePeerRef.current) {
              voicePeerRef.current.destroy();
              voicePeerRef.current = null;
          }
          if (localStream) {
              localStream.getTracks().forEach(t => t.stop());
              setLocalStream(null);
          }
          setPeers({});
          return;
      }

      const initVoice = async () => {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              setLocalStream(stream);

              // Create Peer with a scoped ID to avoid conflict with global Calls
              const myPeerId = `${user.id}-voice`;
              const peer = new Peer(myPeerId);
              voicePeerRef.current = peer;

              peer.on('open', () => {
                  // Join Presence Channel
                  const channel = supabase.channel(`voice:${voiceConnected.channelId}`);
                  voicePresenceRef.current = channel;

                  channel.on('presence', { event: 'sync' }, () => {
                      const state = channel.presenceState();
                      const presentUsers = Object.values(state).flat() as any[];
                      
                      // Find users who are NOT me
                      presentUsers.forEach((u: any) => {
                          if (u.peerId !== myPeerId && !peers[u.peerId]) {
                              // Simple mesh strategy: 
                              // Call if my ID > their ID to avoid double calling, OR call everyone and let PeerJS handle busy state?
                              // Better: Just call everyone not connected. PeerJS usually handles duplicate connection attempts or we check state.
                              // For simplicity: Sort IDs. The one with higher string ID calls the lower one.
                              if (myPeerId > u.peerId) {
                                  const call = peer.call(u.peerId, stream);
                                  handlePeerCall(call, u.peerId, u.user_id);
                              }
                          }
                      });
                  }).subscribe(async (status) => {
                      if (status === 'SUBSCRIBED') {
                          await channel.track({ user_id: user.id, peerId: myPeerId });
                      }
                  });
              });

              // Answer incoming calls
              peer.on('call', (call) => {
                  call.answer(stream);
                  // Extract user ID from peer ID (format: userid-voice)
                  const callerUserId = call.peer.replace('-voice', '');
                  handlePeerCall(call, call.peer, callerUserId);
              });

              peer.on('error', (err) => console.error('Voice Peer Error:', err));

          } catch (err) {
              console.error("Failed to join voice:", err);
              setVoiceConnected(null);
              alert("Could not access microphone.");
          }
      };

      initVoice();

  }, [voiceConnected, user]);

  const handlePeerCall = (call: Peer.MediaConnection, peerId: string, userId: string) => {
      call.on('stream', (remoteStream) => {
          setPeers(prev => ({
              ...prev,
              [peerId]: { peerId, userId, stream: remoteStream, call }
          }));
      });
      call.on('close', () => {
          setPeers(prev => {
              const newPeers = { ...prev };
              delete newPeers[peerId];
              return newPeers;
          });
      });
  };

  // --- Chat Messages & Subs ---
  useEffect(() => {
      if (!activeChannel || activeChannel.type !== 'text') { setMessages([]); return; }
      
      loadMessages(true);

      const sub = supabase.channel(`ch:${activeChannel.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gazebo_messages', filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
            const newMsg = payload.new as AppGazeboMessage;
            
            // Fetch sender details and reply details for the new message
            const { data: sender } = await supabase.from('profiles').select('*').eq('id', newMsg.user_id).single();
            
            let replyData = null;
            if (newMsg.reply_to_id) {
                const { data: rData } = await supabase
                    .from('gazebo_messages')
                    .select('id, content, user_id, media_type')
                    .eq('id', newMsg.reply_to_id)
                    .single();
                if(rData) {
                   const { data: rSender } = await supabase.from('profiles').select('display_name').eq('id', rData.user_id).single();
                   replyData = { ...rData, sender: rSender };
                }
            }

            setMessages(prev => [...prev, { ...newMsg, sender: sender as Profile, reply_to: replyData, reactions: [] }]);
            setTimeout(scrollToBottom, 100);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gazebo_messages', filter: `channel_id=eq.${activeChannel.id}` }, payload => {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, content: payload.new.content } : m));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'gazebo_messages', filter: `channel_id=eq.${activeChannel.id}` }, payload => {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        })
        // Listen for reactions
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, payload => {
            const { eventType, new: newRecord, old } = payload;
            setMessages(prev => prev.map(m => {
                const msgId = eventType === 'DELETE' ? old.message_id : newRecord.message_id;
                if (m.id !== msgId) return m;

                const currentReactions = m.reactions || [];
                if (eventType === 'INSERT') {
                     // Prevent duplicates in state if rapid fire
                     if (currentReactions.some(r => r.id === newRecord.id)) return m;
                     return { ...m, reactions: [...currentReactions, newRecord] };
                }
                if (eventType === 'DELETE') {
                     return { ...m, reactions: currentReactions.filter(r => r.id !== old.id) };
                }
                return m;
            }));
        })
        .subscribe();

      return () => { supabase.removeChannel(sub); };
  }, [activeChannel?.id]);

  const loadMessages = async (isInitial = false) => {
      if (!activeChannel) return;
      if (isInitial) { setMessages([]); setHasMore(true); }
      if (!hasMore && !isInitial) return;

      setIsLoadingMore(true);
      
      const from = isInitial ? 0 : messages.length;
      const to = from + PAGE_SIZE - 1;

      const { data, count } = await supabase
          .from('gazebo_messages')
          .select('*, sender:profiles(*), reactions:message_reactions(*)', { count: 'exact' })
          .eq('channel_id', activeChannel.id)
          .order('created_at', { ascending: false })
          .range(from, to);

      if (!data) { setIsLoadingMore(false); return; }

      const replyIds = data.map(m => m.reply_to_id).filter(Boolean);
      let repliesMap: any = {};
      if (replyIds.length > 0) {
          const { data: replies } = await supabase
            .from('gazebo_messages')
            .select('id, content, user_id, media_type')
            .in('id', replyIds);
          
          if (replies) {
             for (let r of replies) {
                 const { data: rs } = await supabase.from('profiles').select('display_name').eq('id', r.user_id).single();
                 repliesMap[r.id] = { ...r, sender: rs };
             }
          }
      }

      const formatted = data.map(m => ({
          ...m,
          reply_to: m.reply_to_id ? repliesMap[m.reply_to_id] : null,
          reactions: m.reactions || []
      })).reverse();

      if (isInitial) {
          setMessages(formatted);
          setTimeout(scrollToBottom, 50);
      } else {
          setMessages(prev => [...formatted, ...prev]);
      }

      if (data.length < PAGE_SIZE) setHasMore(false);
      setIsLoadingMore(false);
  };

  const handleScroll = () => {
      if (messagesContainerRef.current?.scrollTop === 0 && !isLoadingMore && hasMore) {
          const oldHeight = messagesContainerRef.current.scrollHeight;
          loadMessages().then(() => {
             if(messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - oldHeight;
          });
      }
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Actions ---

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'update') => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     // Use uploadMedia from supabase.ts
     const result = await uploadMedia(file, 'profiles'); // Reuse profiles or use a generic bucket if available
     if (result && result.url) {
         if (target === 'create') {
             setNewGazeboIcon(result.url);
         } else if (target === 'update' && activeGazebo) {
             updateGazebo({ icon_url: result.url });
         }
     }
  };

  const handleInviteJoin = async (code: string) => {
      if (!user || !code) return null;
      const { data: inv } = await supabase.from('gazebo_invites').select('*, gazebos(*)').eq('invite_code', code).single();
      if (!inv) { alert('Invalid invite code'); return null; }
      
      const g = inv.gazebos as Gazebo;
      const { count } = await supabase.from('gazebo_members').select('*', {count: 'exact', head: true}).eq('gazebo_id', g.id).eq('user_id', user.id);
      
      if (!count) {
          const { error } = await supabase.from('gazebo_members').insert({ gazebo_id: g.id, user_id: user.id, role: 'member' });
          if (!error) {
              await supabase.from('gazebo_invites').update({ uses_count: inv.uses_count + 1 }).eq('id', inv.id);
              setGazebos(prev => [...prev, g]);
              setActiveGazebo(g);
              setMobileView('channels');
              setShowJoinGazeboModal(false);
              setShowJoinCreateModal(false);
              return g;
          }
      } else {
          if(!gazebos.find(gz => gz.id === g.id)) setGazebos(prev => [...prev, g]);
          setActiveGazebo(g);
          setMobileView('channels');
          setShowJoinGazeboModal(false);
          setShowJoinCreateModal(false);
      }
      return g;
  };

  const createGazebo = async (name: string) => {
      if (!name.trim() || !user) return;
      const { data: g } = await supabase.from('gazebos').insert({
          name: name.trim(), type: 'group', owner_id: user.id,
          icon_url: newGazeboIcon || `https://ui-avatars.com/api/?name=${name}&background=random`
      }).select().single();
      
      if (g) {
          await supabase.from('gazebo_members').insert({ gazebo_id: g.id, user_id: user.id, role: 'owner' });
          const { data: c } = await supabase.from('gazebo_channels').insert({ gazebo_id: g.id, name: 'general', type: 'text' }).select().single();
          setGazebos(prev => [...prev, g]);
          setActiveGazebo(g);
          if (c) setActiveChannel(c);
          setShowCreateGazeboModal(false);
          setShowJoinCreateModal(false);
          setNewGazeboIcon(null);
      }
  };

  const updateGazebo = async (updates: Partial<Gazebo>) => {
      if (!activeGazebo || !isAdmin) return;
      const { data } = await supabase.from('gazebos').update(updates).eq('id', activeGazebo.id).select().single();
      if (data) {
          setActiveGazebo(data);
          setGazebos(prev => prev.map(g => g.id === data.id ? data : g));
      }
  };

  const deleteGazebo = async () => {
      if (!activeGazebo || !isOwner || !confirm('Delete this Gazebo? This cannot be undone.')) return;
      await supabase.from('gazebos').delete().eq('id', activeGazebo.id);
      setGazebos(prev => prev.filter(g => g.id !== activeGazebo.id));
      setActiveGazebo(null);
      setMobileView('servers');
  };

  const kickMember = async (targetUserId: string) => {
      if (!activeGazebo || !isAdmin || !confirm("Kick this user?")) return;
      await supabase.from('gazebo_members').delete().eq('gazebo_id', activeGazebo.id).eq('user_id', targetUserId);
  };

  const updateMemberRole = async (targetUserId: string, newRole: 'admin' | 'member') => {
      if (!activeGazebo || !isOwner) return;
      await supabase.from('gazebo_members').update({ role: newRole }).eq('gazebo_id', activeGazebo.id).eq('user_id', targetUserId);
  };

  // --- Message Actions ---

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeChannel || !user || isUploading || (!content.trim() && !file && !remoteUrl)) return;
      
      setIsUploading(true);
      let media_url = remoteUrl;
      let media_type = null;

      if (file) {
          if (file.type.startsWith('audio/')) media_type = 'audio';
          const res = await uploadMedia(file, 'gazebo-messages', setUploadProgress);
          if (!res) { setIsUploading(false); return; }
          media_url = res.url;
          media_type = media_type || res.type;
      } else if (remoteUrl) {
           if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) media_type = 'image';
           else if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) media_type = 'video';
           else if (remoteUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) media_type = 'audio';
           else media_type = 'document';
      }

      await supabase.from('gazebo_messages').insert({
          channel_id: activeChannel.id, 
          user_id: user.id, 
          content: content.trim(),
          media_url: media_url, 
          media_type: media_type || 'text',
          reply_to_id: replyingTo?.id
      });

      setContent(''); setFile(null); setRemoteUrl(''); setIsUploading(false); setMediaInputMode(null); setReplyingTo(null);
  };

  const deleteMessage = async (id: string) => {
      if(!confirm("Delete message?")) return;
      await supabase.from('gazebo_messages').delete().eq('id', id);
  };

  const updateMessage = async () => {
      if(!editingMessageId || !editMessageContent.trim()) return;
      await supabase.from('gazebo_messages').update({ content: editMessageContent }).eq('id', editingMessageId);
      setEditingMessageId(null);
      setEditMessageContent('');
  };

  const toggleReaction = async (msg: AppGazeboMessage, emoji: string) => {
      if (!user) return;
      const existing = msg.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
      if (existing) {
          await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
          await supabase.from('message_reactions').insert({
              message_id: msg.id,
              user_id: user.id,
              emoji: emoji,
              message_type: 'gazebo'
          });
      }
      setShowReactionMenuId(null);
  };

  // --- Audio Recording ---
  const startRecording = () => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];
          recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
          recorder.onstop = () => {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              setFile(new File([blob], 'voice.webm', { type: 'audio/webm' }));
              setIsRecording(false);
              stream.getTracks().forEach(t => t.stop());
          };
          recorder.start();
          setIsRecording(true);
      });
  };
  const stopRecording = () => mediaRecorderRef.current?.stop();

  // --- Helper: Manage Channels & Invites ---
  const manageChannel = async (action: 'create' | 'update' | 'delete', payload?: any) => {
      if (!activeGazebo || !isAdmin) return;
      if (action === 'create') {
          await supabase.from('gazebo_channels').insert({ gazebo_id: activeGazebo.id, name: payload.name, type: payload.type });
          setShowCreateChannelModal(false);
      }
      if (action === 'update' && editingChannelId) {
          await supabase.from('gazebo_channels').update({ name: payload }).eq('id', editingChannelId);
          setEditingChannelId(null);
      }
      if (action === 'delete' && payload) {
          if (!confirm('Delete channel?')) return;
          await supabase.from('gazebo_channels').delete().eq('id', payload);
          if (activeChannel?.id === payload) setActiveChannel(null);
      }
  };

  const manageInvite = async (action: 'create' | 'delete', codeOrId?: string) => {
      if (!activeGazebo || !isAdmin) return;
      if (action === 'create') {
          const code = codeOrId || Math.random().toString(36).substring(2, 10);
          const { data } = await supabase.from('gazebo_invites').insert({
              gazebo_id: activeGazebo.id, invite_code: code, created_by_user_id: user!.id
          }).select().single();
          if (data) setInviteLinks(prev => [data, ...prev]);
      }
      if (action === 'delete' && codeOrId) {
          await supabase.from('gazebo_invites').delete().eq('id', codeOrId);
          setInviteLinks(prev => prev.filter(i => i.id !== codeOrId));
      }
  };

  const getPreview = () => {
      if (file) {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith('image/')) return <img src={url} className="max-h-20 rounded" />;
        return <div className="flex items-center gap-2 text-sm"><FileText size={16} /> {file.name}</div>;
      }
      if (remoteUrl) {
          // Simple check for image URL extension
          if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
              return <img src={remoteUrl} className="max-h-20 rounded" />;
          }
          return <div className="flex items-center gap-2 text-sm"><LinkIcon size={16} /> {remoteUrl}</div>;
      }
      return null;
  };

  const isMobile = window.innerWidth <= 768;

  // --- RENDER START ---
  return (
    <div className="flex h-full w-full bg-[rgb(var(--color-background))] overflow-hidden text-[rgb(var(--color-text))]">
      
      {/* === 1. SERVER LIST === */}
      <div className={`flex-shrink-0 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] flex flex-col items-center py-3 space-y-2 z-30 ${isMobile && mobileView !== 'servers' ? 'hidden' : 'flex'} w-18 md:w-20`}>
         {gazebos.map(g => (
             <button key={g.id} onClick={() => { setActiveGazebo(g); setMobileView('channels'); }} className={`group relative w-12 h-12 flex items-center justify-center rounded-3xl hover:rounded-xl transition-all duration-300 overflow-hidden ${activeGazebo?.id === g.id ? 'rounded-xl bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--color-surface-hover))]'}`}>
                 {g.icon_url ? <img src={g.icon_url} className="w-full h-full object-cover" /> : <span className="font-bold text-lg">{g.name.substring(0,2).toUpperCase()}</span>}
                 {activeGazebo?.id === g.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />}
             </button>
         ))}
         <button onClick={() => setShowJoinCreateModal(true)} className="w-12 h-12 rounded-3xl bg-[rgb(var(--color-surface-hover))] text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md">
             <Plus size={24} />
         </button>
      </div>

      {/* === 2. CHANNEL SIDEBAR === */}
      <div className={`flex-shrink-0 w-60 bg-[rgb(var(--color-surface))] flex flex-col border-r border-[rgb(var(--color-border))] ${isMobile && mobileView !== 'channels' ? 'hidden' : 'flex'} ${!activeGazebo ? 'hidden' : ''}`}>
          <div className="h-12 border-b border-[rgb(var(--color-border))] flex items-center justify-between px-4 font-bold shadow-sm hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer transition relative" onClick={() => isAdmin && setShowSettingsModal(true)}>
              <span className="truncate">{activeGazebo?.name}</span>
              {isAdmin && <ChevronDown size={16} />}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isMobile && <button onClick={() => setMobileView('servers')} className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-secondary))] mb-4 px-2 py-2 hover:bg-[rgb(var(--color-surface-hover))] rounded w-full"><ChevronDown className="rotate-90" size={14}/> Back to Servers</button>}
              
              <div className="flex items-center justify-between px-2 pt-4 pb-1 text-xs font-bold text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))] group">
                  <span>TEXT CHANNELS</span>
                  {isAdmin && <button onClick={() => setShowCreateChannelModal(true)}><Plus size={14} /></button>}
              </div>
              {channels.filter(c => c.type === 'text').map(c => (
                  <div key={c.id} className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${activeChannel?.id === c.id ? 'bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))] hover:text-[rgb(var(--color-text))]'}`}>
                      <div className="flex items-center gap-2 truncate flex-1" onClick={() => { setActiveChannel(c); setMobileView('chat'); }}>
                          <Hash size={18} className="text-[rgb(var(--color-text-secondary))]" />
                          {editingChannelId === c.id ? 
                              <input autoFocus defaultValue={c.name} onKeyDown={e => { if(e.key === 'Enter') manageChannel('update', e.currentTarget.value); }} onBlur={() => setEditingChannelId(null)} className="bg-transparent outline-none w-full" /> 
                              : <span>{c.name}</span>
                          }
                      </div>
                      {isAdmin && (
                          <div className="hidden group-hover:flex gap-1">
                              <Settings size={14} onClick={() => setEditingChannelId(c.id)} />
                              <Trash2 size={14} onClick={() => manageChannel('delete', c.id)} className="text-red-500" />
                          </div>
                      )}
                  </div>
              ))}

              <div className="flex items-center justify-between px-2 pt-4 pb-1 text-xs font-bold text-[rgb(var(--color-text-secondary))] group">
                  <span>VOICE CHANNELS</span>
                  {isAdmin && <button onClick={() => setShowCreateChannelModal(true)}><Plus size={14} /></button>}
              </div>
              {channels.filter(c => c.type === 'voice').map(c => (
                   <div key={c.id} 
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${voiceConnected?.channelId === c.id ? 'bg-[rgb(var(--color-surface-hover))] text-green-500' : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}
                        onClick={() => setVoiceConnected({channelId: c.id, name: c.name})}
                   >
                       <Volume2 size={18} />
                       <span>{c.name}</span>
                       {voiceConnected?.channelId === c.id && (
                           <div className="flex -space-x-1 ml-auto">
                               <img src={user?.user_metadata.avatar_url} className="w-4 h-4 rounded-full border border-[rgb(var(--color-surface))]" />
                               {/* Visual for other peers in voice would theoretically go here if we tracked presence per channel strictly */}
                           </div>
                       )}
                   </div>
              ))}
          </div>

          {voiceConnected && (
              <div className="border-t border-[rgb(var(--color-border))] bg-[rgba(var(--color-surface-hover),0.5)] p-2">
                  <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                          <span className="text-green-500 text-xs font-bold">Voice Connected</span>
                          <span className="text-xs text-[rgb(var(--color-text-secondary))]">{voiceConnected.name} / {activeGazebo?.name}</span>
                      </div>
                      <button onClick={() => setVoiceConnected(null)} className="p-2 hover:bg-[rgb(var(--color-surface))] rounded-full text-red-500">
                          <PhoneOff size={16} />
                      </button>
                  </div>
                  {/* Invisible audio elements for peers */}
                  {Object.values(peers).map(p => (
                      p.stream && <audio key={p.peerId} ref={el => { if(el) el.srcObject = p.stream!; }} autoPlay />
                  ))}
              </div>
          )}

          <div className="p-2 bg-[rgb(var(--color-surface-hover))] flex items-center gap-2 border-t border-[rgb(var(--color-border))]">
               <img src={user?.user_metadata.avatar_url} className="w-8 h-8 rounded-full bg-gray-500 cursor-pointer" onClick={() => { if(user) setViewingProfile(members.find(m=>m.user_id===user.id)?.profiles || null)}} />
               <div className="flex-1 min-w-0">
                   <div className="text-sm font-bold truncate">{user?.user_metadata.display_name || 'User'}</div>
                   <div className="text-xs text-[rgb(var(--color-text-secondary))] truncate">#{user?.email?.split('@')[0]}</div>
               </div>
               <button className="p-1 hover:bg-[rgb(var(--color-surface))]" onClick={() => setActiveGazebo(null)}><LogOut size={16}/></button>
          </div>
      </div>

      {/* === 3. CHAT AREA === */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[rgb(var(--color-background))] ${isMobile && mobileView !== 'chat' ? 'hidden' : 'flex'}`}>
          {!activeChannel ? (
              <div className="flex-1 flex items-center justify-center text-[rgb(var(--color-text-secondary))] flex-col p-8 text-center">
                  <div className="w-16 h-16 bg-[rgb(var(--color-surface))] rounded-full flex items-center justify-center mb-4"><Hash size={32} /></div>
                  <h3 className="text-lg font-bold">No Channel Selected</h3>
                  <p>Select a text channel from the sidebar to start chatting.</p>
              </div>
          ) : (
              <>
                  <div className="h-12 border-b border-[rgb(var(--color-border))] flex items-center justify-between px-4 shadow-sm bg-[rgb(var(--color-surface))] z-10">
                      <div className="flex items-center gap-2">
                          {isMobile && <button onClick={() => setMobileView('channels')}><Menu size={24} /></button>}
                          <Hash size={24} className="text-[rgb(var(--color-text-secondary))]" />
                          <span className="font-bold">{activeChannel.name}</span>
                      </div>
                      <div className="flex gap-4 text-[rgb(var(--color-text-secondary))]">
                          <button onClick={() => setShowMembersPanel(!showMembersPanel)} className={`${showMembersPanel ? 'text-[rgb(var(--color-text))]' : ''}`}><Users size={24}/></button>
                      </div>
                  </div>

                  <div 
                     className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar" 
                     ref={messagesContainerRef}
                     onScroll={handleScroll}
                  >
                      {isLoadingMore && <div className="text-center text-xs text-[rgb(var(--color-text-secondary))] py-2">Loading more messages...</div>}
                      
                      {messages.map((msg, i) => {
                          const prevMsg = messages[i-1];
                          const isNewGroup = !prevMsg || prevMsg.user_id !== msg.user_id || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000);
                          const showDateHeader = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                          const isSelf = msg.user_id === user?.id;

                          // Group reactions
                          const groupedReactions = (msg.reactions || []).reduce((acc, r) => {
                              if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasReacted: false };
                              acc[r.emoji].count++;
                              if (r.user_id === user?.id) acc[r.emoji].hasReacted = true;
                              return acc;
                          }, {} as Record<string, { count: number, hasReacted: boolean }>);

                          return (
                              <div key={msg.id}>
                                  {showDateHeader && (
                                      <div className="flex items-center my-4 text-[rgb(var(--color-text-secondary))] text-xs font-bold">
                                          <div className="h-px bg-[rgb(var(--color-border))] flex-1" />
                                          <span className="px-2">{formatDateHeader(msg.created_at)}</span>
                                          <div className="h-px bg-[rgb(var(--color-border))] flex-1" />
                                      </div>
                                  )}
                                  
                                  <div className={`group flex gap-4 px-2 py-1 rounded hover:bg-[rgb(var(--color-surface-hover))] ${isNewGroup ? 'mt-3' : ''}`}>
                                      {isNewGroup ? (
                                          <img 
                                            src={msg.sender?.avatar_url} 
                                            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 mt-0.5" 
                                            onClick={() => setViewingProfile(msg.sender || null)}
                                          />
                                      ) : <div className="w-10 text-xs text-[rgb(var(--color-text-secondary))] opacity-0 group-hover:opacity-100 text-right select-none pt-1">{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'}).replace(/\s[AP]M/,'')}</div>}
                                      
                                      <div className="flex-1 min-w-0 relative">
                                          {isNewGroup && (
                                              <div className="flex items-center gap-2 mb-0.5">
                                                  <span className="font-bold hover:underline cursor-pointer text-[rgb(var(--color-text))]" onClick={() => setViewingProfile(msg.sender || null)}>{msg.sender?.display_name}</span>
                                                  <span className="text-xs text-[rgb(var(--color-text-secondary))]">{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
                                              </div>
                                          )}

                                          {msg.reply_to && (
                                              <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))] opacity-80 mb-1 pl-2 border-l-2 border-[rgb(var(--color-border))]">
                                                  <span className="font-bold">@{msg.reply_to.sender?.display_name || 'Unknown'}:</span>
                                                  <span className="truncate">{msg.reply_to.content || '[Media]'}</span>
                                              </div>
                                          )}
                                          
                                          {editingMessageId === msg.id ? (
                                              <div className="bg-[rgb(var(--color-background))] p-2 rounded border border-[rgb(var(--color-border))]">
                                                  <input 
                                                    value={editMessageContent} 
                                                    onChange={e => setEditMessageContent(e.target.value)}
                                                    className="w-full bg-transparent outline-none"
                                                    autoFocus
                                                    onKeyDown={e => { if(e.key === 'Enter') updateMessage(); else if(e.key === 'Escape') setEditingMessageId(null); }}
                                                  />
                                                  <div className="text-xs mt-2 text-[rgb(var(--color-text-secondary))]">Enter to save • Escape to cancel</div>
                                              </div>
                                          ) : (
                                              <div className="text-[rgb(var(--color-text))] whitespace-pre-wrap break-words opacity-90">
                                                  {msg.content}
                                              </div>
                                          )}
                                          
                                          <div className="absolute -top-4 right-0 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded shadow-sm hidden group-hover:flex z-10">
                                               <div className="relative">
                                                   <button onClick={() => setShowReactionMenuId(showReactionMenuId === msg.id ? null : msg.id)} className="p-1.5 hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]" title="Add Reaction"><Smile size={14} /></button>
                                                   {showReactionMenuId === msg.id && (
                                                       <div className="absolute top-8 right-0 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded shadow-xl p-2 flex gap-1 z-30 w-max">
                                                           {QUICK_EMOJIS.map(emoji => (
                                                               <button key={emoji} onClick={() => toggleReaction(msg, emoji)} className="hover:bg-[rgb(var(--color-surface-hover))] p-1 rounded text-lg transition">{emoji}</button>
                                                           ))}
                                                       </div>
                                                   )}
                                               </div>
                                               <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]" title="Reply"><CornerUpLeft size={14} /></button>
                                               {isSelf && (
                                                 <>
                                                   <button onClick={() => { setEditingMessageId(msg.id); setEditMessageContent(msg.content); }} className="p-1.5 hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]" title="Edit"><Edit3 size={14} /></button>
                                                   <button onClick={() => deleteMessage(msg.id)} className="p-1.5 hover:bg-[rgb(var(--color-surface-hover))] text-red-500" title="Delete"><Trash2 size={14} /></button>
                                                 </>
                                               )}
                                          </div>

                                          {msg.media_url && (
                                              <div className="mt-2">
                                                  {msg.media_type === 'image' && <img src={msg.media_url} className="max-h-80 rounded-lg border border-[rgb(var(--color-border))]" />}
                                                  {msg.media_type === 'video' && <video src={msg.media_url} controls className="max-h-80 rounded-lg border border-[rgb(var(--color-border))]" />}
                                                  {msg.media_type === 'audio' && <div className="bg-[rgb(var(--color-surface))] p-2 rounded w-64 border border-[rgb(var(--color-border))]"><AudioPlayer src={msg.media_url} isOutgoing={false} /></div>}
                                              </div>
                                          )}

                                          {/* Reactions Display */}
                                          {Object.keys(groupedReactions).length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                  {Object.entries(groupedReactions).map(([emoji, { count, hasReacted }]) => (
                                                      <button
                                                          key={emoji}
                                                          onClick={() => toggleReaction(msg, emoji)}
                                                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${hasReacted ? 'bg-[rgba(var(--color-primary),0.2)] border-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--color-surface-hover))] border-transparent hover:border-[rgb(var(--color-border))]'}`}
                                                      >
                                                          <span>{emoji}</span>
                                                          <span className={hasReacted ? 'font-bold text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-secondary))]'}>{count}</span>
                                                      </button>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 pt-0">
                      <div className="bg-[rgb(var(--color-surface-hover))] rounded-lg p-2 pr-4 shadow-inner relative">
                          
                          {/* --- PREVIEWS & PANELS (Moved from inline) --- */}
                          <div className="flex flex-col gap-2 mb-1">
                            {/* Reply Preview */}
                            {replyingTo && (
                                <div className="flex items-center justify-between bg-[rgb(var(--color-surface))] p-2 rounded border-l-4 border-[rgb(var(--color-primary))] text-sm">
                                    <div>
                                        <span className="text-[rgb(var(--color-primary))] font-bold mr-2">Replying to {replyingTo.sender?.display_name}</span>
                                        <span className="text-[rgb(var(--color-text-secondary))] truncate block">{replyingTo.content || '[Media]'}</span>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)}><X size={16}/></button>
                                </div>
                            )}

                            {/* URL Input Panel */}
                            {mediaInputMode === 'url' && !file && !remoteUrl && (
                                <div className="flex items-center gap-2 bg-[rgb(var(--color-surface))] p-2 rounded border border-[rgb(var(--color-border))]">
                                    <LinkIcon size={16} className="text-[rgb(var(--color-text-secondary))]" />
                                    <input 
                                        autoFocus 
                                        className="flex-1 bg-transparent outline-none text-sm" 
                                        placeholder="Paste media URL here..." 
                                        value={remoteUrl} 
                                        onChange={e=>setRemoteUrl(e.target.value)} 
                                    />
                                    <button onClick={()=>setMediaInputMode(null)} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded"><X size={14}/></button>
                                </div>
                            )}

                            {/* Media Preview Panel */}
                            {getPreview() && (
                                <div className="flex items-center justify-between bg-[rgb(var(--color-surface))] p-2 rounded border border-[rgb(var(--color-border))]">
                                    {getPreview()} 
                                    <button onClick={() => {setFile(null); setRemoteUrl('');}} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded"><X size={14}/></button>
                                </div>
                            )}
                          </div>

                          {/* --- MAIN INPUT ROW --- */}
                          <div className="flex items-center gap-2">
                             <button onClick={() => setShowMediaMenu(!showMediaMenu)} className="p-2 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text))] rounded-full relative">
                                 <Plus size={20} className="bg-[rgb(var(--color-text-secondary))] text-[rgb(var(--color-surface))] rounded-full p-0.5" />
                                 {showMediaMenu && (
                                     <div className="absolute bottom-10 left-0 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded shadow-lg flex flex-col p-2 w-40 z-20">
                                         <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 p-2 hover:bg-[rgb(var(--color-surface-hover))] rounded text-sm"><ImageIcon size={16}/> Upload File</button>
                                         <button onClick={() => { setMediaInputMode('url'); setShowMediaMenu(false); }} className="flex items-center gap-2 p-2 hover:bg-[rgb(var(--color-surface-hover))] rounded text-sm"><LinkIcon size={16}/> Paste URL</button>
                                     </div>
                                 )}
                             </button>
                             
                             {/* Text Input */}
                             <input 
                                className="flex-1 bg-transparent outline-none py-2 max-h-32 overflow-y-auto text-[rgb(var(--color-text))]" 
                                placeholder={`Message #${activeChannel.name}`}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                             />
                             
                             <input type="file" ref={fileInputRef} className="hidden" onChange={e => {if(e.target.files?.[0]) setFile(e.target.files[0])}} />

                             {content || file || remoteUrl ? (
                                 <button onClick={handleSend} disabled={isUploading} className="p-2 text-[rgb(var(--color-primary))]"><Send size={20}/></button>
                             ) : (
                                 <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-[rgb(var(--color-text-secondary))]'}`}><Mic size={20}/></button>
                             )}
                          </div>
                      </div>
                  </div>
              </>
          )}
      </div>

      {/* === 4. MEMBER LIST === */}
      {showMembersPanel && !isMobile && (
          <div className="w-60 bg-[rgb(var(--color-surface))] border-l border-[rgb(var(--color-border))] flex flex-col p-4 overflow-y-auto">
              {['owner', 'admin', 'member'].map(role => {
                  const roleMembers = members.filter(m => m.role === role);
                  if (roleMembers.length === 0) return null;
                  return (
                      <div key={role} className="mb-6">
                          <h3 className="text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase mb-2">{role === 'owner' ? 'Owner' : role === 'admin' ? 'Admins' : 'Members'} — {roleMembers.length}</h3>
                          {roleMembers.map(m => (
                              <div 
                                key={m.user_id} 
                                className="group flex items-center gap-2 p-2 rounded hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer opacity-90 hover:opacity-100 relative"
                              >
                                  <div className="relative" onClick={() => setViewingProfile(m.profiles)}>
                                      <img src={m.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                                  </div>
                                  <span className={`font-medium truncate flex-1`} style={{ color: role === 'owner' ? '#eab308' : role === 'admin' ? '#3b82f6' : 'inherit' }} onClick={() => setViewingProfile(m.profiles)}>{m.profiles.display_name}</span>
                                  {role === 'owner' && <Crown size={14} className="text-yellow-500" />}
                                  {role === 'admin' && <Shield size={14} className="text-blue-500" />}
                                  
                                  {isAdmin && m.user_id !== user?.id && m.role !== 'owner' && (
                                      <div className="absolute right-2 hidden group-hover:flex bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded shadow-lg z-20">
                                          <button title="Kick" onClick={() => kickMember(m.user_id)} className="p-1 hover:text-red-500"><UserMinus size={14}/></button>
                                          {isOwner && (
                                              <button title="Toggle Admin" onClick={() => updateMemberRole(m.user_id, m.role === 'admin' ? 'member' : 'admin')} className="p-1 hover:text-blue-500"><ShieldAlert size={14}/></button>
                                          )}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )
              })}
          </div>
      )}

      {/* === MODALS === */}
      
      {/* Join or Create Modal (First Step) */}
      {showJoinCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-[rgb(var(--color-surface))] p-8 rounded-xl w-full max-w-md shadow-2xl border border-[rgb(var(--color-border))] text-center">
                  <h2 className="text-2xl font-bold mb-2">Create a server</h2>
                  <p className="text-[rgb(var(--color-text-secondary))] mb-6">Your server is where you and your friends hang out. Make yours and start talking.</p>
                  
                  <button 
                    onClick={() => { setShowJoinCreateModal(false); setShowCreateGazeboModal(true); }}
                    className="w-full flex items-center justify-between p-4 mb-2 border border-[rgb(var(--color-border))] rounded-lg hover:bg-[rgb(var(--color-surface-hover))] transition text-left group"
                  >
                      <div className="flex items-center gap-3">
                          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" className="w-10 h-10 opacity-70 group-hover:opacity-100 transition" alt="Create" />
                          <span className="font-bold">Create My Own</span>
                      </div>
                      <ChevronDown className="-rotate-90 text-[rgb(var(--color-text-secondary))]" />
                  </button>

                  <div className="mt-4">
                      <h3 className="text-sm font-bold text-[rgb(var(--color-text-secondary))] mb-2">Have an invite already?</h3>
                      <button 
                         onClick={() => { setShowJoinCreateModal(false); setShowJoinGazeboModal(true); }}
                         className="w-full bg-[rgb(var(--color-surface-hover))] py-2 rounded-lg font-medium hover:bg-[rgb(var(--color-border))] transition"
                      >
                          Join a Server
                      </button>
                  </div>
                  
                  <button onClick={() => setShowJoinCreateModal(false)} className="mt-6 text-sm text-[rgb(var(--color-text-secondary))] hover:underline">Close</button>
              </div>
          </div>
      )}

      {/* Join Server Modal */}
      {showJoinGazeboModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
             <div className="bg-[rgb(var(--color-surface))] p-6 rounded-lg w-full max-w-md shadow-xl border border-[rgb(var(--color-border))]">
                 <div className="text-center mb-6">
                     <h3 className="text-2xl font-bold text-green-500 mb-2">Join a Server</h3>
                     <p className="text-[rgb(var(--color-text-secondary))] text-sm">Enter an invite code below to join an existing server.</p>
                 </div>
                 <input 
                    id="inviteInput" 
                    className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded mb-4" 
                    placeholder="Invite Code (e.g. XyZ123)" 
                 />
                 <div className="flex justify-between items-center">
                     <button onClick={() => { setShowJoinGazeboModal(false); setShowJoinCreateModal(true); }} className="text-sm hover:underline">Back</button>
                     <button 
                        onClick={() => handleInviteJoin((document.getElementById('inviteInput') as HTMLInputElement).value)} 
                        className="bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600"
                     >
                        Join Server
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* Create Gazebo */}
      {showCreateGazeboModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-lg w-96 shadow-xl border border-[rgb(var(--color-border))]">
                  <h3 className="text-xl font-bold mb-4 text-center">Customize Your Server</h3>
                  <p className="text-center text-[rgb(var(--color-text-secondary))] text-sm mb-6">Give your new server a personality with a name and an icon.</p>
                  <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-[rgb(var(--color-border))] flex items-center justify-center relative overflow-hidden group cursor-pointer">
                          {newGazeboIcon ? (
                              <img src={newGazeboIcon} className="w-full h-full object-cover" />
                          ) : (
                              <ImageIcon className="text-[rgb(var(--color-text-secondary))]" />
                          )}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleIconUpload(e, 'create')} />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-white font-bold">UPLOAD</div>
                      </div>
                  </div>
                  <input id="newGazeboName" type="text" placeholder="Server Name" className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded mb-4 text-[rgb(var(--color-text))]" />
                  <div className="flex justify-between items-center mt-6">
                      <button onClick={() => { setShowCreateGazeboModal(false); setShowJoinCreateModal(true); }} className="text-[rgb(var(--color-text-secondary))] hover:underline">Back</button>
                      <button onClick={() => createGazebo((document.getElementById('newGazeboName') as HTMLInputElement).value)} className="px-6 py-2 bg-[rgb(var(--color-primary))] text-white rounded font-bold">Create</button>
                  </div>
              </div>
          </div>
      )}

      {/* Create Channel */}
      {showCreateChannelModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-lg w-96 shadow-xl border border-[rgb(var(--color-border))]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Create Channel</h3>
                      <button onClick={() => setShowCreateChannelModal(false)}><X size={20} className="text-[rgb(var(--color-text-secondary))]"/></button>
                  </div>
                  <div className="space-y-4 mb-6">
                      <div>
                         <label className="block text-xs font-bold uppercase text-[rgb(var(--color-text-secondary))] mb-2">Channel Name</label>
                         <input id="newChannelName" placeholder="new-channel" className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold uppercase text-[rgb(var(--color-text-secondary))] mb-2">Channel Type</label>
                         <select id="newChannelType" className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded">
                             <option value="text">Text Channel</option>
                             <option value="voice">Voice Channel</option>
                         </select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowCreateChannelModal(false)} className="px-4 py-2 text-[rgb(var(--color-text-secondary))] hover:underline">Cancel</button>
                      <button 
                        onClick={() => manageChannel('create', { 
                            name: (document.getElementById('newChannelName') as HTMLInputElement).value.toLowerCase().replace(/\s/g, '-'),
                            type: (document.getElementById('newChannelType') as HTMLSelectElement).value
                        })} 
                        className="px-6 py-2 bg-[rgb(var(--color-primary))] text-white rounded"
                      >
                        Create
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Settings */}
      {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-lg w-full max-w-md shadow-xl border border-[rgb(var(--color-border))] max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between mb-6 border-b border-[rgb(var(--color-border))] pb-4">
                      <h2 className="text-2xl font-bold">Server Settings</h2>
                      <button onClick={() => setShowSettingsModal(false)}><X /></button>
                  </div>
                  
                  <div className="space-y-8">
                      <section>
                          <h3 className="font-bold mb-2 uppercase text-xs text-[rgb(var(--color-text-secondary))]">Overview</h3>
                          <div className="flex gap-4 items-center mb-4">
                              <img src={activeGazebo?.icon_url} className="w-24 h-24 rounded-full object-cover border-2 border-[rgb(var(--color-border))]" />
                              <label className="cursor-pointer text-sm bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded font-medium hover:opacity-90 transition">
                                  Change Icon
                                  <input type="file" className="hidden" onChange={(e) => handleIconUpload(e, 'update')} />
                              </label>
                          </div>
                          <input type="text" defaultValue={activeGazebo?.name} onBlur={(e) => updateGazebo({ name: e.target.value })} className="w-full p-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded" />
                      </section>

                      <section>
                          <h3 className="font-bold mb-2 uppercase text-xs text-[rgb(var(--color-text-secondary))]">Invites</h3>
                          <div className="flex gap-2 mb-2">
                              <input id="customCode" placeholder="Custom Invite Code" className="flex-1 p-2 bg-[rgb(var(--color-background))] rounded border border-[rgb(var(--color-border))]" />
                              <button onClick={() => manageInvite('create', (document.getElementById('customCode') as HTMLInputElement).value)} className="bg-[rgb(var(--color-primary))] text-white px-3 rounded">Create</button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                              {inviteLinks.map(i => (
                                  <div key={i.id} className="flex justify-between items-center bg-[rgb(var(--color-surface-hover))] p-2 rounded text-sm border border-[rgb(var(--color-border))]">
                                      <div className="flex flex-col">
                                          <span className="font-mono font-bold text-[rgb(var(--color-primary))]">{i.invite_code}</span>
                                          <span className="text-[10px] text-[rgb(var(--color-text-secondary))]">{i.uses_count} uses</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${i.invite_code}`); alert('Copied!'); }} className="p-1 hover:bg-[rgb(var(--color-background))] rounded"><Copy size={14}/></button>
                                          <button onClick={() => manageInvite('delete', i.id)} className="text-red-500 p-1 hover:bg-[rgb(var(--color-background))] rounded"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                              <button onClick={async () => { const { data } = await supabase.from('gazebo_invites').select('*').eq('gazebo_id', activeGazebo!.id); setInviteLinks(data || []); }} className="text-xs underline text-[rgb(var(--color-text-secondary))] mt-2">Load Existing Invites</button>
                          </div>
                      </section>

                      {isOwner && (
                          <section className="pt-4 border-t border-[rgb(var(--color-border))]">
                              <h3 className="font-bold mb-2 uppercase text-xs text-red-500">Danger Zone</h3>
                              <button onClick={deleteGazebo} className="flex items-center justify-between gap-2 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white w-full p-2 rounded transition">
                                  <span>Delete Server</span>
                                  <Trash2 size={18} /> 
                              </button>
                          </section>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* User Profile Popover */}
      {viewingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewingProfile(null)}>
              <div className="bg-[rgb(var(--color-surface))] w-80 rounded-xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))]" onClick={e => e.stopPropagation()}>
                  <div className="h-24 bg-[rgb(var(--color-primary))] relative">
                      {viewingProfile.banner_url && <img src={viewingProfile.banner_url} className="w-full h-full object-cover" />}
                      <img src={viewingProfile.avatar_url} className="w-20 h-20 rounded-full border-4 border-[rgb(var(--color-surface))] absolute -bottom-10 left-4 bg-[rgb(var(--color-surface))]" />
                  </div>
                  <div className="pt-12 pb-4 px-4">
                      <div className="font-bold text-xl">{viewingProfile.display_name}</div>
                      <div className="text-[rgb(var(--color-text-secondary))] text-sm mb-4">@{viewingProfile.username}</div>
                      
                      <div className="border-t border-[rgb(var(--color-border))] py-2 mb-2">
                          <h4 className="text-xs font-bold uppercase text-[rgb(var(--color-text-secondary))] mb-1">About Me</h4>
                          <p className="text-sm">{viewingProfile.bio || "No bio set."}</p>
                      </div>

                      <div className="flex gap-2 mt-4">
                          <button 
                             onClick={() => {
                                 setViewingProfile(null);
                                 navigate(`/message?user=${viewingProfile.username}`);
                             }}
                             className="flex-1 bg-[rgb(var(--color-primary))] text-white py-2 rounded font-medium text-sm"
                          >
                             Message
                          </button>
                          <button 
                             onClick={() => {
                                 setViewingProfile(null);
                                 navigate(`/?user=${viewingProfile.username}`);
                             }}
                             className="flex-1 bg-[rgb(var(--color-surface-hover))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] py-2 rounded font-medium text-sm"
                          >
                             View Profile
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
