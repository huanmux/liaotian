// src/components/Calls.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import Peer from 'peerjs';

// A simple reusable Modal component
const Modal = ({ children, onClose, wide = false }: { children: React.ReactNode, onClose: () => void, wide?: boolean }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div 
      className={`bg-[rgb(var(--color-surface))] rounded-lg shadow-xl p-6 w-full ${wide ? 'max-w-lg' : 'max-w-sm'} relative`} 
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]">
        <X size={20} />
      </button>
      {children}
    </div>
  </div>
);

// Modified to hold the PeerJS call object
type IncomingCall = {
  from: Profile;
  type: 'audio' | 'video';
  peerCall: Peer.MediaConnection;
};

export const Calls = () => {
  const { user } = useAuth();
  
  // State for call management
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callInProgress, setCallInProgress] = useState<{ with: Profile; type: 'audio' | 'video'; isCaller: boolean } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Refs for PeerJS and State (to avoid effect re-runs)
  const peerRef = useRef<Peer | null>(null);
  const activeCallRef = useRef<Peer.MediaConnection | null>(null);
  
  // IMPORTANT: Keep refs to state so we can access latest values in Peer listeners
  // without forcing the Peer useEffect to re-run and destroy the connection.
  const callInProgressRef = useRef(callInProgress);
  const incomingCallRef = useRef(incomingCall);

  useEffect(() => {
    callInProgressRef.current = callInProgress;
    incomingCallRef.current = incomingCall;
  }, [callInProgress, incomingCall]);

  // --- WebRTC & Media Functions ---

  // 1. Get User Media (Mic/Cam)
  const getMedia = useCallback(async (type: 'audio' | 'video') => {
    setMediaError(null);
    const constraints = {
      audio: true,
      video: type === 'video'
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (type === 'video') setIsCamOff(false);
      setIsMuted(false);
      return stream;
    } catch (err: any) {
      console.error('Error getting user media:', err);
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
         setMediaError('No microphone or camera found.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         setMediaError(type === 'video' ? 'Microphone/Camera access denied.' : 'Microphone access denied.');
      } else {
         setMediaError('Error accessing media devices.');
      }
      
      // Proceed with an empty stream so the connection logic still works
      setLocalStream(null); 
      setIsMuted(true);
      if (type === 'video') setIsCamOff(true);
      return new MediaStream(); // Return empty stream instead of null
    }
  }, []);

  // 2. Clean up media and connection
  const cleanupCall = useCallback(() => {
    if (activeCallRef.current) {
        activeCallRef.current.close();
        activeCallRef.current = null;
    }
    
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallInProgress(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCamOff(false);
    setMediaError(null);
  }, [localStream, remoteStream]);

  // --- Call Action Functions ---

  const handleHangUp = useCallback(() => {
    cleanupCall(); 
  }, [cleanupCall]);
  
  const startCall = useCallback(async (targetUser: Profile, type: 'audio' | 'video') => {
    if (!user || callInProgressRef.current || !peerRef.current) return;

    // Get stream (or empty stream if denied)
    const stream = await getMedia(type); 
    
    setCallInProgress({ with: targetUser, type, isCaller: true });
    
    const metadata = { from: user, type: type };
    // We can safely use stream! here because getMedia now ensures a return
    const call = peerRef.current.call(targetUser.id, stream!, { metadata });
    
    activeCallRef.current = call;

    call.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });
    call.on('close', () => {
      cleanupCall(); 
    });
    call.on('error', (err) => {
      console.error('Peer call error:', err);
      cleanupCall();
    });

  }, [user, getMedia, cleanupCall]);
  
  const answerCall = useCallback(async () => {
    if (!incomingCall || !user) return;

    const stream = await getMedia(incomingCall.type);

    setCallInProgress({ with: incomingCall.from, type: incomingCall.type, isCaller: false });
    
    incomingCall.peerCall.answer(stream!);
    
    activeCallRef.current = incomingCall.peerCall;

    incomingCall.peerCall.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });
    incomingCall.peerCall.on('close', () => {
      cleanupCall(); 
    });
    incomingCall.peerCall.on('error', (err) => {
      console.error('Peer call error:', err);
      cleanupCall();
    });

    setIncomingCall(null);
  }, [user, incomingCall, getMedia, cleanupCall]);

  const denyCall = useCallback(() => {
     if(incomingCall) {
        incomingCall.peerCall.close();
     }
     setIncomingCall(null);
  }, [incomingCall]);

  // --- Event Listeners ---

  // Listen for 'startCall' window event from Messages.tsx
  useEffect(() => {
     const handleStartCall = (e: any) => {
        const { targetUser, type } = e.detail;
        startCall(targetUser, type);
     };
     window.addEventListener('startCall', handleStartCall);
     return () => window.removeEventListener('startCall', handleStartCall);
  }, [startCall]);

  // Initialize PeerJS
  // IMPORTANT: This effect must ONLY depend on `user` to avoid destroying the peer connection during state changes.
  useEffect(() => {
    if (!user) return;
    if (peerRef.current) return; // Prevent double init

    const peer = new Peer(user.id);
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('PeerJS connected with ID:', id);
    });

    peer.on('call', (call) => {
      const metadata = call.metadata;
      
      // Use REFS to check state, so we don't need state in dependency array
      if (callInProgressRef.current || incomingCallRef.current) {
        call.close();
        return;
      }
      
      // Handle caller hanging up before answer
      call.on('close', () => {
         setIncomingCall(prev => (prev?.peerCall === call ? null : prev));
      });

      setIncomingCall({
        from: metadata.from,
        type: metadata.type,
        peerCall: call
      });
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      if (err.type === 'peer-unavailable') {
          // We can access the ref here safely
          if (callInProgressRef.current && !activeCallRef.current?.open) {
             setMediaError(`${callInProgressRef.current.with.display_name} is unreachable.`);
          }
      }
    });

    return () => {
      peer.destroy();
      peerRef.current = null;
    };
  }, [user]); // Dependency array MUST remain minimal


  // --- Media Toggles ---

  const toggleMute = () => {
    const audioTracks = localStream?.getAudioTracks() || [];
    if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
    } else {
        setMediaError('No microphone track available.');
    }
  };

  const toggleCamera = () => {
    const videoTracks = localStream?.getVideoTracks() || [];
    if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsCamOff(!isCamOff);
    } else {
        setMediaError('No camera track available.');
    }
  };
  
  // --- Render Logic ---

  if (incomingCall) {
    return (
      <Modal onClose={denyCall}>
        <div className="text-center text-[rgb(var(--color-text))]">
          
          <h3 className="text-xl font-bold">{incomingCall.from.display_name}</h3>
          <p className="text-[rgb(var(--color-text-secondary))]">
            Incoming {incomingCall.type} call...
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={denyCall}
              className="p-4 rounded-full bg-red-600 text-white transition hover:bg-red-700"
              title="Deny"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={answerCall}
              className="p-4 rounded-full bg-green-500 text-white transition hover:bg-green-600"
              title="Answer"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (callInProgress) {
     return (
        <Modal onClose={handleHangUp} wide={true}>
            <div className="text-center text-[rgb(var(--color-text))]">
                <h3 className="text-xl font-bold mb-2">
                    {callInProgress.isCaller && !remoteStream ? 'Ringing...' : ''} 
                    {!callInProgress.isCaller || remoteStream ? `In call with ${callInProgress.with.display_name}` : ''}
                    {callInProgress.isCaller && !remoteStream && <span className="block text-sm font-normal text-[rgb(var(--color-text-secondary))]">Waiting for answer...</span>}
                </h3>
                
                {mediaError && (
                  <p className="text-red-500 text-sm mb-3 bg-red-100 dark:bg-red-900/30 p-2 rounded">{mediaError}</p>
                )}
                
                <div className="relative w-full aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                    {/* Remote Video */}
                    <video 
                        ref={el => { if (el) el.srcObject = remoteStream; }} 
                        autoPlay 
                        playsInline 
                        className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
                    />
                    {/* Avatar Fallback for Remote */}
                    {!remoteStream && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            
                        </div>
                    )}
                    
                    {/* Local Video (PIP) */}
                    <div className={`absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-black transition-all ${isCamOff || !localStream ? 'hidden' : ''}`}>
                         <video 
                            ref={el => { if (el) el.srcObject = localStream; }} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={toggleMute}
                      className={`p-3 rounded-full transition ${isMuted ? 'bg-red-600 text-white' : 'bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))]'}`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    {callInProgress.type === 'video' && (
                        <button
                          onClick={toggleCamera}
                          className={`p-3 rounded-full transition ${isCamOff ? 'bg-red-600 text-white' : 'bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text))]'}`}
                          title={isCamOff ? "Turn camera on" : "Turn camera off"}
                        >
                          {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                    )}
                    <button
                      onClick={handleHangUp}
                      className="p-4 rounded-full bg-red-600 text-white transition hover:bg-red-700"
                      title="Hang up"
                    >
                      <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        </Modal>
     );
  }
  
  return null;
};
