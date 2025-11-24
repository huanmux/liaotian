// src/App.tsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { Messages } from './components/Messages';
import { Profile } from './components/Profile';
import { Search } from './components/Search';
import { Settings } from './components/Settings';
import { CustomPage } from './components/CustomPage';
import { Stats } from './components/Stats';
import { Status, StatusArchive } from './components/Status';
import { Sidebar } from './components/Sidebar';
import { Notifications } from './components/Notifications'; 
import { Groups } from './components/Groups';
import { Forums } from './components/Forums';
import { Home, MessageSquare, User, LogOut, Search as SearchIcon, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

type ViewType = 'feed' | 'messages' | 'profile' | 'settings' | 'page' | 'stats' | 'archive' | 'groups' | 'forums';

const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

// --- SPECIAL EVENT CONFIG ---
export const SPECIAL_EVENT_MODE = false;
export const EVENT_MESSAGE = "⚡ SPECIAL EVENT (test): WELCOME TO THE LIAOVERSE! ENJOY THE VIBES! ⚡";
const EVENT_THEMES = ["https://mux8.com/assets/audio/theme01.mp3", "https://mux8.com/assets/audio/theme02.mp3"];

const Main = () => {
  const [view, setView] = useState<ViewType>('feed');
  const [showSidebar, setShowSidebar] = useState(false);
  const [pageSlug, setPageSlug] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | undefined>(); 
  
  const [pendingGazeboInvite, setPendingGazeboInvite] = useState<string | null>(null);
  const [pendingGazeboId, setPendingGazeboId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'chats' | 'gazebos'>('chats');
  
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

// === Special Event Audio ===
  useEffect(() => {
    if (SPECIAL_EVENT_MODE) {
      const randomTrack = EVENT_THEMES[Math.floor(Math.random() * EVENT_THEMES.length)];
      const audio = new Audio(randomTrack);
      audio.volume = 0.3; // Polite volume
      // Browser policy requires interaction usually, this attempts to play on load
      audio.play().catch(e => console.log("Audio autoplay blocked until interaction"));
    }
  }, []);

  // === Notification State ===
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // === COMPREHENSIVE URL ROUTING ===
  useEffect(() => {
    const handleRouting = async () => {
      const path = location.pathname;
      const search = new URLSearchParams(location.search);
      
      // 1. Priority: Invite Codes (Takes over everything if present)
      const pathInviteMatch = path.match(/^\/invite\/([a-zA-Z0-9-]{3,20})$/);
      const queryInvite = search.get('invite');
      const inviteCode = pathInviteMatch ? pathInviteMatch[1] : queryInvite;

      if (inviteCode && user) {
        setPendingGazeboInvite(inviteCode);
        setView('messages');
        setInitialTab('gazebos');
        if (pathInviteMatch) navigate('/message', { replace: true }); 
        return;
      }

      // 2. Priority: Gazebos (Direct link to server)
      const pathGazeboMatch = path.match(/^\/gazebo\/?([a-zA-Z0-9-]{0,})?$/);
      const queryGazeboId = search.get('gazebo');
      const gazeboId = pathGazeboMatch ? pathGazeboMatch[1] : queryGazeboId;

      if ((gazeboId || pathGazeboMatch) && user) {
        setInitialTab('gazebos');
        if (gazeboId) setPendingGazeboId(gazeboId);
        setView('messages');
        if (pathGazeboMatch) window.history.replaceState({}, '', '/message');
        return;
      }

      // 3. Priority: Message User (Direct Message)
      const msgUser = search.get('user');
      if (path === '/message' && msgUser && user) {
          // We just handle the view here, the Messages component reads the URL param/event
          // But to ensure we load the conversation, we can trigger the internal navigation event if needed
          // or let the Messages component handle it via the URL param directly. 
          // Current Messages.tsx uses window event, let's bridge it if needed or rely on search param.
          // Note: The provided Messages.tsx doesn't read ?user= natively yet, it relies on 'openDirectMessage' event.
          // We will need to make sure we handle this in Messages or dispatch the event here.
          // For now, we will set the view. Messages.tsx should ideally read the param.
          
          // Dispatching event after a short delay to ensure Messages component is mounted
          const { data } = await supabase.from('profiles').select('*').eq('username', msgUser).single();
          if (data) {
             setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('openDirectMessage', { detail: data }));
             }, 500);
          }
          setView('messages');
          return;
      }

      // 4. Priority: Status Deep Links
      const statusId = search.get('status');
      if (statusId && user) {
        const { data: statusData } = await supabase
          .from('statuses')
          .select('*, profiles!user_id(*)')
          .eq('id', statusId)
          .single();
        
        if (statusData) {
          const profileWithStatus = {
             ...statusData.profiles,
             statuses: [statusData],
             hasUnseen: false
          };
          window.dispatchEvent(new CustomEvent('openStatusViewer', {
             detail: {
               users: [profileWithStatus],
               initialUserId: statusData.user_id
             }
          }));
          setView('feed'); 
        }
        return;
      }

      // 5. Priority: Post Deep Links
      const postId = search.get('post');
      if (postId) {
         const { data: postData } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .maybeSingle(); 
         
         if (postData) {
             setSelectedProfileId(postData.user_id);
             setSelectedPostId(postId);
             setView('profile');
             return;
         }
      }

      // 6. Priority: User Profile (via root /?user=)
      // Only if we are at root AND have user param, OR path matches standard profile route if one existed
      const usernameQuery = search.get('user');
      if (path === '/' && usernameQuery) {
         const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', usernameQuery.toLowerCase())
            .single();
         if (data) {
            setSelectedProfileId(data.id);
            setView('profile');
            return;
         }
      }
      
      // 7. Priority: Standard Routes
      if (path === '/message') {
        setView('messages');
        return;
      }
      if (path === '/stats') {
        setView('stats');
        return;
      }
      
      // 8. Priority: Custom Page Slugs
      const slugMatch = path.match(/^\/([a-zA-Z0-9-]+)$/);
      if (slugMatch) {
         const slug = slugMatch[1];
         // Ignore reserved words just in case
         if (!['user', 'invite', 'gazebo', 'message', 'stats'].includes(slug)) {
             setView('page');
             setPageSlug(slug);
             return;
         }
      }

      // Default
      if (path === '/') {
          setView('feed');
          setSelectedProfileId(undefined);
          setSelectedPostId(undefined);
      }

    };
    
    handleRouting();

  }, [location.pathname, location.search, user, navigate]);


  // Set theme from profile
  useEffect(() => {
    if (profile?.theme) {
      document.body.className = `theme-${profile.theme}`;
    }
  }, [profile?.theme]);

  // === Notification Fetching and Realtime ===
  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      setUnreadMessages(msgCount || 0);

      try {
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        setUnreadNotifications(notifCount || 0);
      } catch (error) {
        console.warn("Could not fetch notifications.");
      }
    };

    fetchCounts();

    // NEW: Listen for the custom event dispatched from Messages.tsx
    const handleMessagesRead = () => {
        fetchCounts();
    };
    window.addEventListener('messagesRead', handleMessagesRead);

    const channel = supabase.channel(`user-notifications:${user.id}`);
    
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${user.id}`
    }, (payload) => {
      if (payload.new.read === false) {
        setUnreadMessages(c => c + 1);
      }
    });

    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${user.id}`
    }, (payload) => {
      // OPTIMIZED: If we can detect a read status change locally, update state immediately
      // Note: payload.old usually only has ID unless Replica Identity is set to Full.
      // So we still fallback to fetchCounts for accuracy, but the window event listener above
      // handles the immediate user interaction case.
      fetchCounts();
    });

    // ... (keep the notifications channel listeners below exactly as they were) ...
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${user.id}`
    }, () => {
      setUnreadNotifications(n => n + 1);
    });

    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${user.id}`
    }, (payload) => {
      if (payload.old.is_read === false && payload.new.is_read === true) {
        setUnreadNotifications(n => Math.max(0, n - 1));
      }
    });
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('messagesRead', handleMessagesRead); // Clean up new listener
    };

  }, [user]);

  // Keep internal navigation working
  useEffect(() => {
    const handler = (e: any) => {
      const profileId = e.detail;
      supabase
        .from('profiles')
        .select('username')
        .eq('id', profileId)
        .single()
        .then(({ data }) => {
          if (data) {
            navigate(`/?user=${data.username}`);
            setSelectedProfileId(profileId);
            setView('profile');
          }
        });
    };
    window.addEventListener('navigateToProfile', handler);
    return () => window.removeEventListener('navigateToProfile', handler);
  }, [navigate]);

  // === ONLINE STATUS UPDATE ===
  useEffect(() => {
    if (!user) return;
    const updateLastSeen = async () => {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    };
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
        <div
            className="min-h-screen bg-[rgb(var(--color-background))] flex flex-col items-center justify-center text-2xl font-bold text-[rgb(var(--color-text))]"
            style={{
                background: `linear-gradient(to bottom right, rgba(var(--color-surface),0.05), rgba(var(--color-primary),0.05))`,
            }}
        >
            <div className="logo-loading-container w-[150px] h-auto relative mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox={SVG_VIEWBOX} className="logo-svg">
                    <defs>
                        <clipPath id="logo-clip"><rect id="clip-rect" x="0" y="0" width="100%" height="100%" /></clipPath>
                    </defs>
                    <path d={SVG_PATH} fill="none" stroke="rgb(var(--color-primary))" strokeWidth="10" strokeOpacity="0.1" />
                    <path d={SVG_PATH} fill="rgb(var(--color-primary))" clipPath="url(#logo-clip)" className="logo-fill-animated" />
                </svg>
            </div>
            Loading...
        </div>
    );
  }

  if (view === 'page' && pageSlug) return <CustomPage slug={pageSlug} />;
  if (view === 'stats') return <Stats />;

  if (!user || !profile) {
    if (view === 'profile' && selectedProfileId) {
      return (
	     <div className="min-h-screen bg-[rgb(var(--color-background))]">
          <div className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox={SVG_VIEWBOX} className="w-[32px] h-[32px] cursor-pointer" onClick={() => navigate('/')}>
                <path d={SVG_PATH} fill="rgb(var(--color-primary))" />
              </svg>
              <a href="/" className="text-[rgb(var(--color-primary))] hover:text-[rgba(var(--color-primary),0.8)] font-bold">← Back to Home</a>
            </div>
          </div>
          <Profile userId={selectedProfileId} initialPostId={selectedPostId} />
        </div>
      );
    }
    if (view === 'messages') return <Auth />;
    return <Auth />;
  }

