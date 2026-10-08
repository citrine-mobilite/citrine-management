import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { VoIPCallParticipant } from '../../types';

interface RemoteParticipantTileProps {
  participant: VoIPCallParticipant;
  stream: MediaStream | null;
  isAudioOnlyCall: boolean;
  totalParticipants: number;
}

export const RemoteParticipantTile: React.FC<RemoteParticipantTileProps> = ({
  participant,
  stream,
  isAudioOnlyCall,
  totalParticipants,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const vTracks = stream.getVideoTracks();
      setHasRemoteVideo(vTracks.length > 0 && vTracks[0].enabled);
    }
  }, [stream]);

  const isRinging = participant.status === 'ringing';

  return (
    <div
      className={`relative flex items-center justify-center bg-stone-900/90 rounded-2xl overflow-hidden border border-stone-800 shadow-xl transition-all duration-300 ${
        totalParticipants <= 2 ? 'w-full h-full min-h-[260px]' : 'w-full h-full min-h-[180px]'
      }`}
    >
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
                className="w-20 h-20 rounded-full object-cover border-2 border-[#2A7B76]/50 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2A7B76] to-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-emerald-400/30">
                {participant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{participant.name}</h4>
            <p className="text-xs text-stone-400 capitalize">
              {isRinging ? 'Sonnerie en cours...' : participant.role || 'Collaborateur'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
