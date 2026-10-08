import React from 'react';
import { LayoutDashboard, UserCheck, Clock, Calendar, Menu } from 'lucide-react';
import { TabType } from '../Sidebar';
import { AppUser } from '../../types';
import { haptic } from '../../services/hapticService';

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
  const isEmployee = currentUser?.role === 'employé';

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#2A7B76]/20 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-xl sm:hidden">
      {/* Dashboard / Accueil */}
      {!isEmployee ? (
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('dashboard');
            scrollToTop();
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[9px]">Tableau</span>
        </button>
      ) : null}

      {/* Espace Employé / Pointage (Always accessible even if admin!) */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('employee_portal');
          scrollToTop();
        }}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
          activeTab === 'employee_portal'
            ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <UserCheck className="h-4 w-4" />
        <span className="text-[9px]">Mon Espace</span>
      </button>

      {/* Présences */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('presences');
          scrollToTop();
        }}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
          activeTab === 'presences'
            ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="text-[9px]">Présences</span>
      </button>

      {/* Tâches */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('tasks');
          scrollToTop();
        }}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
          activeTab === 'tasks'
            ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Calendar className="h-4 w-4" />
        <span className="text-[9px]">Tâches</span>
      </button>

      {/* Plus Menu */}
      <button
        onClick={() => {
          haptic.light();
          setMobileMenuOpen(true);
        }}
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-stone-500 hover:text-stone-800 transition cursor-pointer"
      >
        <Menu className="h-4 w-4" />
        <span className="text-[9px]">Plus...</span>
      </button>
    </div>
  );
};
