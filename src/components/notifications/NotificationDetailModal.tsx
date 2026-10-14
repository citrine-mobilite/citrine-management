import React from 'react';
import { X, Clock, Bell, Mail, MessageSquare, ShieldCheck, CheckCircle2, Circle, ExternalLink, User, Send } from 'lucide-react';
import { NotificationLog } from '../../types';
import { formatExactNotificationDate, formatExactTimeWithSeconds } from '../../utils/dateUtils';
import { HeroIconLogo } from '../CMLogo';

interface NotificationDetailModalProps {
  notification: NotificationLog | null;
  onClose: () => void;
  onToggleRead?: (id: string) => void;
  onNavigate?: (linkOrTab: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  onToggleRead,
  onNavigate,
}) => {
  if (!notification) return null;

  const exactDateStr = formatExactNotificationDate(notification.timestamp);
  const exactTimeStr = formatExactTimeWithSeconds(notification.timestamp);

  const getChannelBadge = () => {
    switch (notification.type) {
      case 'whatsapp':
        return {
          icon: <MessageSquare className="h-4 w-4 text-emerald-600" />,
          label: 'WhatsApp Cloud API',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'email':
        return {
          icon: <Mail className="h-4 w-4 text-blue-600" />,
          label: 'Email SMTP / Resend',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-amber-600" />,
          label: 'Push & Alerte Système',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
    }
  };

  const channel = getChannelBadge();

  // Parse payload if json
  let parsedPayload: any = null;
  if (notification.payload) {
    try {
      parsedPayload = typeof notification.payload === 'string' ? JSON.parse(notification.payload) : notification.payload;
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Luxury Brand Accent */}
        <div className="bg-gradient-to-r from-[#2A7B76] via-emerald-800 to-[#2A7B76] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <HeroIconLogo size={24} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                Détail de la Notification Push
              </span>
              <h3 className="font-serif font-bold text-base text-white truncate max-w-[280px] sm:max-w-sm">
                {notification.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Horodatage officiel à la seconde près */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#2A7B76]" /> Horodatage Certifié (à la seconde près)
              </span>
              <span className="text-[10px] font-mono font-bold bg-white dark:bg-stone-800 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                {exactTimeStr}
              </span>
            </div>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {exactDateStr}
            </p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
              ISO: {notification.timestamp}
            </p>
          </div>

          {/* Badges Info */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${channel.bg}`}>
              {channel.icon}
              <span>{channel.label}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>Destinataire : <strong>{notification.recipient}</strong></span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
              notification.read
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {notification.read ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-amber-600" />}
              <span>{notification.read ? 'Statut : Lue' : 'Statut : Non lue'}</span>
            </div>
          </div>

          {/* Corps du message */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-2">
              Contenu du message diffusé :
            </label>
            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm leading-relaxed whitespace-pre-wrap select-text">
              {notification.content}
            </div>
          </div>

          {/* Détails techniques si présents */}
          {parsedPayload && (
            <div className="bg-stone-100/70 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                Métadonnées de l'opération
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsedPayload.actorName && (
                  <div>
                    <span className="text-stone-400 text-[10px] block">Auteur :</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">{parsedPayload.actorName}</span>
                  </div>
                )}
                {parsedPayload.actionType && (
                  <div>
                    <span className="text-stone-400 text-[10px] block">Type d'action :</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">{parsedPayload.actionType}</span>
                  </div>
                )}
                {parsedPayload.collection && (
                  <div>
                    <span className="text-stone-400 text-[10px] block">Module / Entité :</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">{parsedPayload.collection}</span>
                  </div>
                )}
                {parsedPayload.itemId && (
                  <div>
                    <span className="text-stone-400 text-[10px] block">Identifiant :</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200 truncate block">{parsedPayload.itemId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/70 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onToggleRead && (
              <button
                type="button"
                onClick={() => {
                  onToggleRead(notification.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 text-xs font-semibold text-stone-700 dark:text-stone-200 transition cursor-pointer flex items-center gap-1.5"
              >
                {notification.read ? <Circle className="h-3.5 w-3.5 text-stone-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                <span>{notification.read ? 'Marquer non lue' : 'Marquer comme lue'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {notification.link && onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate(notification.link!);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2A7B76] to-emerald-800 hover:from-[#23635f] hover:to-emerald-900 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Accéder au module</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
