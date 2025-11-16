// src/components/Status.tsx
import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { supabase, uploadStatusMedia, Profile, Status as StatusType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  Plus, 
  Camera, 
  Video, 
  ImageIcon, 
  Type,
  BadgeCheck,
  ChevronLeft, 
  ChevronRight, 
  Archive, 
  Home,
  Send,
  Pause,
  Play,
  RefreshCcw, // For flipping camera
  Eye,       // For view count
  Check,     // For "Sent"
  Radio,     // For recording button
} from 'lucide-react';
import { ProfileWithStatus } from '../lib/types'; // <-- Assume you create a types.ts file for this

const FOLLOW_ONLY_FEED = import.meta.env.VITE_FOLLOW_ONLY_FEED === 'true';

// =======================================================================
//  1. STATUS TRAY
//  Updated with "Unseen" logic.
// =======================================================================

export const StatusTray: React.FC = () => {
  const { user, profile } = useAuth();
  const [statusUsers, setStatusUsers] = useState<ProfileWithStatus[]>([]);
  const [ownStatus, setOwnStatus] = useState<ProfileWithStatus | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchActiveStatuses = async () => {
      try {
        let statusQuery = supabase
          .from('statuses')
          .select('*, profiles!user_id(*)')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true });

        if (FOLLOW_ONLY_FEED) {
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
          
          const followingIds = follows?.map(f => f.following_id) || [];
          statusQuery = statusQuery.in('user_id', [user.id, ...followingIds]);
        }

        const { data: statuses } = await statusQuery;
        if (!statuses) return;

        const usersMap = new Map<string, ProfileWithStatus>();

        for (const status of statuses) {
          if (!status.profiles) continue; 

          const userId = status.user_id;
          const statusWithViewers = {
              ...status,
              viewed_by: status.viewed_by || [] // Ensure viewed_by is an array
          };

          if (!usersMap.has(userId)) {
            usersMap.set(userId, {
              ...status.profiles,
              statuses: [statusWithViewers],
              hasUnseen: !statusWithViewers.viewed_by.includes(user.id) // NEW: Check unseen
            });
          } else {
            const userData = usersMap.get(userId)!;
            userData.statuses.push(statusWithViewers);
            // If any status is unseen, the whole user is unseen
            if (!statusWithViewers.viewed_by.includes(user.id)) {
                userData.hasUnseen = true;
            }
          }
        }
        
        const self = usersMap.get(user.id) || { ...profile, statuses: [], hasUnseen: false };
        if (self.statuses.length > 0) {
            // FIX: Your own 'hasUnseen' was bugged. This is now just for calculation.
            self.hasUnseen = self.statuses.some(s => !s.viewed_by.includes(user.id));
        }
        
        usersMap.delete(user.id);
        
        const others = Array.from(usersMap.values()).sort((a, b) => {
            // Sort by unseen first, then by time
            if (a.hasUnseen !== b.hasUnseen) {
                return a.hasUnseen ? -1 : 1; // Unseen users come first
            }
            const aLast = new Date(a.statuses[a.statuses.length - 1].created_at).getTime();
            const bLast = new Date(b.statuses[b.statuses.length - 1].created_at).getTime();
            return bLast - aLast; // Then sort by most recent
        });

        setOwnStatus(self);
        setStatusUsers(others);

      } catch (error) {
        console.error('Error fetching statuses:', error);
      }
    };

    fetchActiveStatuses();
    const sub = supabase.channel('status-tray-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'statuses' }, fetchActiveStatuses)
      .subscribe();
    
    const interval = setInterval(fetchActiveStatuses, 60000); // Refresh every 60s
    return () => {
      clearInterval(interval);
      supabase.removeChannel(sub);
    };
  }, [user, profile]);

  const openViewer = (initialUserId: string) => {
    if (!ownStatus) return;
    
    const fullQueue = [ownStatus, ...statusUsers];
    
    window.dispatchEvent(new CustomEvent('openStatusViewer', { 
      detail: { 
        initialUserId,
        users: fullQueue
      } 
    }));
  };

  const handleOwnClick = () => {
    if (ownStatus && ownStatus.statuses.length > 0) {
      openViewer(user!.id);
    } else {
      window.dispatchEvent(new CustomEvent('openStatusCreator'));
    }
  };
  
  const handleOwnPlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('openStatusCreator'));
  };

  if (!user) return null;

  // NEW: Ring rendering logic (FIXED)
  const renderRing = (user: ProfileWithStatus) => {
    const hasStatus = user.statuses.length > 0;
    
    if (user.id === profile?.id) {
        // --- OWN RING ---
        if (hasStatus) {
            // Show a plain gray ring if you have a status (like IG)
            return <div className={`absolute inset-0 rounded-full p-[2px] -z-10 bg-[rgb(var(--color-border))]`} />
        } else {
            // No status: Dashed ring
            return <div className="absolute inset-0 rounded-full border-2 border-dashed border-[rgb(var(--color-border))] -z-10"/>
        }
    }
    
    // --- OTHERS' RINGS ---
    // Gradient if unseen, gray if seen
    return <div className={`absolute inset-0 rounded-full p-[2px] -z-10 ${user.hasUnseen ? 'bg-gradient-to-tr from-[rgb(var(--color-accent))] to-[rgb(var(--color-primary))] group-hover:scale-105 transition-transform' : 'bg-[rgb(var(--color-border))]'}`} />
  };

  return (
    <div className="flex space-x-4 p-4 overflow-x-auto scrollbar-hide bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
      {/* Own Circle */}
      {ownStatus && (
        <div 
          onClick={handleOwnClick}
          className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
        >
          <div className="relative w-16 h-16 rounded-full">
            <img 
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`}
              className="w-full h-full rounded-full object-cover p-[2px] bg-[rgb(var(--color-surface))]"
              alt="Your avatar"
            />
            {renderRing(ownStatus)}
            
            <div 
              onClick={handleOwnPlusClick}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer border-2 border-[rgb(var(--color-surface))]"
            >
              <Plus size={16} className="text-[rgb(var(--color-text-on-primary))]" />
            </div>
          </div>
          <span className="text-xs text-center text-[rgb(var(--color-text-secondary))] truncate w-16">Your Status</span>
        </div>
      )}

      {/* Others' Circles */}
      {statusUsers.map((statusUser) => (
          <div 
            key={statusUser.id} 
            onClick={() => openViewer(statusUser.id)}
            className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative w-16 h-16 rounded-full">
              <img 
                src={statusUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${statusUser.username}`}
                className="w-full h-full rounded-full object-cover p-[2px] bg-[rgb(var(--color-surface))]"
                alt={statusUser.display_name}
              />
              {renderRing(statusUser)}
            </div>
            <span className="text-xs text-center text-[rgb(var(--color-text-secondary))] truncate w-16">
              {statusUser.display_name || statusUser.username}
            </span>
          </div>
        ))}
    </div>
  );
};


