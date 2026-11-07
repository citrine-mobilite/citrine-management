import React from 'react';
import { X } from 'lucide-react';
import { CMLogo } from '../CMLogo';
import { TabType } from '../Sidebar';
import { SidebarCategory } from './sidebarCategories';
import { SidebarItemButton } from './SidebarItemButton';

interface SidebarMobileDrawerProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  categories: SidebarCategory[];
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const SidebarMobileDrawer: React.FC<SidebarMobileDrawerProps> = ({
  mobileMenuOpen,
  onToggleMobileMenu,
  categories,
  activeTab,
  onSelectTab,
}) => {
  if (!mobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop with frosted dark veil */}
      <div
        className="fixed inset-0 bg-stone-950/45 backdrop-blur-md transition-opacity"
        onClick={onToggleMobileMenu}
      />

      {/* Drawer Panel in Frosted Glass */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full glass-drawer-panel z-10">
        <div className="p-4 border-b border-white/70 flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CMLogo size="sm" />
            <span className="font-serif font-bold text-sm text-stone-900 tracking-tight">Menu Principal</span>
          </div>
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-xl hover:bg-white/80 text-stone-700 transition cursor-pointer glass-chip"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-20">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 px-3 tracking-wider">
                {cat.name}
              </span>
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <SidebarItemButton
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    isOpen={true}
                    onSelectTab={(tab) => {
                      onSelectTab(tab);
                      onToggleMobileMenu();
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
