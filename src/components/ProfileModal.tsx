import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Activity, X, LogOut } from 'lucide-react';
import { AppUser, ConnectionLog } from '../types';
import { subscribeToConnectionLogs } from '../services/connectionLogService';
import { ProfileInfoSubTab } from './profile/ProfileInfoSubTab';
import { ProfileSecuritySubTab } from './profile/ProfileSecuritySubTab';
import { ProfileActivitySubTab } from './profile/ProfileActivitySubTab';
import { ProfilePermissionsSubTab } from './profile/ProfilePermissionsSubTab';

interface ProfileModalProps {
  currentUser: AppUser;
  onClose: () => void;
  onLogout: () => void;
  onAddNotification: (notif: any) => void;
}

export default function ProfileModal({
  currentUser,
  onClose,
  onLogout,
  onAddNotification,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity' | 'permissions'>('info');
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

  useEffect(() => {
    const unsub = subscribeToConnectionLogs((logs) => {
      setConnectionLogs(logs);
    });
    return () => unsub();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{currentUser.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm leading-tight">{currentUser.name}</h3>
              <p className="text-[10px] text-emerald-100">{currentUser.email} • {currentUser.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-2.5 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Quitter</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Subtabs selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-stone-100 border-b border-stone-200">
          {[
            { id: 'info', label: 'Profil', icon: User },
            { id: 'security', label: 'Mot de passe', icon: Lock },
            { id: 'activity', label: 'Connexions', icon: Activity },
            { id: 'permissions', label: 'Rôles & Droits', icon: Shield },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2A7B76] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <TabIcon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-200' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'info' && (
            <ProfileInfoSubTab
              currentUser={currentUser}
              onAddNotification={onAddNotification}
            />
          )}
          {activeTab === 'security' && (
            <ProfileSecuritySubTab currentUser={currentUser} />
          )}
          {activeTab === 'activity' && (
            <ProfileActivitySubTab
              connectionLogs={connectionLogs}
              currentUserEmail={currentUser.email}
            />
          )}
          {activeTab === 'permissions' && (
            <ProfilePermissionsSubTab currentUser={currentUser} />
          )}
        </div>
      </div>
    </div>
  );
}
