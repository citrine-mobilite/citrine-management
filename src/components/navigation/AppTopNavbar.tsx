import React from 'react';
import { Menu, Shield, Smartphone, Bell, Clock, UserCheck, LayoutDashboard, WifiOff } from 'lucide-react';
import { AppUser } from '../../types';
import { TabType } from '../Sidebar';
import { CMLogo } from '../CMLogo';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { haptic } from '../../services/hapticService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { isEmployeeUser } from '../../utils/roleUtils';

interface AppTopNavbarProps {
  currentUser: AppUser | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenProfile: () => void;
  onOpenKioskModal: () => void;
  onToggleMobileMenu: () => void;
  unreadNotificationsCount: number;
  liveTimeString: string;
}

export const AppTopNavbar: React.FC<AppTopNavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onToggleMobileMenu,
  unreadNotificationsCount,
  liveTimeString,
}) => {
  const isEmployee = isEmployeeUser(currentUser);
  const isOnline = useOnlineStatus();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-stone-200/80 px-2.5 sm:px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md bg-white/95">
      {/* Left: Mobile Menu Toggle (Admin only) & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {!isEmployee && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-xl text-stone-600 hover:bg-stone-100 md:hidden transition cursor-pointer shrink-0"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div
          onClick={() => setActiveTab(isEmployee ? 'employee_portal' : 'dashboard')}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none min-w-0"
        >
          <CMLogo size="sm" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-serif font-bold text-xs sm:text-sm text-stone-900 tracking-tight truncate">
              Citrine
            </span>
            <span className="hidden sm:inline font-serif font-bold text-xs sm:text-sm text-stone-900">
              Management
            </span>
            {isEmployee && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#2A7B76]/10 text-[#2A7B76] border border-[#2A7B76]/20 shrink-0">
                Personnel
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg text-[10px] font-bold text-red-700">
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Hors ligne</span>
          </div>
        )}

        {/* Quick Mode Switcher for Admins / Responsables */}
        {!isEmployee && (
          <button
            onClick={() => {
              haptic.light();
              setActiveTab(activeTab === 'employee_portal' ? 'dashboard' : 'employee_portal');
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              activeTab === 'employee_portal'
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-stone-50 text-stone-700 hover:bg-emerald-50 hover:text-[#2A7B76] border-stone-200'
            }`}
            title="Basculer entre la vue Admin et la vue Espace Employé"
          >
            {activeTab === 'employee_portal' ? (
              <>
                <LayoutDashboard className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Retour Admin</span>
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5 text-[#2A7B76]" />
                <span>Espace Personnel</span>
              </>
            )}
          </button>
        )}

        {/* Live Clock Badge (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1 rounded-xl text-xs font-mono font-bold text-stone-700">
          <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
          <span>{liveTimeString}</span>
        </div>

        {/* PWA Install Button (Compact) */}
        <div className="hidden xs:block">
          <PWAInstallButton />
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => setActiveTab('logs')}
          className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition relative cursor-pointer"
          title="Notifications & Alertes"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4A82F] rounded-full animate-ping" />
          )}
        </button>

        {/* User Profile Trigger Button */}
        {currentUser && (
          <button
            onClick={() => {
              haptic.light();
              setActiveTab('profile');
              if (onOpenProfile) onOpenProfile();
            }}
            className={`flex items-center gap-1.5 p-1 sm:p-1.5 pl-1.5 sm:pl-2 rounded-2xl border transition cursor-pointer select-none ${
              activeTab === 'profile'
                ? 'bg-[#2A7B76]/10 border-[#2A7B76]/40 text-[#2A7B76]'
                : 'border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
            title="Mon Profil & Déconnexion"
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="font-bold text-xs text-stone-900 leading-tight truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <span className="text-[9px] text-[#2A7B76] font-bold uppercase tracking-wide">
                {currentUser.role}
              </span>
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#2A7B76] text-white flex items-center justify-center font-bold text-[11px] sm:text-xs overflow-hidden shadow-2xs shrink-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
