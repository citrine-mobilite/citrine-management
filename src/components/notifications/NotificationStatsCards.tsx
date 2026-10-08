import React from 'react';
import { Bell, Mail, MessageSquare, Database } from 'lucide-react';
import { NotificationLog } from '../../types';

interface NotificationStatsCardsProps {
  notifications: NotificationLog[];
}

export const NotificationStatsCards: React.FC<NotificationStatsCardsProps> = ({ notifications }) => {
  const total = notifications.length;
  const whatsapp = notifications.filter((n) => n.type === 'whatsapp').length;
  const email = notifications.filter((n) => n.type === 'email').length;
  const system = notifications.filter((n) => n.type === 'system').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Journaux</span>
          <Database className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">WhatsApp</span>
          <MessageSquare className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{whatsapp}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Email</span>
          <Mail className="h-4 w-4 text-blue-600" />
        </div>
        <p className="text-xl font-bold text-blue-700 mt-1">{email}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Système</span>
          <Bell className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{system}</p>
      </div>
    </div>
  );
};
