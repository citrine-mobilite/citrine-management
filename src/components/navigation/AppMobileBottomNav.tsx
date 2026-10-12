import React from 'react';
import { LayoutDashboard, UserCheck, Clock, Calendar, Menu, User } from 'lucide-react';
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

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Pour un employé : uniquement Mon Espace et Mon Profil (avec déconnexion)
  if (isEmployee) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#2A7B76]/20 px-4 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-xl sm:hidden">
        {/* Espace Personnel / Pointage */}
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('employee_portal');
            scrollToTop();
          }}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition cursor-pointer ${
            activeTab === 'employee_portal'
              ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserCheck className="h-5 w-5" />
          <span className="text-[11px] font-bold">Mon Espace</span>
        </button>

        {/* Mon Profil & Déconnexion */}
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('profile');
            scrollToTop();
          }}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <User className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold">Mon Profil</span>
        </button>
      </div>
    );
  }

  // Pour les administrateurs et responsables
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#2A7B76]/20 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-xl sm:hidden">
      {/* Dashboard / Accueil */}
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

      {/* Espace Employé / Pointage */}
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

      {/* Profil & Déconnexion */}
      <button
        onClick={() => {
          haptic.light();
          setActiveTab('profile');
          scrollToTop();
        }}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-[#2A7B76]/10 text-[#2A7B76] font-bold border border-[#2A7B76]/30 shadow-2xs'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <User className="h-4 w-4" />
        <span className="text-[9px]">Profil</span>
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