const handleMessageUser = (targetProfile: any) => {
    setView('messages');
    setSelectedProfileId(undefined);
    // Update URL first
    navigate(`/message?user=${targetProfile.username}`);
    // Dispatch event so Messages component picks it up immediately without refresh
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openDirectMessage', { detail: targetProfile }));
    }, 100);
  };

  const handleSettings = () => {
    setView('settings');
    setSelectedProfileId(undefined);
  };
  
  const handleNotificationsClick = async () => {
    setShowNotifications(true); 
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      setUnreadNotifications(0);
    } catch (error) { console.warn("Could not mark notifications as read."); }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      {/* 4a. RENDER SIDEBAR */}
      <Sidebar 
        show={showSidebar} 
        onClose={() => setShowSidebar(false)} 
        setView={setView} 
        view={view} 
      />

      <nav className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          {/* 4b. UPDATE LOGO ONCLICK */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox={SVG_VIEWBOX} 
            className="w-[32px] h-[32px] cursor-pointer" 
            onClick={() => setShowSidebar(true)} 
          >
            <path d={SVG_PATH} fill="rgb(var(--color-primary))" />
          </svg>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSearch(true)} className="p-3 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition">
              <SearchIcon size={20} className="text-[rgb(var(--color-text-secondary))]" />
            </button>
            <button onClick={() => { setView('feed'); setSelectedProfileId(undefined); setSelectedPostId(undefined); navigate('/'); }} className={`p-3 rounded-full transition ${view === 'feed' ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : 'hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]'}`}>
              <Home size={20} />
            </button>
            <button onClick={() => { setView('messages'); setSelectedProfileId(undefined); setSelectedPostId(undefined); navigate('/message'); }} className={`relative p-3 rounded-full transition ${view === 'messages' ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : 'hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]'}`}>
              <MessageSquare size={20} />
              {unreadMessages > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
			      <button onClick={handleNotificationsClick} className="relative p-3 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition">
              <Bell size={20} className="text-[rgb(var(--color-text-secondary))]" />
              {unreadNotifications > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
            <button onClick={() => { if (!profile?.username) return; navigate(`/?user=${profile.username}`); setSelectedProfileId(undefined); setView('profile'); }} className={`p-3 rounded-full transition ${view === 'profile' && !selectedProfileId ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : 'hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-secondary))]'}`}>
              <User size={20} />
            </button>
            <button onClick={signOut} className="p-3 rounded-full hover:bg-[rgba(239,68,68,0.1)] text-red-600 transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="h-[90vh] overflow-auto">
        {view === 'feed' && <Feed />}
        {view === 'messages' && (
		    <Messages 
		        initialInviteCode={pendingGazeboInvite} 
		        onInviteHandled={() => setPendingGazeboInvite(null)} 
		        initialTab={initialTab}
		        initialGazeboId={pendingGazeboId}
		    />
		)}
        {view === 'profile' && (
          <Profile 
            key={selectedProfileId || 'own-profile'} // Force remount if profile changes
            userId={selectedProfileId} 
            initialPostId={selectedPostId} // This triggers the modal in Profile.tsx
            onMessage={handleMessageUser} 
            onSettings={!selectedProfileId || selectedProfileId === user.id ? handleSettings : undefined} 
          />
        )}
        {view === 'settings' && <Settings />}
        {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
        {showSearch && <Search onClose={() => setShowSearch(false)} />}
        {view === 'stats' && user && <Stats />}
		  {view === 'groups' && <Groups setView={setView} />}
		  {view === 'forums' && <Forums />}
		  {view === 'archive' && <StatusArchive />}
      </main>
      {view !== 'messages' && (
        <footer className="text-center text-[rgb(var(--color-text-secondary))] text-xs py-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
          © Mux {new Date().getFullYear()}
        </footer>
       )}

	{/* SPECIAL EVENT MARQUEE */}
       {SPECIAL_EVENT_MODE && (
         <div className="fixed bottom-0 left-0 w-full bg-black text-white z-[100] h-8 flex items-center overflow-hidden border-t border-[rgb(var(--color-accent))]">
           <div className="whitespace-nowrap animate-marquee font-bold uppercase tracking-widest text-sm">
             {EVENT_MESSAGE} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; {EVENT_MESSAGE} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; {EVENT_MESSAGE}
           </div>
         </div>
       )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Main />
		    <Status />
        <Analytics/>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
