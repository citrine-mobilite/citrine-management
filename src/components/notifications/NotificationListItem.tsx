import React from 'react';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';
import { NotificationLog } from '../../types';

interface NotificationListItemProps {
  notification: NotificationLog;
  onSelect: (log: NotificationLog) => void;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({ notification, onSelect }) => {
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
      className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-stone-50 rounded-xl shrink-0 border border-stone-100">{getIcon()}</div>

        <div className="min-w-0">
          <h4 className="font-bold text-xs text-stone-900 truncate">{notification.title}</h4>
          <p className="text-[11px] text-stone-500 truncate">{notification.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-stone-400 font-mono">
        <Clock className="h-3 w-3" />
        <span>
          {new Date(notification.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
