import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, UserPlus, Volume2 } from 'lucide-react';

interface CallControlsToolbarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isAudioOnlyCall: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onOpenAddModal: () => void;
  onHangup: () => void;
}

export const CallControlsToolbar: React.FC<CallControlsToolbarProps> = ({
  isMuted,
  isVideoOff,
  isAudioOnlyCall,
  onToggleMute,
  onToggleVideo,
  onOpenAddModal,
  onHangup,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 bg-stone-900/95 border-t border-stone-800 shrink-0">
      <button
        onClick={onToggleMute}
        className={`p-3.5 rounded-2xl font-bold transition flex items-center justify-center cursor-pointer shadow-md ${
          isMuted
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
        }`}
        title={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {!isAudioOnlyCall && (
        <button
          onClick={onToggleVideo}
          className={`p-3.5 rounded-2xl font-bold transition flex items-center justify-center cursor-pointer shadow-md ${
            isVideoOff
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
          }`}
          title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
      )}

      <button
        onClick={onOpenAddModal}
        className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition border border-stone-700 cursor-pointer shadow-md"
        title="Inviter un participant"
      >
        <UserPlus className="h-5 w-5" />
      </button>

      <button
        onClick={onHangup}
        className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
      >
        <PhoneOff className="h-5 w-5" />
        <span className="hidden xs:inline text-xs font-bold uppercase tracking-wide">Raccrocher</span>
      </button>
    </div>
  );
};
