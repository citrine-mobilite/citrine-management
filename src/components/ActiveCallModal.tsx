import React, { useState, useEffect } from 'react';
import { VoIPCall, AppUser, Employee, UserOnlinePresence } from '../types';
import { webRTCService } from '../services/webRTCService';
import { callSignalingService } from '../services/callSignalingService';
import { RemoteParticipantTile } from './calls/RemoteParticipantTile';
import { CallControlsToolbar } from './calls/CallControlsToolbar';

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

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  currentUser,
  remoteStream,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!call || call.status !== 'connected') return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [call]);

  if (!call) return null;

  const toggleMute = () => {
    webRTCService.toggleMute(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    webRTCService.toggleVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAudioOnly = call.type === 'audio';
  const participants = call.participants || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-2xl w-full h-[85vh] max-h-[700px] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif font-bold text-base text-white">
              {isAudioOnly ? "Appel Audio d'Équipe" : 'Visioconférence HD'}
            </h3>
            <p className="text-xs text-emerald-400 font-mono font-semibold">
              {call.status === 'connected' ? `En cours • ${formatDuration(callDuration)}` : 'Connexion...'}
            </p>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 items-center justify-center">
          {participants.length > 0 ? (
            participants.map((p) => (
              <RemoteParticipantTile
                key={p.id}
                participant={p}
                stream={remoteStream}
                isAudioOnlyCall={isAudioOnly}
                totalParticipants={participants.length}
              />
            ))
          ) : (
            <div className="text-center text-stone-400 text-xs col-span-2">Connexion aux participants...</div>
          )}
        </div>

        {/* Toolbar Controls */}
        <CallControlsToolbar
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isAudioOnlyCall={isAudioOnly}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onOpenAddModal={() => {}}
          onHangup={() => {
            callSignalingService.endCall(call.id, 'Accroché par l\'utilisateur');
            onEndCall(callDuration);
          }}
        />
      </div>
    </div>
  );
};
