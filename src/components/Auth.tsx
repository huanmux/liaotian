import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const PolicyModal = ({ isOpen, title, slug, onClose }) => {
  if (!isOpen) return null;
  const contentUrl = `/${slug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center p-6 border-b border-orange-200 bg-orange-50 rounded-t-3xl">
          <h2 className="text-2xl font-black text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-3 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-hidden p-0">
          {/* Using an iframe to load the content from the relative slug path */}
          <iframe
            src={contentUrl}
            title={title}
            className="w-full h-full border-0 rounded-b-3xl"
          />
        </div>
      </div>
    </div>
  );
};

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSlug, setModalSlug] = useState('');
  
  useEffect(() => {
    setError('');
  }, [email, password, username, displayName]);

    // Modal handler functions
  const openModal = (title, slug) => {
    setModalTitle(title);
    setModalSlug(slug);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalSlug('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) { setError('Username is required'); setIsLoading(false); return; }
        if (!displayName.trim()) { setError('Display name is required'); setIsLoading(false); return; }
        if (username.includes(' ')) { setError('Username cannot contain spaces'); setIsLoading(false); return; }

        await signUp(email, password, username, displayName);
        setSuccess(true);
        setTimeout(() => {
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          setUsername('');
          setDisplayName('');
          setSuccess(false);
        }, 1800);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      const message = err.message?.toLowerCase() || '';
      if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
        setError('Wrong email or password. Please try again.');
      } else if (message.includes('email not confirmed')) {
        setError('Please check your email and click the confirmation link.');
      } else if (message.includes('user already registered') || message.includes('already exists')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (message.includes('password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (message.includes('unable to validate email address')) {
        setError('Please enter a valid email address.');
      } else if (message.includes('rate limit') || message.includes('too many requests')) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else if (message.includes('network') || message.includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* ANIMATED WAVE BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 1024"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="50%" stopColor="#ffa726" />
              <stop offset="100%" stopColor="#ff8a65" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff5252" />
              <stop offset="50%" stopColor="#ff9800" />
              <stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3d00" />
              <stop offset="50%" stopColor="#ff6d00" />
              <stop offset="100%" stopColor="#ff9100" />
            </linearGradient>
          </defs>

          {/* Wave 1 */}
          <path
            fill="url(#grad1)"
            fillOpacity="0.6"
            d="M0,160 C320,300 1120,50 1440,160 L1440,1024 L0,1024 Z"
            className="animate-wave1"
          >
            <animate
              attributeName="d"
              values="
                M0,160 C320,300 1120,50 1440,160 L1440,1024 L0,1024 Z;
                M0,200 C380,50 1060,350 1440,180 L1440,1024 L0,1024 Z;
                M0,160 C320,300 1120,50 1440,160 L1440,1024 L0,1024 Z
              "
              dur="20s"
              repeatCount="indefinite"
            />
          </path>

          {/* Wave 2 */}
          <path
            fill="url(#grad2)"
            fillOpacity="0.5"
            d="M0,300 C280,100 1160,400 1440,280 L1440,1024 L0,1024 Z"
            className="animate-wave2"
          >
            <animate
              attributeName="d"
              values="
                M0,300 C280,100 1160,400 1440,280 L1440,1024 L0,1024 Z;
                M0,250 C350,450 1090,-50 1440,320 L1440,1024 L0,1024 Z;
                M0,300 C280,100 1160,400 1440,280 L1440,1024 L0,1024 Z
              "
              dur="25s"
              repeatCount="indefinite"
            />
          </path>

          {/* Wave 3 */}
          <path
            fill="url(#grad3)"
            fillOpacity="0.4"
            d="M0,450 C300,600 1140,200 1440,400 L1440,1024 L0,1024 Z"
            className="animate-wave3"
          >
            <animate
              attributeName="d"
              values="
                M0,450 C300,600 1140,200 1440,400 L1440,1024 L0,1024 Z;
                M0,500 C250,200 1190,700 1440,350 L1440,1024 L0,1024 Z;
                M0,450 C300,600 1140,200 1440,400 L1440,1024 L0,1024 Z
              "
              dur="30s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        <style jsx>{`
          @keyframes wave1 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-40px); }
          }
          @keyframes wave2 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(60px); }
          }
          @keyframes wave3 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-80px); }
          }
          .animate-wave1 { animation: wave1 20s ease-in-out infinite; }
          .animate-wave2 { animation: wave2 25s ease-in-out infinite; }
          .animate-wave3 { animation: wave3 30s ease-in-out infinite; }
        `}</style>
      </div>

      {/* AUTH CARD */}
      <div className="w-full max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/40">
          <div className="text-center mb-10">
            <img 
              src="https://mux8.com/assets/logo/liaotian-dragon.svg" 
              alt="LiaoTian logo"
              className="mx-auto w-40 h-40 mb-1"
            />
            <p className="text-gray-700 text-xl font-bold">LiaoTian</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <p class="text-xs text-gray-500 text-center -mt-3">By creating an account you agree to the <button type="button" class="text-red-600 hover:underline font-medium" onClick={() => openModal('Terms of Service', 'terms-of-service')}>Terms of Service</button> and <button type="button" class="text-red-600 hover:underline font-medium" onClick={() => openModal('Privacy Policy', 'privacy-policy')}>Privacy Policy</button></p>
                <input
                  type="text"
                  placeholder="Username (no spaces)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-white/80 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition text-gray-800 placeholder-gray-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-white/80 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition text-gray-800 placeholder-gray-500 font-medium"
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-6 py-4 bg-white/80 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition text-gray-800 placeholder-gray-500 font-medium"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-6 py-4 bg-white/80 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition text-gray-800 placeholder-gray-500 font-medium"
            />

            <div className="min-h-8">
              {error && (
                <div className="flex items-center gap-3 text-red-600 bg-red-50/90 px-5 py-4 rounded-2xl border-2 border-red-300 backdrop-blur">
                  <AlertCircle size={22} />
                  <span className="font-semibold">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 text-green-600 bg-green-50/90 px-5 py-4 rounded-2xl border-2 border-green-300 backdrop-blur">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold">Account created! Switching to Sign In...</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-70 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-100 shadow-2xl flex items-center justify-center gap-4"
            >
              {isLoading ? (
                <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <LogIn size={28} />
              )}
              {isLoading ? 'Loading...' : (isSignUp ? 'Join LiaoTian' : 'Enter LiaoTian')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess(false);
              }}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 font-bold text-lg hover:underline disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Need an account? Sign Up"}
            </button>
          </div>

          <div className="text-center text-gray-600 text-sm mt-12 font-bold">
            © Mux {new Date().getFullYear()}
          </div>
        </div>
      </div>
       <PolicyModal isOpen={isModalOpen} title={modalTitle} slug={modalSlug} onClose={closeModal} />
    </div>
  );
};
