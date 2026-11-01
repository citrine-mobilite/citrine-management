import React from 'react';
import { X, Clock, Bell, Mail, MessageSquare, CheckCircle2, Circle, ExternalLink, User } from 'lucide-react';
import { NotificationLog } from '../../types';
import { formatExactNotificationDate, formatExactTimeWithSeconds } from '../../utils/dateUtils';

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
          icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />,
          label: 'WhatsApp Cloud API',
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
        };
      case 'email':
        return {
          icon: <Mail className="h-3.5 w-3.5 text-blue-600" />,
          label: 'Email SMTP / Resend',
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
        };
      default:
        return {
          icon: <Bell className="h-3.5 w-3.5 text-amber-600" />,
          label: 'Push & Alerte Système',
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Material Header: White surface, official logo, dark typography */}
        <div className="bg-white dark:bg-stone-900 px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-stone-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/citrine-logo.png" alt="Citrine" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                Détail de la notification
              </span>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[280px] sm:max-w-sm">
                {notification.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto bg-white dark:bg-stone-900">
          {/* Horodatage officiel Material Design */}
          <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-stone-500" /> Horodatage exact
              </span>
              <span className="text-[11px] font-mono font-medium bg-white dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 shadow-2xs">
                {exactTimeStr}
              </span>
            </div>
            <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
              {exactDateStr}
            </p>
          </div>

          {/* Badges Info */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${channel.bg}`}>
              {channel.icon}
              <span>{channel.label}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>Destinataire : <strong>{notification.recipient}</strong></span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              notification.read
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {notification.read ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-amber-600" />}
              <span>{notification.read ? 'Lue' : 'Non lue'}</span>
            </div>
          </div>

          {/* Corps du message */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              Message :
            </label>
            <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs leading-relaxed whitespace-pre-wrap select-text">
              {notification.content}
            </div>
          </div>

          {/* Détails techniques si présents */}
          {parsedPayload && (
            <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200/70 dark:border-stone-700 space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">
                Métadonnées de l'opération
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsedPayload.actorName && (
                  <div>
                    <span className="text-stone-400 text-[10px] block">Auteur :</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">{parsedPayload.actorName}</span>
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
                    <span className="text-stone-400 text-[10px] block">Module :</span>
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

        {/* Footer Actions Material Design */}
        <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/70 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <div>
            {onToggleRead && (
              <button
                type="button"
                onClick={() => {
                  onToggleRead(notification.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-200 transition cursor-pointer flex items-center gap-1.5"
              >
                {notification.read ? <Circle className="h-3.5 w-3.5 text-stone-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                <span>{notification.read ? 'Marquer non lue' : 'Marquer lue'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-medium transition cursor-pointer"
            >
              Fermer
            </button>
            {notification.link && onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate(notification.link!);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-medium transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Consulter</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
