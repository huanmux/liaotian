import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { Messages } from './components/Messages';
import { Profile } from './components/Profile';
import { Home, MessageSquare, User, LogOut } from 'lucide-react';
import { Profile as ProfileType } from './lib/supabase';

const Main = () => {
  const [view, setView] = useState<'feed' | 'messages' | 'profile'>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || !profile) return <Auth />;

  const handleMessageUser = (userProfile: ProfileType) => {
    setView('messages');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold">聊天</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setView('feed'); setSelectedProfileId(undefined); }}
              className={`p-3 rounded-full ${view === 'feed' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <Home size={22} className={view === 'feed' ? 'text-blue-500' : ''} />
            </button>
            <button
              onClick={() => { setView('messages'); setSelectedProfileId(undefined); }}
              className={`p-3 rounded-full ${view === 'messages' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <MessageSquare size={22} className={view === 'messages' ? 'text-blue-500' : ''} />
            </button>
            <button
              onClick={() => { setView('profile'); setSelectedProfileId(undefined); }}
              className={`p-3 rounded-full ${view === 'profile' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <User size={22} className={view === 'profile' ? 'text-blue-500' : ''} />
            </button>
            <button onClick={signOut} className="p-3 rounded-full hover:bg-gray-100 text-red-500">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>
      <main>
        {view === 'feed' && <Feed />}
        {view === 'messages' && <Messages />}
        {view === 'profile' && <Profile userId={selectedProfileId} onMessage={handleMessageUser} />}
      </main>
      <footer className="text-center text-gray-400 text-xs py-4 border-t border-gray-200 bg-white">
        © Mux 2025
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}

export default App;
