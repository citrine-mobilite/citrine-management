import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  RotateCw, 
  Minimize2, 
  Maximize2, 
  Volume2, 
  ShieldCheck,
  Sparkles,
  Wifi,
  UserPlus,
  Users,
  X,
  Search,
  CheckCircle2,
  Clock,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoIPCall, VoIPCallParticipant, AppUser, Employee, UserOnlinePresence } from '../types';
import { webRTCService } from '../services/webRTCService';
import { callSignalingService } from '../services/callSignalingService';

interface ActiveCallModalProps {
  call: VoIPCall | null;
  currentUser: AppUser | null;
  employees: Employee[];
  users: AppUser[];
  onlinePresences: UserOnlinePresence[];
  remoteStream: MediaStream | null;
  onEndCall: (durationSeconds: number) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Remote Participant Video Tile Component
const RemoteParticipantTile: React.FC<{
  participant: VoIPCallParticipant;
  stream: MediaStream | null;
  isAudioOnlyCall: boolean;
  totalParticipants: number;
}> = ({ participant, stream, isAudioOnlyCall, totalParticipants }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const vTracks = stream.getVideoTracks();
      setHasRemoteVideo(vTracks.length > 0 && vTracks[0].enabled);

      const checkTracks = () => {
        const tracks = stream.getVideoTracks();
        setHasRemoteVideo(tracks.length > 0 && tracks[0].enabled);
      };

      stream.onaddtrack = checkTracks;
      stream.onremovetrack = checkTracks;
    }
  }, [stream]);

  const isRinging = participant.status === 'ringing';
  const isLeft = participant.status === 'left';

  return (
    <div className={`relative flex items-center justify-center bg-stone-900/90 rounded-2xl overflow-hidden border border-stone-800 shadow-xl transition-all duration-300 ${
      totalParticipants <= 2 ? 'w-full h-full min-h-[260px]' : 'w-full h-full min-h-[180px]'
    }`}>
      {/* Video Element */}
      {stream && !isAudioOnlyCall && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            hasRemoteVideo ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />
      )}

      {/* Fallback Avatar when camera is off, ringing or audio-only */}
      {(!stream || isAudioOnlyCall || !hasRemoteVideo) && (
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
          <div className="relative">
            {isRinging && (
              <motion.div
                animate={{ scale: [1, 1.3, 1.6], opacity: [0.8, 0.4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                className="absolute -inset-2 rounded-full border-2 border-amber-400"
              />
            )}
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className={`rounded-full object-cover border-2 shadow-xl ${
                  totalParticipants <= 2 ? 'w-24 h-24' : 'w-16 h-16'
                } ${isRinging ? 'border-amber-400 opacity-80' : 'border-stone-700'}`}
              />
            ) : (
              <div className={`rounded-full bg-gradient-to-tr from-stone-800 to-stone-700 flex items-center justify-center text-white font-bold border-2 shadow-xl ${
                totalParticipants <= 2 ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-xl'
              } ${isRinging ? 'border-amber-400' : 'border-stone-700'}`}>
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}

            {isRinging && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-stone-950 font-bold text-[10px] rounded-full uppercase animate-pulse">
                Sonnerie...
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{participant.name}</h4>
            <p className="text-[11px] text-stone-400">{participant.role || 'Collaborateur'}</p>
          </div>
        </div>
      )}

      {/* Overlay status tag */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-stone-950/70 backdrop-blur-md rounded-lg border border-stone-800/80 text-white text-xs font-medium">
        <span className={`w-2 h-2 rounded-full ${isRinging ? 'bg-amber-400 animate-ping' : isLeft ? 'bg-stone-500' : 'bg-emerald-400'}`} />
        <span className="line-clamp-1 max-w-[120px]">{participant.name}</span>
        {participant.isMuted && <MicOff className="w-3 h-3 text-red-400 ml-1" />}
      </div>
    </div>
  );
};

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  currentUser,
  employees,
  users,
  onlinePresences,
  remoteStream,
  onEndCall,
  showToast
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volumeLevels, setVolumeLevels] = useState<number[]>([10, 25, 40, 60, 45, 30, 15, 45, 70, 50, 35, 20]);
  const [isMobile, setIsMobile] = useState(false);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  const isOutgoing = call?.status === 'ringing';
  const isConnected = call?.status === 'connected';

  // Detect mobile
  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
  }, []);

  // Timer counter when connected
  useEffect(() => {
    if (isConnected) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Attach local stream to video
  useEffect(() => {
    const localStream = webRTCService.getLocalStream();
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [call?.type, isVideoEnabled, isScreenSharing]);

  // Live Soundwave audio analyzer loop
  useEffect(() => {
    if (isConnected) {
      const updateWave = () => {
        const vol = webRTCService.getAudioVolume();
        const base = Math.max(0.1, vol * 2.5);
        setVolumeLevels(prev => 
          prev.map((_, i) => Math.min(100, Math.max(12, Math.floor(base * 80 + Math.sin(Date.now() * 0.008 + i) * 35))))
        );
        animRef.current = requestAnimationFrame(updateWave);
      };
      animRef.current = requestAnimationFrame(updateWave);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isConnected]);

  // Unified available colleagues to invite
  const availableColleagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatarUrl?: string; role: string }>();

    employees.forEach(emp => {
      if (emp.id && emp.name) {
        map.set(emp.id, {
          id: emp.id,
          name: emp.name,
          email: emp.email || '',
          avatarUrl: emp.avatarUrl,
          role: emp.roleType || 'Employé'
        });
      }
    });

    users.forEach(u => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          role: u.role
        });
      }
    });

    // Exclude current user and already invited participants
    if (currentUser?.id) map.delete(currentUser.id);
    if (call?.callerId) map.delete(call.callerId);
    if (call?.calleeId) map.delete(call.calleeId);

    if (call?.participants) {
      call.participants.forEach(p => {
        if (p.status !== 'left' && p.status !== 'rejected') {
          map.delete(p.id);
        }
      });
    }

    return Array.from(map.values());
  }, [employees, users, currentUser, call]);

  const filteredInvitees = useMemo(() => {
    return availableColleagues.filter(c => 
      c.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(inviteSearch.toLowerCase())
    );
  }, [availableColleagues, inviteSearch]);

  const presenceMap = useMemo(() => {
    const pMap = new Map<string, UserOnlinePresence>();
    onlinePresences.forEach(p => {
      pMap.set(p.userId, p);
      if (p.userEmail) pMap.set(p.userEmail.toLowerCase(), p);
    });
    return pMap;
  }, [onlinePresences]);

  if (!call) return null;

  // Compute active remote participants
  const participantsList = useMemo(() => {
    if (call.participants && call.participants.length > 0) {
      return call.participants.filter(p => p.id !== currentUser?.id && p.status !== 'left');
    }
    // Fallback 1-on-1
    const isCaller = call.callerId === currentUser?.id;
    const remoteId = isCaller ? call.calleeId : call.callerId;
    const remoteName = isCaller ? call.calleeName : call.callerName;
    const remoteAvatar = isCaller ? call.calleeAvatar : call.callerAvatar;
    const remoteRole = isCaller ? call.calleeRole : call.callerRole;

    return [{
      id: remoteId,
      name: remoteName || 'Correspondant',
      avatarUrl: remoteAvatar,
      role: remoteRole || 'Collaborateur',
      status: call.status === 'ringing' ? ('ringing' as const) : ('joined' as const)
    }];
  }, [call, currentUser]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggleMic = () => {
    const enabled = webRTCService.toggleAudio();
    setIsMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = webRTCService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleSwitchCamera = async () => {
    await webRTCService.switchCamera();
    const localStream = webRTCService.getLocalStream();
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await webRTCService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        const track = await webRTCService.startScreenShare();
        if (track) setIsScreenSharing(true);
      } catch (e) {
        console.warn('Screen share cancelled:', e);
      }
    }
  };

  const handleAddParticipant = async (targetUser: { id: string; name: string; email?: string; avatarUrl?: string; role?: string }) => {
    if (!currentUser) return;
    try {
      setInvitingId(targetUser.id);
      await callSignalingService.addParticipantToCall(call.id, currentUser, targetUser);
      if (showToast) showToast(`Invitation envoyée à ${targetUser.name}...`, 'success');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      if (showToast) showToast(err.message || "Erreur lors de l'ajout", 'error');
    } finally {
      setInvitingId(null);
    }
  };

  const handleHangup = () => {
    onEndCall(duration);
  };

  // Minimized PiP View
  if (isMinimized) {
    return (
      <div 
        id="minimized-call-widget"
        className="fixed bottom-6 right-6 z-50 bg-stone-900/95 border border-stone-700 text-white rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
            {call.isGroupCall ? <Users className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-stone-900 animate-pulse" />
        </div>

        <div className="flex-1 min-w-[120px]">
          <h4 className="text-xs font-bold text-white line-clamp-1">
            {call.isGroupCall ? `Conférence (${participantsList.length + 1})` : participantsList[0]?.name || 'Appel en cours'}
          </h4>
          <p className="text-[11px] text-emerald-400 font-mono">
            {isConnected ? formatDuration(duration) : 'Sonnerie...'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleMic}
            className={`p-2 rounded-xl text-xs transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-300' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleHangup}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div 
        id="active-call-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/85 backdrop-blur-lg overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-stone-950 border border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Top Bar / Header */}
          <div className="px-5 py-3.5 bg-stone-900/80 border-b border-stone-800/80 flex items-center justify-between z-20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{isConnected ? (call.isGroupCall ? `Conférence (${participantsList.length + 1} membres)` : 'Appel en direct') : 'Connexion...'}</span>
              </div>

              {isConnected && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-stone-300 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
            </div>

            {/* Quick Add Colleague & Minimize Controls */}
            <div className="flex items-center gap-2">
              <button
                id="btn-add-participant-to-call"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 hover:border-amber-500 text-amber-300 hover:text-stone-950 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajouter un collègue</span>
                <span className="sm:hidden">+ Collègue</span>
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
                title="Minimiser (PiP)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Stage Grid (Participants Video & Audio) */}
          <div className="flex-1 relative p-3 sm:p-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex flex-col justify-center items-center overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Dynamic Grid Layout for Remote Participants */}
            <div className={`w-full h-full grid gap-3 sm:gap-4 ${
              participantsList.length === 1 
                ? 'grid-cols-1' 
                : participantsList.length === 2 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {participantsList.map((participant) => {
                const stream = webRTCService.getRemoteStream(participant.id) || remoteStream;
                return (
                  <RemoteParticipantTile
                    key={participant.id}
                    participant={participant}
                    stream={stream}
                    isAudioOnlyCall={call.type === 'audio'}
                    totalParticipants={participantsList.length + 1}
                  />
                );
              })}
            </div>

            {/* Local Stream PIP Preview */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-stone-900/90 rounded-2xl overflow-hidden border-2 border-stone-700 shadow-2xl z-30 group">
              {call.type === 'video' && isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-stone-850 text-stone-400">
                  <div className="w-9 h-9 rounded-full bg-emerald-700/60 flex items-center justify-center text-white text-sm font-bold border border-emerald-500 mb-1">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <span className="text-[10px] font-semibold text-stone-300">Vous (Moi)</span>
                </div>
              )}

              {/* Local status pill */}
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                <span>Vous</span>
                {isMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
              </div>
            </div>

            {/* Outgoing Ringing Banner if still ringing */}
            {isOutgoing && !isConnected && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-2 animate-bounce">
                <Radio className="w-4 h-4 animate-spin" />
                <span>Sonnerie en cours chez vos collègues...</span>
              </div>
            )}

            {/* Live Audio Visualizer Bars (when connected) */}
            {isConnected && (
              <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-1 bg-stone-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-stone-800 shadow-lg">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                {volumeLevels.slice(0, 8).map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.max(4, height * 0.22)}px` }}
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Call Control Action Toolbar */}
          <div className="p-4 bg-stone-900/90 border-t border-stone-800/80 flex items-center justify-center gap-3 sm:gap-4 z-20 backdrop-blur-md">
            {/* Microphone Toggle */}
            <button
              id="btn-toggle-mic"
              onClick={handleToggleMic}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' 
                  : 'bg-stone-800 text-white hover:bg-stone-750 border border-stone-700'
              }`}
              title={isMuted ? 'Activer micro' : 'Couper micro'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Video Toggle */}
            {call.type === 'video' && (
              <button
                id="btn-toggle-camera"
                onClick={handleToggleVideo}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center ${
                  !isVideoEnabled 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' 
                    : 'bg-stone-800 text-white hover:bg-stone-750 border border-stone-700'
                }`}
                title={isVideoEnabled ? 'Couper caméra' : 'Activer caméra'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* Mobile Switch Front/Back Camera */}
            {isMobile && call.type === 'video' && isVideoEnabled && (
              <button
                id="btn-switch-camera"
                onClick={handleSwitchCamera}
                className="p-3.5 sm:p-4 bg-stone-800 hover:bg-stone-750 text-white border border-stone-700 rounded-2xl transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center"
                title="Changer de caméra"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}

            {/* Screen Share Toggle (Desktop) */}
            {!isMobile && (
              <button
                id="btn-toggle-screen-share"
                onClick={handleToggleScreenShare}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center ${
                  isScreenSharing 
                    ? 'bg-blue-500 text-white border border-blue-400 shadow-blue-500/30 shadow-lg' 
                    : 'bg-stone-800 text-white hover:bg-stone-750 border border-stone-700'
                }`}
                title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager mon écran"}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* Add Colleague to Call Button */}
            <button
              id="btn-invite-colleague-toolbar"
              onClick={() => setIsInviteModalOpen(true)}
              className="p-3.5 sm:p-4 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 hover:border-amber-500 rounded-2xl transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2"
              title="Ajouter un collègue à cet appel"
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-xs font-bold hidden md:inline">Inviter</span>
            </button>

            {/* End Call / Hang Up Button */}
            <button
              id="btn-hangup-call"
              onClick={handleHangup}
              className="py-3.5 px-6 sm:px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-all duration-200 active:scale-95 shadow-xl flex items-center gap-2 ml-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span>{call.isGroupCall ? 'Quitter' : 'Raccrocher'}</span>
            </button>
          </div>

          {/* 👥 Add Colleague / Participant Modal Overlay */}
          {isInviteModalOpen && (
            <div className="absolute inset-0 z-40 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                className="w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-3xl p-5 shadow-2xl text-white flex flex-col max-h-[85%]"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Ajouter un collègue</h3>
                      <p className="text-[11px] text-stone-400">Rejoindre la conversation en cours</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative my-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    placeholder="Rechercher par nom, rôle ou email..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                {/* Colleagues List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredInvitees.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-xs">
                      Aucun collègue disponible à ajouter.
                    </div>
                  ) : (
                    filteredInvitees.map((colleague) => {
                      const presence = presenceMap.get(colleague.id) || (colleague.email ? presenceMap.get(colleague.email.toLowerCase()) : null);
                      const isOnline = presence && (Date.now() - new Date(presence.lastSeen).getTime() < 120000);
                      const isInCall = presence?.status === 'in_call';

                      return (
                        <div
                          key={colleague.id}
                          className="flex items-center justify-between p-2.5 bg-stone-850/70 hover:bg-stone-800/80 border border-stone-800 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {colleague.avatarUrl ? (
                                <img
                                  src={colleague.avatarUrl}
                                  alt={colleague.name}
                                  className="w-10 h-10 rounded-full object-cover border border-stone-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-stone-750 flex items-center justify-center font-bold text-white text-sm border border-stone-700">
                                  {colleague.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-stone-900 ${
                                isInCall ? 'bg-amber-400' : isOnline ? 'bg-emerald-400' : 'bg-stone-500'
                              }`} />
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-white line-clamp-1">{colleague.name}</h4>
                              <p className="text-[10px] text-stone-400">{colleague.role} • {isInCall ? 'En ligne (Appel)' : isOnline ? 'En ligne' : 'Hors ligne'}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddParticipant(colleague)}
                            disabled={invitingId === colleague.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {invitingId === colleague.id ? (
                              <Radio className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            <span>Ajouter</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
