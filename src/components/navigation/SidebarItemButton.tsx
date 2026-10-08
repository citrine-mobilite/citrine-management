import React from 'react';
import { TabType } from '../Sidebar';
import { SidebarItem } from './sidebarCategories';

interface SidebarItemButtonProps {
  item: SidebarItem;
  isActive: boolean;
  isOpen: boolean;
  onSelectTab: (tab: TabType) => void;
}

export const SidebarItemButton: React.FC<SidebarItemButtonProps> = ({
  item,
  isActive,
  isOpen,
  onSelectTab,
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onSelectTab(item.id)}
      title={!isOpen ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative cursor-pointer ${
        isActive
          ? 'bg-[#2A7B76] text-white shadow-xs font-bold'
          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
      } ${!isOpen ? 'justify-center px-2' : ''}`}
    >
      <div className="relative shrink-0">
        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-900'}`} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#D4A82F] text-stone-900 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between">
            <span className="truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#D4A82F]/20 text-amber-800'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
