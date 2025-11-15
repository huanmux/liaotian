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
import { Home, MessageSquare, User, LogOut, Search as SearchIcon } from 'lucide-react';
import { supabase } from './lib/supabase';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Stats } from './components/Stats';

type ViewType = 'feed' | 'messages' | 'profile' | 'settings' | 'page' | 'stats'; 

const Main = () => {
  const [view, setView] = useState<ViewType>('feed');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Set theme from profile
  useEffect(() => {
    if (profile?.theme) {
      document.body.className = `theme-${profile.theme}`;
    }
  }, [profile?.theme]);

  // === URL PROFILE LOOKUP (via ?username) ===
  useEffect(() => {
    const checkUrlForProfile = async () => {
      const search = window.location.search;
      const username = search.startsWith('?') ? search.slice(1) : search;
      
      // Path check to allow /?username and /user?username
      const path = window.location.pathname;
      if (path !== '/' && path !== '/user') {
          return; // Let page routing handle other paths
      }

      if (!username || username.includes('/')) {
        // If no username or invalid format, just return.
        // The other useEffect will handle setting view to 'feed'.
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (data) {
          setSelectedProfileId(data.id);
          setView('profile');
        }
      } catch (err) {
        // Ignore — not a profile
      }
    };

    checkUrlForProfile();
    window.addEventListener('popstate', checkUrlForProfile);
    return () => window.removeEventListener('popstate', checkUrlForProfile);
  }, []); // Note: This still only runs once, but the logic inside now checks the path.

  // === CUSTOM PAGE ROUTING (via /slug) ===
  useEffect(() => {
    const path = location.pathname;
    const search = location.search;
    
    // Check for profile paths (/ and /user)
    if (path === '/' || path === '/user') {
        const username = search.startsWith('?') ? search.slice(1) : search;
        // If a username is present, the Profile lookup useEffect will handle it.
        // We just need to ensure we don't clobber it by setting view to 'feed'.
        if (username && !username.includes('/')) {
            // Profile lookup is running or will run. Don't set view('feed').
            return;
        }
        
        // If no username, set view to feed.
        setView('feed');
        setPageSlug('');
        setSelectedProfileId(undefined); // Ensure no profile is selected
        return;
    }
    
    // Handle /message?username
    if (path === '/message') {
        const username = search.startsWith('?') ? search.slice(1) : search;
        if (username && !username.includes('/')) {
            const lookupAndMessage = async () => {
                try {
                    // Check if user is logged in
                    if (!user) {
                         // Optional: redirect to login or show auth
                         // For now, just go to feed.
                         setView('feed');
                         return;
                    }
                    const { data } = await supabase
                        .from('profiles')
                        .select('*') // Need full profile object
                        .eq('username', username.toLowerCase())
                        .single();
                    
                    if (data) {
                        setView('messages');
                        setSelectedProfileId(undefined);
                        // This event is heard by Messages.tsx
                        // Wrap in timeout to ensure listener is attached
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('openDirectMessage', { detail: data }));
                        }, 0);
                    } else {
                        // No user found, default to feed
                        setView('feed');
                    }
                } catch (err) {
                    setView('feed');
                }
            };
            lookupAndMessage();
            return; // Stop processing
        }
        
        // If no username, and user is logged in, go to messages main
        if (user) {
            setView('messages');
            setSelectedProfileId(undefined);
            return;
        }
        
        // If no username and not logged in, go to feed (which will show Auth)
        setView('feed');
        return;
    }

    // Handle the unlisted /stats slug
    if (path === '/stats') {
      setView('stats');
      setPageSlug('');
      setSelectedProfileId(undefined);
      return;
    }

    // Handle generic custom pages (like /about)
    const match = path.match(/^\/([a-zA-Z0-9-]+)$/);
    if (match) {
      const slug = match[1];
      // Do not treat 'user' as a custom page
      if (slug === 'user') {
          setView('feed'); // Or some error/redirect
          setPageSlug('');
          setSelectedProfileId(undefined);
          return;
      }
      setView('page');
      setPageSlug(slug);
      setSelectedProfileId(undefined);
      return;
    }

    // Fallback to feed for unmatched paths
    setView('feed');
    setPageSlug('');
    setSelectedProfileId(undefined);
  }, [location.pathname, location.search, user]); // Added location.search and user

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
            navigate(`/?${data.username}`);
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

    // Run immediately and then every 30 seconds
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[rgb(var(--color-background))] flex items-center justify-center text-2xl font-bold text-[rgb(var(--color-text))]"
        style={{
          background: `linear-gradient(to bottom right, rgba(var(--color-surface),0.05), rgba(var(--color-primary),0.05))`,
        }}
      >
        Loading...
      </div>
    );
  }

  // === RENDER CUSTOM PAGE / STATS PAGE ===
  if (view === 'page' && pageSlug) {
    return <CustomPage slug={pageSlug} />;
  }
  
  // STATS page
  if (view === 'stats') {
      return <Stats />;
  }


  // === NOT LOGGED IN? SHOW AUTH OR PUBLIC PROFILE ===
  if (!user || !profile) {
    if (view === 'profile' && selectedProfileId) {
      return (
        <div className="min-h-screen bg-[rgb(var(--color-background))]">
          <div className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
              <h1 className="text-xl font-black bg-gradient-to-r from-[rgba(var(--color-primary),1)] via-[rgba(var(--color-accent),1)] to-[rgba(var(--color-primary),1)] bg-clip-text text-transparent">
                LiaoTian
              </h1>
              <a href="/" className="text-[rgb(var(--color-primary))] hover:text-[rgba(var(--color-primary),0.8)] font-bold">
                ← Back to Home
              </a>
            </div>
          </div>
          <Profile userId={selectedProfileId} />
        </div>
      );
    }
    // If trying to message while not logged in, show Auth
    if (view === 'messages') {
        return <Auth />;
    }
    return <Auth />;
  }

  const handleMessageUser = (profile: any) => {
    setView('messages');
    setSelectedProfileId(undefined);
    // Wrap in timeout to ensure listener is attached after view switch
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openDirectMessage', { detail: profile }));
    }, 0);
  };

  const handleSettings = () => {
    setView('settings');
    setSelectedProfileId(undefined);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <nav className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-black bg-gradient-to-r from-[rgba(var(--color-primary),1)] via-[rgba(var(--color-accent),1)] to-[rgba(var(--color-primary),1)] bg-clip-text text-transparent">
            LiaoTian
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-3 rounded-full hover:bg-[rgb(var(--color-surface-hover))] transition"
            >
              <SearchIcon size={24} className="text-[rgb(var(--color-text-secondary))]" />
            </button>
            <button
              onClick={() => {
                setView('feed');
                setSelectedProfileId(undefined);
                navigate('/');
              }}
              className={`p-3 rounded-full transition ${
                view === 'feed' ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : 'hover:bg-[rgb(var(--color-surface-hover))]'
              }`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => {
                setView('messages');
                setSelectedProfileId(undefined);
                navigate('/message'); // Navigate to /message base
              }}
              className={`p-3 rounded-full transition ${
                view === 'messages' ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : 'hover:bg-[rgb(var(--color-surface-hover))]'
              }`}
            >
              <MessageSquare size={24} />
            </button>
            <button
              onClick={() => {
                if (!profile?.username) return;
                navigate(`/?${profile.username}`);
                setSelectedProfileId(undefined);
                setView('profile');
              }}
              className={`p-3 rounded-full transition ${
                view === 'profile' && !selectedProfileId
                  ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]'
                  : 'hover:bg-[rgb(var(--color-surface-hover))]'
              }`}
            >
              <User size={24} />
            </button>
            <button
              onClick={signOut}
              className="p-3 rounded-full hover:bg-[rgba(239,68,68,0.1)] text-red-600 transition"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </nav>

      <main className="h-[90vh] overflow-auto">
        {view === 'feed' && <Feed />}
        {view === 'messages' && <Messages />}
        {view === 'profile' && (
          <Profile
            userId={selectedProfileId}
            onMessage={handleMessageUser}
            onSettings={
              !selectedProfileId || selectedProfileId === user.id ? handleSettings : undefined
            }
          />
        )}
        {view === 'settings' && <Settings />}
        {showSearch && <Search onClose={() => setShowSearch(false)} />}
        {view === 'stats' && user && <Stats />}
      </main>
      {view !== 'messages' && (
        <footer className="text-center text-[rgb(var(--color-text-secondary))] text-xs py-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
          © Mux {new Date().getFullYear()}
        </footer>
       )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Main />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
