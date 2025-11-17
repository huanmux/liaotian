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

const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

// =======================================================================
//  1. STATUS TRAY
//  Updated with "Unseen" logic & Upload Progress Bar on own avatar.
// =======================================================================

export const StatusTray: React.FC = () => {
  const { user, profile } = useAuth();
  const [statusUsers, setStatusUsers] = useState<ProfileWithStatus[]>([]);
  const [ownStatus, setOwnStatus] = useState<ProfileWithStatus | null>(null);
  // ADDED: State for upload progress for the new feature
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // null means not uploading

  // ADDED: Effect to handle upload progress updates
  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const progress = detail.progress as number;
      
      if (progress === 100) {
        // Upload finished. Give it a moment for the DB to update/fetch to happen, then clear.
        setTimeout(() => setUploadProgress(null), 1000); 
      } else {
        setUploadProgress(progress);
      }
    };
    
    window.addEventListener('statusUploadProgress', handleProgress as EventListener);
    
    return () => {
      window.removeEventListener('statusUploadProgress', handleProgress as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchActiveStatuses = async () => {
      try {
        let statusQuery = supabase
          .from('statuses')
          .select('*, profiles!user_id(*)')
          .gt('expires_at', new Date().toISOString()) // <-- Expiration logic is here
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

  // UPDATED: Ring rendering logic to include upload progress
  const renderRing = (user: ProfileWithStatus) => {
    const hasStatus = user.statuses.length > 0;
    
    if (user.id === profile?.id) {
        // --- OWN RING (Progress Bar / Existing Status / No Status) ---
        // 1. Progress Ring (for upload)
        if (uploadProgress !== null && uploadProgress < 100) {
            // Use conic gradient to simulate progress.
            return (
                <div 
                    className="absolute inset-0 rounded-full p-[2px] -z-10"
                    style={{
                        background: `conic-gradient(rgb(var(--color-primary)) ${uploadProgress}%, rgb(var(--color-border)) ${uploadProgress}%)`
                    }}
                />
            );
        }

        // 2. Existing Status Ring (Gray)
        if (hasStatus) {
            // Show a plain gray ring if you have a status (like IG)
            return <div className={`absolute inset-0 rounded-full p-[2px] -z-10 bg-[rgb(var(--color-border))]`} />
        } else {
            // 3. No Status Ring (Dashed)
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
            <span className="text-xs text-center text-[rgb(var(--color-text-secondary))] truncate w-16 flex items-center justify-center gap-1">
              <span className="truncate">{statusUser.display_name || statusUser.username}</span>
              {statusUser.verified && <BadgeCheck size={12} className="text-[rgb(var(--color-accent))] flex-shrink-0" />}
            </span>
          </div>
        ))}
    </div>
  );
};


// =======================================================================
//  2. STATUS CREATOR
//  Massively upgraded with Camera and Video recording.
//  UPDATED: Added logic to dispatch upload progress events.
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
    
    // --- FIX: Prioritize 'video/mp4' for Safari/iOS support ---
    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : 'video/webm';
    const fileExtension = mimeType.split('/')[1] || 'webm';

    mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
        mimeType: mimeType
    });
    
    mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
    };
    
    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setMediaFile(new File([blob], `status.${fileExtension}`, { type: mimeType }));
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

    // --- ADDED: MOCK UPLOAD PROGRESS DISPATCHER ---
    window.dispatchEvent(new CustomEvent('statusUploadProgress', { detail: { progress: 1 } }));
    let progress = 1;

    // Simulate file upload progress with an async loop
    const mockProgress = () => {
        progress = Math.min(progress + 10, 95); // Stop before 99% for DB write
        window.dispatchEvent(new CustomEvent('statusUploadProgress', { detail: { progress: progress } }));
        if (progress < 95) {
            setTimeout(mockProgress, 300);
        }
    };
    const progressTimeout = setTimeout(mockProgress, 300);
    // ------------------------------------------------

    try {
      const uploadResult = await uploadStatusMedia(mediaFile);
      
      // Stop mock progress, set to 99% before final DB write
      clearTimeout(progressTimeout); 
      progress = 99;
      window.dispatchEvent(new CustomEvent('statusUploadProgress', { detail: { progress: progress } }));

      if (!uploadResult) throw new Error('Upload failed.');

      // --- FIX: Add expires_at timestamp (24 hours from now) ---
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
          expires_at: expires_at // <-- ADDED
        });
      
      // Dispatch Complete Progress (100%)
      window.dispatchEvent(new CustomEvent('statusUploadProgress', { detail: { progress: 100 } }));
      
      onClose(); // Success
    } catch (error) {
      console.error('Error posting status:', error);
      alert('Failed to post status. Please try again.');
      // Dispatch Error/Reset Progress (null)
      window.dispatchEvent(new CustomEvent('statusUploadProgress', { detail: { progress: null } }));
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
//  FIXED: Image centering.
// =======================================================================

// --- NEW: Time Ago Helper Function ---
const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        const minutes = diffInMinutes % 60;
        if (minutes > 0) {
             return `${diffInHours}h ${minutes}m ago`;
        }
        return `${diffInHours}h ago`;
    }
    
    // Fallback for > 24h, though statuses should expire
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
};

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
          <div className="flex items-center gap-2"> {/* <-- WRAP this */}
            <div className="flex flex-col items-start">
              <span className="text-white font-bold text-sm group-hover:underline flex items-center gap-1">
                {currentUser.display_name}
                {currentUser.verified && <BadgeCheck size={14} className="text-white" />}
              </span>
              <span className="text-white/70 text-xs">@{currentUser.username}</span>
            </div>
            {/* --- ADDED Time Ago --- */}
            <span className="text-white/70 text-xs">
                {formatTimeAgo(currentStory.created_at)}
            </span>
          </div>
        </button>
      </div>
      
      <button onClick={onClose} className="absolute top-4 right-4 z-40 text-white p-2 bg-black/30 rounded-full">
        <X size={24} />
      </button>

      {/* Media Content */}
      <div className="relative flex-1 w-full max-w-lg max-h-screen flex items-center justify-center overflow-hidden">
        {isLoading && (
           <div className="p-4 flex flex-col items-center justify-center border-b border-[rgb(var(--color-border))]">
            <div className="logo-loading-container w-[50px] h-auto relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={SVG_VIEWBOX}
                    className="logo-svg"
                >
                    <defs>
                        <clipPath id="logo-clip">
                            <rect
                                id="clip-rect"
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                            />
                        </clipPath>
                    </defs>
                    <path
                        d={SVG_PATH}
                        fill="none"
                        stroke="rgb(var(--color-primary))"
                        strokeWidth="10"
                        strokeOpacity="0.1" 
                    />
                    <path
                        d={SVG_PATH}
                        fill="rgb(var(--color-primary))" 
                        clipPath="url(#logo-clip)"
                        className="logo-fill-animated"
                    />
                </svg>
            </div>
        </div>
        )}
        
        {/* FIXED: Added w-full h-full to image for perfect centering */}
        <img 
          src={currentStory.media_type === 'image' ? currentStory.media_url : ''} 
          className={`w-full h-full object-contain transition-opacity ${currentStory.media_type === 'image' ? 'opacity-100' : 'opacity-0'}`} 
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