// =======================================================================
//  2. STATUS CREATOR
//  Massively upgraded with Camera and Video recording.
// =======================================================================
type CreatorMode = 'upload' | 'camera' | 'video';

const StatusCreator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  
  // Media State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textOverlay, setTextOverlay] = useState('');
  
  // UI State
  const [isPosting, setIsPosting] = useState(false);
  const [mode, setMode] = useState<CreatorMode>('camera'); // Default to camera
  const [isRecording, setIsRecording] = useState(false);
  
  // Camera/Mic Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Utility Functions ---

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Clean up Object URLs and streams
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  // --- Camera/Video Logic ---

  const startCamera = useCallback(async () => {
    stopCameraStream(); // Stop any existing stream
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera is not supported on your device.");
      setMode('upload');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: mode === 'video', // Only request audio if in video mode
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setMode('upload');
    }
  }, [facingMode, mode]);

  // Start camera when mode changes to 'camera' or 'video'
  useEffect(() => {
    if (mode === 'camera' || mode === 'video') {
      if (!mediaFile) {
          startCamera();
      }
    } else {
      stopCameraStream();
    }
    
    // Cleanup on mode change
    return () => stopCameraStream();
  }, [mode, startCamera, mediaFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert("Only image and video files are allowed.");
        return;
    }
    
    setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
    setMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    stopCameraStream(); // We have a file, stop the camera
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setMediaFile(new File([blob], 'status.jpg', { type: 'image/jpeg' }));
        setMediaPreviewUrl(URL.createObjectURL(blob));
        setMediaType('image');
        stopCameraStream();
      }
    }, 'image/jpeg');
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    
    setIsRecording(true);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm' // Use webm for broad support
    });
    
    mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
    };
    
    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'video/webm' });
        setMediaFile(new File([blob], 'status.webm', { type: 'video/webm' }));
        setMediaPreviewUrl(URL.createObjectURL(blob));
        setMediaType('video');
        setIsRecording(false);
        stopCameraStream();
    };
    
    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    // The useEffect[facingMode] will handle restarting the camera
  };

  // --- Posting Logic ---

  const handlePost = async () => {
    if (!user || !mediaFile) return;

    setIsPosting(true);
    try {
      const uploadResult = await uploadStatusMedia(mediaFile);
      if (!uploadResult) throw new Error('Upload failed.');

      await supabase
        .from('statuses')
        .insert({
          user_id: user.id,
          media_url: uploadResult.url,
          media_type: mediaType,
          text_overlay: textOverlay ? { 
            text: textOverlay, 
            x: 50, 
            y: 50, 
            color: 'white',
            fontSize: 24
          } : {},
          // viewed_by array is defaulted to empty
        });
      
      onClose(); // Success
    } catch (error) {
      console.error('Error posting status:', error);
      alert('Failed to post status. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const reset = () => {
    setMediaFile(null);
    setMediaPreviewUrl('');
    setTextOverlay('');
    startCamera(); // Go back to camera mode
  };

  // --- Render ---

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center">
      <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for photos */}
      
      <div className="relative w-full h-full max-w-lg max-h-screen bg-black rounded-lg overflow-hidden">
        
        {/* Header Bar */}
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center">
          <button 
            onClick={mediaFile ? reset : onClose} 
            className="p-2 bg-black/50 rounded-full text-white"
          >
            <X size={24} />
          </button>
          
          {mediaFile && (
             <button 
              onClick={handlePost}
              disabled={isPosting}
              className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))] rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Post Status'}
              {!isPosting && <Send size={16} />}
            </button>
          )}
        </div>

        {/* Media Preview (when file exists) */}
        {mediaFile && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10">
            {mediaType === 'image' && (
              <img src={mediaPreviewUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
            )}
            {mediaType === 'video' && (
              <video src={mediaPreviewUrl} className="max-w-full max-h-full" autoPlay muted loop playsInline />
            )}
            <div className="absolute w-full p-4 flex items-center justify-center pointer-events-none">
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Add text..."
                className="w-full text-center bg-black/60 text-white text-2xl font-bold p-2 outline-none border-none pointer-events-auto"
                style={{ textShadow: '0px 0px 8px rgba(0,0,0,0.7)' }}
              />
            </div>
          </div>
        )}

        {/* Camera / Upload UI (no file yet) */}
        {!mediaFile && (
          <div className="w-full h-full flex flex-col items-center justify-center z-0">
            {/* Camera View */}
            {(mode === 'camera' || mode === 'video') && (
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
               />
            )}
            
            {/* Upload View */}
            {mode === 'upload' && (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                    <h2 className="text-2xl font-bold text-white">Upload a Status</h2>
                    <p className="text-gray-400 text-center">Upload an image or a video from your device.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-on-primary))] rounded-full font-bold flex items-center gap-2"
                    >
                      <ImageIcon size={20} /> Select Media
                    </button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                    />
                 </div>
            )}
          </div>
        )}

        {/* Footer Controls (no file yet) */}
        {!mediaFile && (
            <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex justify-between items-center">
                {/* Mode Toggles */}
                <div className="flex gap-4 text-white font-medium">
                    <button onClick={() => setMode('upload')} className={mode === 'upload' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-400'}>Upload</button>
                    <button onClick={() => setMode('camera')} className={mode === 'camera' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-400'}>Photo</button>
                    <button onClick={() => setMode('video')} className={mode === 'video' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-400'}>Video</button>
                </div>
                
                {/* Shutter Button */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    {mode === 'camera' && (
                        <button onClick={takePicture} className="w-16 h-16 rounded-full bg-white border-4 border-white/50" />
                    )}
                    {mode === 'video' && (
                        <button onClick={isRecording ? stopRecording : startRecording} className="w-16 h-16 rounded-full bg-red-500 border-4 border-white/50 flex items-center justify-center">
                            {isRecording && <div className="w-6 h-6 bg-white rounded-md" />}
                        </button>
                    )}
                </div>
                
                {/* Flip Camera */}
                {(mode === 'camera' || mode === 'video') && (
                    <button onClick={toggleFacingMode} className="p-3 bg-black/50 rounded-full text-white">
                        <RefreshCcw size={20} />
                    </button>
                )}
            </div>
        )}

        {/* Loading Overlay */}
        {isPosting && (
            <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
      </div>
    </div>
  );
};

// =======================================================================
//  3. STATUS VIEWER (AND SUB-COMPONENTS)
//  Upgraded with "Viewed by" list, profile nav, and DM replies.
// =======================================================================

// --- NEW, ROBUST StoryProgressBar ---
const StoryProgressBar: React.FC<{
  duration: number;
  isActive: boolean;
  isPaused: boolean;
  onFinished: () => void;
}> = ({ duration, isActive, isPaused, onFinished }) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedPauseDurationRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);

  // Effect to reset or fill the bar based on active state
  useEffect(() => {
    if (isActive) {
      setProgress(0);
      startTimeRef.current = Date.now();
      accumulatedPauseDurationRef.current = 0;
      lastPauseTimeRef.current = 0;
    } else {
      // If we are navigating away, check progress.
      // If not 100, reset to 0. If 100, keep it 100.
      setProgress(p => p < 100 ? 0 : 100);
    }
  }, [isActive]);

  // Effect to handle pausing
  useEffect(() => {
    if (!isActive) return;

    if (isPaused) {
      // We just paused
      if (lastPauseTimeRef.current === 0) { // Only set if not already set
        lastPauseTimeRef.current = Date.now();
      }
    } else {
      // We just unpaused
      if (lastPauseTimeRef.current > 0) {
        accumulatedPauseDurationRef.current += (Date.now() - lastPauseTimeRef.current);
        lastPauseTimeRef.current = 0;
      }
    }
  }, [isPaused, isActive]);

  // Effect for the animation loop
  useEffect(() => {
    if (!isActive || isPaused || duration === 0) return;

    let frameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsedTime = now - startTimeRef.current - accumulatedPauseDurationRef.current;
      const newProgress = (elapsedTime / duration) * 100;

      if (newProgress >= 100) {
        setProgress(100);
        onFinished();
      } else {
        setProgress(newProgress);
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isActive, isPaused, duration, onFinished]); // Runs when unpaused

  // If not active, show 0% unless it's already finished (100%)
  const displayProgress = !isActive && progress < 100 ? 0 : progress;

  return (
    <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
      <div 
        className="h-full bg-white"
        style={{ 
            width: `${displayProgress}%`,
            // Use a tiny transition to smooth out the raf updates
            transition: (displayProgress > 0 && displayProgress < 100) ? 'width 50ms linear' : 'none'
        }} 
      />
    </div>
  );
};


/**
 * NEW: Modal to show who viewed a status
 */
const StatusViewersModal: React.FC<{
  statusId: string;
  onClose: () => void;
  onGoToProfile: (profileId: string) => void;
}> = ({ statusId, onClose, onGoToProfile }) => {
    const [viewers, setViewers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchViewers = async () => {
            setIsLoading(true);
            try {
                // Get the list of UUIDs who viewed
                const { data: statusData, error: statusError } = await supabase
                    .from('statuses')
                    .select('viewed_by')
                    .eq('id', statusId)
                    .single();
                
                if (statusError || !statusData || !statusData.viewed_by || statusData.viewed_by.length === 0) {
                    setIsLoading(false);
                    return;
                }
                
                // Get the profiles for those UUIDs
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', statusData.viewed_by);
                
                if (profilesError) throw profilesError;
                
                setViewers(profilesData || []);
            } catch (error) {
                console.error("Error fetching viewers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchViewers();
    }, [statusId]);

    return (
        <div 
          className="fixed inset-0 bg-black/60 z-[1001] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div 
            className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl max-h-[70vh] flex flex-col shadow-2xl border border-[rgb(var(--color-border))]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Viewed By</h3>
              <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--color-surface-hover))] rounded-full">
                <X size={20} className="text-[rgb(var(--color-text))]" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {isLoading && (
                <div className="text-center p-4 text-[rgb(var(--color-text-secondary))]">Loading...</div>
              )}
              {!isLoading && viewers.length === 0 && (
                 <p className="text-center text-[rgb(var(--color-text-secondary))]">No views yet.</p>
              )}
              {viewers.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img 
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                        className="w-10 h-10 rounded-full cursor-pointer"
                        alt="Avatar"
                        onClick={() => onGoToProfile(profile.id)}
                        />
                        <div>
                        <button onClick={() => onGoToProfile(profile.id)} className="font-bold hover:underline text-[rgb(var(--color-text))] text-sm block">
                            {profile.display_name}
                            {profile.verified && <BadgeCheck size={14} className="inline ml-1 text-[rgb(var(--color-accent))]" />}
                        </button>
                        <span className="text-sm text-[rgb(var(--color-text-secondary))]">@{profile.username}</span>
                        </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
    );
};


/**
 * The Main Story Viewer Component
 */
const StatusViewer: React.FC<{
  allStatusUsers: ProfileWithStatus[];
  initialUserId: string;
  onClose: () => void;
}> = ({ allStatusUsers, initialUserId, onClose }) => {
  const { user } = useAuth();
  
  const [currentUserIndex, setCurrentUserIndex] = useState(() => 
    Math.max(0, allStatusUsers.findIndex(u => u.id === initialUserId))
  );
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Reply and Viewer state
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0); // <-- NEW: For video duration

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentUser = allStatusUsers[currentUserIndex];
  const currentStory = currentUser?.statuses?.[currentStoryIndex];
  
  // --- Navigation Logic ---

  const goToNextUser = useCallback(() => {
    if (currentUserIndex < allStatusUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setIsLoading(true);
    } else {
      onClose();
    }
  }, [currentUserIndex, allStatusUsers.length, onClose]);

  const goToNextStory = useCallback(() => {
    if (currentUser && currentStoryIndex < currentUser.statuses.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      goToNextUser();
    }
  }, [currentStoryIndex, currentUser, goToNextUser]);

  const goToPrevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(0); // Start at first story of prev user
      setIsLoading(true);
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      goToPrevUser();
    }
  };
  
  // --- Media Loading and View Marking ---
  
  useEffect(() => {
    if (!currentStory || !user) return;
    
    setIsLoading(true);
    
    // 1. Mark as viewed (FIXED: Now uses RPC)
    const markAsViewed = async () => {
        // Don't mark own stories as viewed
        if (currentStory.user_id === user.id) return;
        
        // Optimistic client-side update to stop re-triggering
        const viewedBy = currentStory.viewed_by || [];
        if (viewedBy.includes(user.id)) return;
        
        currentStory.viewed_by.push(user.id); // Mutate local copy
        
        // Fire-and-forget DB update using RPC
        await supabase.rpc('mark_status_viewed', {
            status_id: currentStory.id,
            viewer_id: user.id
        });
    };
    
    markAsViewed();

    // 2. Load media
    const mediaUrl = currentStory.media_url;
    if (currentStory.media_type === 'image') {
      const img = new Image();
      img.src = mediaUrl;
      img.onload = () => setIsLoading(false);
      img.onerror = () => goToNextStory(); // Skip broken
    } else if (currentStory.media_type === 'video') {
      if (videoRef.current) {
        videoRef.current.src = mediaUrl;
        videoRef.current.load();
        setVideoDuration(0); // <-- NEW: Reset duration
      }
    }
  }, [currentStory, user, goToNextStory]);
  
  // Video playback
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        if (isPaused || isLoading) {
            video.pause();
        } else {
            video.play().catch(() => {}); // Ignore play errors
        }
    }
  }, [isPaused, isLoading, currentStory]);

  // --- Input Handlers ---
  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  const handleClickNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickThreshold = rect.width * 0.3;
    
    if (clickX < clickThreshold) goToPrevStory();
    else goToNextStory();
  };

  const handleGoToProfile = (profileId: string) => {
    onClose(); // Close viewer first
    setShowViewers(false); // Close modal if open
    window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !currentStory || !currentUser) return;
    
    setIsSendingReply(true);
    setIsPaused(true); // Pause while sending
    
    try {
        await supabase.from('messages').insert({
            sender_id: user.id,
            recipient_id: currentUser.id,
            content: replyContent,
            // Add media from the story to mimic IG replies
            media_url: currentStory.media_url,
            media_type: currentStory.media_type
        });
        
        setReplyContent('');
        // Show "Sent" feedback
        setTimeout(() => {
            setIsSendingReply(false);
            setIsPaused(false); // Resume
        }, 1000);
        
    } catch (error) {
        console.error("Error sending reply:", error);
        setIsSendingReply(false);
        setIsPaused(false);
    }
  };


  if (!currentUser || !currentStory) {
    return (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  const overlay = currentStory.text_overlay as any;
  const isOwnStory = currentUser.id === user?.id;

  return (
    <Fragment>
    <div 
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute inset-0 z-20" onClick={handleClickNavigation} />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-3 z-30">
        {/* Progress Bars */}
        <div className="flex space-x-1 mb-2">
          {currentUser.statuses.map((story, idx) => (
            <StoryProgressBar
              key={story.id}
              duration={ // <-- UPDATED to use videoDuration
                story.media_type === 'image' 
                  ? 5000 
                  : (idx === currentStoryIndex ? videoDuration : 0)
              } 
              isActive={idx === currentStoryIndex}
              isPaused={isPaused || isLoading}
              onFinished={goToNextStory} // <-- UPDATED to be universal
            />
          ))}
        </div>
        
        {/* User Info */}
        <button 
            onClick={() => handleGoToProfile(currentUser.id)}
            className="flex items-center gap-3 group"
        >
          <img 
            src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
            className="w-10 h-10 rounded-full group-hover:opacity-80 transition"
            alt={currentUser.display_name}
          />
          <div className="flex flex-col items-start">
            <span className="text-white font-bold text-sm group-hover:underline">{currentUser.display_name}</span>
            <span className="text-white/70 text-xs">@{currentUser.username}</span>
          </div>
        </button>
      </div>
      
      <button onClick={onClose} className="absolute top-4 right-4 z-40 text-white p-2 bg-black/30 rounded-full">
        <X size={24} />
      </button>

      {/* Media Content */}
      <div className="relative flex-1 w-full max-w-lg max-h-screen flex items-center justify-center overflow-hidden">
        {isLoading && (
           <div className="absolute z-10">
             <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
           </div>
        )}
        
        <img 
          src={currentStory.media_type === 'image' ? currentStory.media_url : ''} 
          className={`max-w-full max-h-full object-contain transition-opacity ${currentStory.media_type === 'image' ? 'opacity-100' : 'opacity-0'}`} 
          alt="" 
        />
        
        <video
          ref={videoRef}
          className={`max-w-full max-h-full object-contain transition-opacity ${currentStory.media_type === 'video' ? 'opacity-100' : 'opacity-0'}`}
          playsInline
          onEnded={goToNextStory} // Keep as fallback
          onLoadedMetadata={(e) => { // <-- NEW: Get video duration
            setIsLoading(false); // Video metadata is loaded
            setVideoDuration(e.currentTarget.duration * 1000);
          }}
          onCanPlay={() => { // Keep as fallback
             setIsLoading(false);
             if (videoRef.current && videoDuration === 0) { // Fix for stubborn browsers
                setVideoDuration(videoRef.current.duration * 1000);
             }
          }}
          onError={() => goToNextStory()}
          muted
        />

        {overlay.text && (
          <div 
            className="absolute text-white p-2 bg-black/60 rounded"
            style={{ 
                left: `${overlay.x || 50}%`, 
                top: `${overlay.y || 50}%`,
                transform: `translate(-${overlay.x || 50}%, -${overlay.y || 50}%)`,
                fontSize: `${overlay.fontSize || 24}px`,
                color: overlay.color || 'white',
                textShadow: '0px 0px 8px rgba(0,0,0,0.7)'
            }}
          >
            {overlay.text}
          </div>
        )}
      </div>

      {/* Reply Bar / Viewers Button */}
      {isOwnStory ? (
        <div className="absolute bottom-0 left-0 w-full p-4 z-30">
           <button 
             onClick={() => setShowViewers(true)}
             className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full text-white text-sm"
            >
              <Eye size={16} />
              Viewed by {currentStory.viewed_by?.length || 0}
           </button>
        </div>
      ) : (
        <form onSubmit={handleSendReply} className="absolute bottom-0 left-0 w-full p-4 z-30">
          <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${currentUser.display_name}...`} 
                className="flex-1 p-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/70 outline-none text-sm"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              />
             <button 
                type="submit"
                disabled={isSendingReply || !replyContent.trim()}
                className="p-3 rounded-full text-white bg-white/20 disabled:opacity-50"
             >
                {isSendingReply ? <Check size={20} /> : <Send size={20} />}
            </button>
          </div>
        </form>
      )}
    </div>
    
    {/* Viewers Modal */}
    {showViewers && isOwnStory && (
        <StatusViewersModal
            statusId={currentStory.id}
            onClose={() => setShowViewers(false)}
            onGoToProfile={handleGoToProfile}
        />
    )}
    </Fragment>
  );
};

// =======================================================================
//  4. STATUS ARCHIVE
// =======================================================================
export const StatusArchive: React.FC = () => {
  const { user } = useAuth();
  const [allStatuses, setAllStatuses] = useState<StatusType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        const { data } = await supabase
          .from('statuses')
          .select('*, profiles!user_id(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setAllStatuses(data || []);
      } catch (error) {
        console.error('Error fetching archive:', error);
      }
    };
    fetchAll();
  }, [user]);

  const openArchiveViewer = (status: StatusType) => setSelectedStatus(status);

  if (allStatuses.length === 0) {
    return (
      <div className="p-8 text-center text-[rgb(var(--color-text-secondary))]">
        <Archive size={48} className="mx-auto mb-4 opacity-50" />
        <p>No statuses in your archive yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Status Archive</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allStatuses.map((status) => (
          <div key={status.id} className="relative group cursor-pointer" onClick={() => openArchiveViewer(status)}>
            {status.media_type === 'image' ? (
              <img src={status.media_url} className="w-full aspect-square object-cover rounded" alt="Archive" />
            ) : (
              <video src={status.media_url} className="w-full aspect-square object-cover rounded" muted />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-end p-2 rounded transition-opacity">
              <span className="text-white text-sm truncate">{new Date(status.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedStatus && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedStatus(null)}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            {selectedStatus.media_type === 'image' ? (
              <img src={selectedStatus.media_url} className="w-full rounded" alt="Full" />
            ) : (
              <video src={selectedStatus.media_url} className="w-full rounded" controls autoPlay muted playsInline />
            )}
            <button onClick={() => setSelectedStatus(null)} className="absolute -top-10 right-0 text-white p-2"><X size={24} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

// =======================================================================
//  5. STATUS SIDEBAR
// =======================================================================
interface StatusSidebarProps {
  show: boolean;
  onClose: () => void;
  setView: (view: any) => void;
  view: string;
}

export const StatusSidebar: React.FC<StatusSidebarProps> = ({ show, onClose, setView, view }) => {
  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', view: 'feed', onClick: () => { setView('feed'); onClose(); } },
    { icon: <Archive size={20} />, label: 'Status Archive', view: 'archive', onClick: () => { setView('archive'); onClose(); } },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[98] transition-opacity ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed left-0 top-0 h-full w-64 bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] z-[99] ${show ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 shadow-lg flex-shrink-0`}>
        <nav className="p-4 space-y-2 h-full flex flex-col">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                view === item.view
                  ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] font-bold'
                  : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

// =======================================================================
//  6. GLOBAL MODAL CONTAINER
// =======================================================================
export const Status: React.FC = () => {
  const [showCreator, setShowCreator] = useState(false);
  
  const [viewerData, setViewerData] = useState<{
    users: ProfileWithStatus[];
    initialUserId: string;
  } | null>(null);

  useEffect(() => {
    const handleOpenCreator = () => setShowCreator(true);
    
    const handleOpenViewer = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.users && detail.initialUserId) {
        setViewerData({
          users: detail.users,
          initialUserId: detail.initialUserId
        });
      }
    };

    window.addEventListener('openStatusCreator', handleOpenCreator);
    window.addEventListener('openStatusViewer', handleOpenViewer);

    return () => {
      window.removeEventListener('openStatusCreator', handleOpenCreator);
      window.removeEventListener('openStatusViewer', handleOpenViewer);
    };
  }, []);

  return (
    <Fragment>
      {showCreator && <StatusCreator onClose={() => setShowCreator(false)} />}
      
      {viewerData && (
        <StatusViewer
          allStatusUsers={viewerData.users}
          initialUserId={viewerData.initialUserId}
          onClose={() => setViewerData(null)}
        />
      )}
    </Fragment>
  );
};
