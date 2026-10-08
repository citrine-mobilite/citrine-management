import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { CMLogo } from './CMLogo';
import { AppUser, CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../types';
import { getSidebarCategories } from './navigation/sidebarCategories';
import { SidebarItemButton } from './navigation/SidebarItemButton';
import { SidebarMobileDrawer } from './navigation/SidebarMobileDrawer';

export type TabType = 
  | 'dashboard'
  | 'employee_portal' 
  | 'calls'
  | 'presences' 
  | 'statistics' 
  | 'tasks' 
  | 'reminders' 
  | 'logs' 
  | 'collaborators' 
  | 'discipline'
  | 'documents' 
  | 'communications' 
  | 'finances' 
  | 'inventory'
  | 'partners'
  | 'users'
  | ''
  | 'settings'
  | 'profile';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  unreadRemindersCount: number;
  pendingPresencesRequestsCount?: number;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  currentUser: AppUser | null;
  moduleConfig?: CompanyModuleConfig;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onToggleOpen,
  unreadRemindersCount,
  pendingPresencesRequestsCount = 0,
  mobileMenuOpen,
  onToggleMobileMenu,
  currentUser,
  moduleConfig = DEFAULT_MODULE_CONFIG,
}: SidebarProps) {
  const userRole = currentUser?.role || 'employé';

  const categories = getSidebarCategories({
    userRole,
    moduleConfig,
    unreadRemindersCount,
    pendingPresencesRequestsCount,
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-stone-200/80 bg-white transition-all duration-300 relative z-30 shrink-0 select-none ${
          isOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Sidebar Collapse Toggle */}
        <div className="h-14 border-b border-stone-100 flex items-center justify-end px-3.5 bg-stone-50/40">
          <button
            onClick={onToggleOpen}
            className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            title={isOpen ? 'Réduire le menu' : 'Agrandir le menu'}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              {isOpen && (
                <span className="text-[9px] uppercase font-bold text-stone-400 px-2 tracking-wider">
                  {cat.name}
                </span>
              )}
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <SidebarItemButton
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    isOpen={isOpen}
                    onSelectTab={onSelectTab}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <SidebarMobileDrawer
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
        categories={categories}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />
    </>
  );
}
