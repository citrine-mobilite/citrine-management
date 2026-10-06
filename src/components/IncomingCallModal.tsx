import React from 'react';
import { Phone, PhoneOff, Video, Users, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoIPCall } from '../types';

interface IncomingCallModalProps {
  call: VoIPCall | null;
  onAccept: (call: VoIPCall) => void;
  onReject: (call: VoIPCall) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onReject
}) => {
  if (!call) return null;

  const isVideo = call.type === 'video';
  const isGroup = call.isGroupCall || (call.participants && call.participants.length > 2);
  const inviterName = call.invitedBy || call.callerName;

  // List of other colleagues on the call
  const otherParticipants = call.participants
    ? call.participants.filter(p => p.status === 'joined' && p.id !== call.calleeId)
    : [];

  return (
    <AnimatePresence>
      <div 
        id="incoming-call-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 border border-stone-700/60 rounded-3xl p-6 shadow-2xl text-white text-center overflow-hidden"
        >
          {/* Ambient glowing background rings */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Call Type Pill Header */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 animate-pulse">
            {isGroup ? <Users className="w-3.5 h-3.5" /> : isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>{isGroup ? "Appel d'Équipe de Groupe" : isVideo ? 'Appel Vidéo Gratuit' : 'Appel Audio Gratuit'}</span>
          </div>

          {/* Pulsating Colleague Avatar */}
          <div className="relative mx-auto w-24 h-24 my-2 flex items-center justify-center">
            {/* Animated sound ripple rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1.7], opacity: [0.6, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1.5], opacity: [0.8, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border border-emerald-500"
            />

            {call.callerAvatar ? (
              <img
                src={call.callerAvatar}
                alt={call.callerName}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl relative z-10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-emerald-400 shadow-xl relative z-10">
                {inviterName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Caller Details */}
          <div className="mt-4 space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-white line-clamp-1">
              {inviterName}
            </h3>
            <p className="text-xs font-medium text-emerald-400">
              {isGroup 
                ? `Vous invite à rejoindre l'appel en cours`
                : `${call.callerRole || 'Collègue'} • Appel direct interne`
              }
            </p>

            {isGroup && otherParticipants.length > 0 && (
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Avec : {otherParticipants.map(p => p.name).join(', ')}</span>
              </div>
            )}

            <p className="text-xs text-stone-400 pt-1">
              Sonnerie en cours...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {/* Decline Button */}
            <button
              id="btn-decline-incoming-call"
              onClick={() => onReject(call)}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-4 bg-red-500/20 hover:bg-red-500 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white rounded-2xl transition-all duration-200 active:scale-95 shadow-lg group"
            >
              <div className="w-11 h-11 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center text-white shadow-md">
                <PhoneOff className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Refuser</span>
            </button>

            {/* Accept Button */}
            <button
              id="btn-accept-incoming-call"
              onClick={() => onAccept(call)}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-4 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 hover:text-white rounded-2xl transition-all duration-200 active:scale-95 shadow-lg group"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-600 group-hover:bg-emerald-700 flex items-center justify-center text-white shadow-md animate-bounce">
                {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <span className="text-xs font-semibold">Rejoindre</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
