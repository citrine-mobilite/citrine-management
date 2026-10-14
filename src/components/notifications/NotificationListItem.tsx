/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Mail, MessageSquare, Clock, CheckCircle2, Circle } from 'lucide-react';
import { NotificationLog } from '../../types';
import { formatExactNotificationDate } from '../../utils/dateUtils';

interface NotificationListItemProps {
  notification: NotificationLog;
  onSelect: (log: NotificationLog) => void;
  onToggleRead?: (id: string) => void;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({ notification, onSelect, onToggleRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(notification)}
      className={`bg-white p-4 rounded-2xl border transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        notification.read ? 'border-stone-200/80 bg-white' : 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200/40'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-2xl shrink-0 border ${notification.read ? 'bg-stone-50 border-stone-200/80' : 'bg-emerald-100 border-emerald-200'}`}>
          {getIcon()}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{notification.title}</h4>
            <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
              Destinataire : {notification.recipient}
            </span>
            {!notification.read && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" /> Non lue
              </span>
            )}
          </div>
          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{notification.content}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        <div
          className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono bg-stone-50 px-2 py-1 rounded-lg border border-stone-200/60"
          data-tooltip={formatExactNotificationDate(notification.timestamp)}
        >
          <Clock className="h-3 w-3 text-[#2A7B76]" />
          <span>
            {new Date(notification.timestamp).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>

        {onToggleRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead(notification.id);
            }}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            title={notification.read ? "Marquer comme non lue" : "Marquer comme lue"}
          >
            {notification.read ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-stone-300" />}
          </button>
        )}
      </div>
    </div>
  );
};
