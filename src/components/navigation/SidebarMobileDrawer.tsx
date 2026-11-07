import React from 'react';
import { X } from 'lucide-react';
import { CMLogo } from '../CMLogo';
import { TabType } from '../Sidebar';
import { SidebarCategory } from './sidebarCategories';
import { SidebarItemButton } from './SidebarItemButton';
import { HumaanDashboardHero } from '../illustrations/HumaanIllustrations';

interface SidebarMobileDrawerProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onClose?: () => void;
  categories: SidebarCategory[];
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const SidebarMobileDrawer: React.FC<SidebarMobileDrawerProps> = ({
  mobileMenuOpen,
  onToggleMobileMenu,
  onClose,
  categories,
  activeTab,
  onSelectTab,
}) => {
  if (!mobileMenuOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onToggleMobileMenu();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop with frosted dark veil */}
      <div
        className="fixed inset-0 bg-stone-950/45 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer Panel in Frosted Glass */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full glass-drawer-panel z-10">
        <div className="p-4 border-b border-white/70 flex flex-col items-center gap-3 bg-white/50 backdrop-blur-md">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CMLogo size="sm" />
              <span className="font-serif font-bold text-sm text-stone-900 tracking-tight">Menu Principal</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-white/80 text-stone-700 transition cursor-pointer glass-chip"
              aria-label="Fermer le menu"
              title="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="w-full bg-gradient-to-r from-[#2A7B76]/15 to-emerald-500/15 rounded-2xl p-3 flex items-center justify-center border border-white/60">
            <HumaanDashboardHero className="w-40 h-24" />
          </div>
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
                      handleClose();
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
