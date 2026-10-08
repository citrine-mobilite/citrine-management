import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Activity, ArrowLeft, LogOut } from 'lucide-react';
import { AppUser, ConnectionLog } from '../types';
import { subscribeToConnectionLogs } from '../services/connectionLogService';
import { ProfileInfoSubTab } from './profile/ProfileInfoSubTab';
import { ProfileSecuritySubTab } from './profile/ProfileSecuritySubTab';
import { ProfileActivitySubTab } from './profile/ProfileActivitySubTab';
import { ProfilePermissionsSubTab } from './profile/ProfilePermissionsSubTab';

interface ProfilePageProps {
  currentUser: AppUser;
  onBackToDashboard: () => void;
  onLogout: () => void;
  onAddNotification: (notif: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ProfilePage({
  currentUser,
  onBackToDashboard,
  onLogout,
  onAddNotification,
  showToast,
}: ProfilePageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'security' | 'activity' | 'permissions'>('info');
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

  useEffect(() => {
    const unsub = subscribeToConnectionLogs((logs) => {
      setConnectionLogs(logs);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToDashboard}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer"
            title="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#2A7B76] text-white flex items-center justify-center font-bold text-lg font-serif shadow-xs overflow-hidden">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{currentUser.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-stone-900">{currentUser.name}</h1>
            <p className="text-xs text-stone-500">
              {currentUser.email} • <span className="capitalize text-[#2A7B76] font-bold">{currentUser.role}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border border-red-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Subtabs selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100/80 rounded-2xl border border-stone-200/80">
        {[
          { id: 'info', label: 'Informations', icon: User },
          { id: 'security', label: 'Sécurité & Mot de passe', icon: Lock },
          { id: 'activity', label: 'Activité & Connexions', icon: Activity },
          { id: 'permissions', label: 'Permissions & Rôle', icon: Shield },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#2A7B76] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? 'text-emerald-200' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab content container */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm">
        {activeSubTab === 'info' && (
          <ProfileInfoSubTab
            currentUser={currentUser}
            onAddNotification={onAddNotification}
            showToast={showToast}
          />
        )}
        {activeSubTab === 'security' && (
          <ProfileSecuritySubTab
            currentUser={currentUser}
            showToast={showToast}
          />
        )}
        {activeSubTab === 'activity' && (
          <ProfileActivitySubTab
            connectionLogs={connectionLogs}
            currentUserEmail={currentUser.email}
          />
        )}
        {activeSubTab === 'permissions' && (
          <ProfilePermissionsSubTab currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}
