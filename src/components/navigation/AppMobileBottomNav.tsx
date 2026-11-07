import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UserCheck, Clock, Calendar, Menu, User, Bell } from 'lucide-react';
import { TabType } from '../Sidebar';
import { AppUser } from '../../types';
import { haptic } from '../../services/hapticService';
import { isEmployeeUser } from '../../utils/roleUtils';

interface AppMobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: AppUser | null;
  setMobileMenuOpen: (open: boolean) => void;
}

export const AppMobileBottomNav: React.FC<AppMobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setMobileMenuOpen,
}) => {
  const isEmployee = isEmployeeUser(currentUser);
  const [mobileUnreadCount, setMobileUnreadCount] = useState<number>(0);

  useEffect(() => {
    const handleAlertsUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ unreadCount: number }>;
      if (typeof custom.detail?.unreadCount === 'number') {
        setMobileUnreadCount(custom.detail.unreadCount);
      }
    };
    window.addEventListener('citrine:alerts_read_updated', handleAlertsUpdate);
    return () => window.removeEventListener('citrine:alerts_read_updated', handleAlertsUpdate);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Pour un employé : uniquement Mon Espace, Alertes et Mon Profil (avec déconnexion)
  if (isEmployee) {
    return (
      <nav 
        aria-label="Navigation principale mobile"
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 max-w-sm mx-auto z-40 ios-island-dock px-2.5 py-1.5 flex items-center justify-around sm:hidden"
      >
        {/* Espace Personnel / Pointage */}
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('employee_portal');
            scrollToTop();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'employee_portal' && (typeof window === 'undefined' || !window.location.hash.includes('alerts'))
              ? 'ios-dock-pill-active text-[#2A7B76]'
              : 'text-stone-600 hover:text-stone-950 active:bg-white/30'
          }`}
        >
          <UserCheck className="h-4.5 w-4.5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Mon Espace</span>
        </button>

        {/* Mes Alertes & Notifications */}
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('employee_portal');
            if (typeof window !== 'undefined') {
              window.location.hash = '#employee/alerts';
              window.dispatchEvent(new CustomEvent('citrine:switch_employee_subtab', { detail: { subtab: 'alerts' } }));
            }
            scrollToTop();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer relative active:scale-90 ${
            activeTab === 'employee_portal' && typeof window !== 'undefined' && window.location.hash.includes('alerts')
              ? 'ios-dock-pill-active text-[#2A7B76]'
              : 'text-stone-600 hover:text-stone-950 active:bg-white/30'
          }`}
        >
          <div className="relative">
            <Bell className="h-4.5 w-4.5 stroke-[2.2]" />
            {mobileUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 min-w-[15px] h-3.5 bg-[#FF3B30] text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono shadow-sm">
                {mobileUnreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Alertes</span>
        </button>

        {/* Mon Profil & Déconnexion */}
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('profile');
            scrollToTop();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'profile'
              ? 'ios-dock-pill-active text-[#2A7B76]'
              : 'text-stone-600 hover:text-stone-950 active:bg-white/30'
          }`}
        >
          <User className="h-4.5 w-4.5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Profil</span>
        </button>
      </nav>
    );
  }

  // Pour les administrateurs et responsables
  return (
    <nav 
      aria-label="Navigation principale mobile"
      className="fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 max-w-md mx-auto z-40 ios-island-dock px-1.5 py-1.5 flex items-center justify-between sm:hidden"
    >
      {/* Dashboard / Accueil */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('dashboard');
          scrollToTop();
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'dashboard'
            ? 'ios-dock-pill-active text-[#2A7B76]'
            : 'text-stone-600 hover:text-stone-950'
        }`}
      >
        <LayoutDashboard className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Tableau</span>
      </button>

      {/* Espace Employé / Pointage */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('employee_portal');
          scrollToTop();
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'employee_portal'
            ? 'ios-dock-pill-active text-[#2A7B76]'
            : 'text-stone-600 hover:text-stone-950'
        }`}
      >
        <UserCheck className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Espace</span>
      </button>

      {/* Présences */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('presences');
          scrollToTop();
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'presences'
            ? 'ios-dock-pill-active text-[#2A7B76]'
            : 'text-stone-600 hover:text-stone-950'
        }`}
      >
        <Clock className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Présences</span>
      </button>

      {/* Tâches */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('tasks');
          scrollToTop();
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'tasks'
            ? 'ios-dock-pill-active text-[#2A7B76]'
            : 'text-stone-600 hover:text-stone-950'
        }`}
      >
        <Calendar className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Tâches</span>
      </button>

      {/* Profil & Déconnexion */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('profile');
          scrollToTop();
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'profile'
            ? 'ios-dock-pill-active text-[#2A7B76]'
            : 'text-stone-600 hover:text-stone-950'
        }`}
      >
        <User className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Profil</span>
      </button>

      {/* Plus Menu */}
      <button
        onClick={() => {
          haptic.light();
          setMobileMenuOpen(true);
        }}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full text-stone-600 hover:text-stone-950 transition-all duration-200 cursor-pointer active:scale-90"
      >
        <Menu className="h-4 w-4 stroke-[2.2]" />
        <span className="text-[9px] font-bold tracking-tight">Plus</span>
      </button>
    </nav>
  );
};
