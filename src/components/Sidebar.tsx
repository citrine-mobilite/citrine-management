import React from 'react';
import { 
  Clock, 
  Users, 
  Calendar, 
  Bell, 
  FileText, 
  Send, 
  DollarSign, 
  Terminal, 
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  UserCheck,
  BarChart3,
  LayoutDashboard,
  Settings,
  Package,
  Compass,
  PhoneCall,
  Scale,
  Network
} from 'lucide-react';
import { CMLogo } from './CMLogo';
import { AppUser, CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../types';
import { preloadTabModule } from '../utils/preloadModules';

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
  moduleConfig = DEFAULT_MODULE_CONFIG
}: SidebarProps) {

  const userRole = currentUser?.role || 'employé';

  interface SidebarItem {
    id: TabType;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  interface SidebarCategory {
    name: string;
    items: SidebarItem[];
  }

  const categories: SidebarCategory[] = [];

  if (userRole === 'employé') {
    // 1. Vue d'ensemble, Suivi des présences, Statistique assiduité
    const empPresenceItems: SidebarItem[] = [
      {
        id: 'employee_portal' as TabType,
        label: 'Vue d\'ensemble',
        description: 'Mon profil, mes pointages & salaires',
        icon: UserCheck
      },
      {
        id: 'presences' as TabType,
        label: 'Suivi des Présences',
        description: 'Mes pointages et historique',
        icon: Clock,
        badge: pendingPresencesRequestsCount > 0 ? pendingPresencesRequestsCount : undefined
      }
    ];

    if (moduleConfig.enableStatistics !== false) {
      empPresenceItems.push({
        id: 'statistics' as TabType,
        label: 'Statistiques & Assiduité',
        description: 'Mon assiduité & ponctualité',
        icon: BarChart3
      });
    }

    categories.push({
      name: "Pilotage & Présences",
      items: empPresenceItems
    });

    // 2. Tâches et alertes avec Comparateur de tarifs directement en bas
    const empTaskItems: SidebarItem[] = [
      {
        id: 'tasks' as TabType,
        label: 'Tâches & Jalons',
        description: 'Suivi de mes activités',
        icon: Calendar
      },
      {
        id: 'reminders' as TabType,
        label: 'Alertes & Rappels',
        description: 'Mes notifications et rappels',
        icon: Bell,
        badge: unreadRemindersCount > 0 ? unreadRemindersCount : undefined
      }
    ];

    categories.push({
      name: "Tâches & Alertes",
      items: empTaskItems
    });

    // 3. Autres onglets
    const empOtherItems: SidebarItem[] = [];

    if (moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false) {
      empOtherItems.push({
        id: 'calls' as TabType,
        label: "Appels d'Équipe",
        description: 'Appels audio/vidéo gratuits',
        icon: PhoneCall
      });
    }

    if (moduleConfig.enableInventory) {
      empOtherItems.push({
        id: 'inventory' as TabType,
        label: 'Inventaire & Matériel',
        description: 'Consulter le matériel & emplacements',
        icon: Package
      });
    }

    if (empOtherItems.length > 0) {
      categories.push({
        name: "Autres Onglets",
        items: empOtherItems
      });
    }
  }

  if (userRole === 'responsable' || userRole === 'administrateur') {
    // 1. Vue d'ensemble, Suivi des présences, Statistique assiduité
    const mgrPresenceItems: SidebarItem[] = [
      {
        id: 'dashboard' as TabType,
        label: 'Vue d\'ensemble',
        description: 'Tableau de bord global & KPIs',
        icon: LayoutDashboard
      },
      {
        id: 'presences' as TabType,
        label: 'Suivi des Présences',
        description: 'Pointages et statut quotidien',
        icon: Clock,
        badge: pendingPresencesRequestsCount > 0 ? pendingPresencesRequestsCount : undefined
      }
    ];

    if (moduleConfig.enableStatistics !== false) {
      mgrPresenceItems.push({
        id: 'statistics' as TabType,
        label: 'Statistiques & Assiduité',
        description: 'Analyse d\'assiduité & reporting',
        icon: BarChart3
      });
    }

    categories.push({
      name: "Pilotage & Présences",
      items: mgrPresenceItems
    });

    // 2. Tâches et alertes avec Comparateur de tarifs directement en bas
    const mgrTaskItems: SidebarItem[] = [
      {
        id: 'tasks' as TabType,
        label: 'Tâches & Jalons',
        description: 'Suivi des activités de l\'équipe',
        icon: Calendar
      },
      {
        id: 'reminders' as TabType,
        label: 'Alertes & Rappels',
        description: 'Délais légaux et notifications',
        icon: Bell,
        badge: unreadRemindersCount > 0 ? unreadRemindersCount : undefined
      }
    ];

    categories.push({
      name: "Tâches & Alertes",
      items: mgrTaskItems
    });

    // 3. Enfin les autres onglets
    const otherItems: SidebarItem[] = [
      {
        id: 'collaborators' as TabType,
        label: 'Collaborateurs',
        description: 'Annuaire et fiches équipe',
        icon: Users
      }
    ];

    if (moduleConfig.enableDiscipline !== false) {
      otherItems.push({
        id: 'discipline' as TabType,
        label: 'Discipline & Sanctions',
        description: 'Registre des incidents & sanctions',
        icon: Scale
      });
    }

    if (moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false) {
      otherItems.push({
        id: 'calls' as TabType,
        label: "Appels d'Équipe",
        description: 'VoIP gratuit audio & vidéo',
        icon: PhoneCall
      });
    }

    if (moduleConfig.enableCommunications) {
      otherItems.push({
        id: 'communications' as TabType,
        label: 'Communications',
        description: 'Messages internes et alertes',
        icon: Send
      });
    }
    if (moduleConfig.enableDocuments) {
      otherItems.push({
        id: 'documents' as TabType,
        label: 'Procédures & Docs',
        description: 'Génération de contrats et fiches',
        icon: FileText
      });
    }
    if (moduleConfig.enableFinances) {
      otherItems.push({
        id: 'finances' as TabType,
        label: 'Finances & Salaires',
        description: 'Fiches de paie et charges',
        icon: DollarSign
      });
    }
    if (moduleConfig.enableInventory) {
      otherItems.push({
        id: 'inventory' as TabType,
        label: 'Gestion des Inventaires',
        description: 'Matériel, état, quantité & lieux',
        icon: Package
      });
    }
    if (moduleConfig.enablePartners) {
      otherItems.push({
        id: 'partners' as TabType,
        label: 'Gestion des Partenaires',
        description: 'Motomen, taximen, prestataires...',
        icon: Users
      });
    }
    if (moduleConfig.enableLogs) {
      otherItems.push({
        id: 'logs' as TabType,
        label: 'Registre des notifications',
        description: 'Historique et traçabilité des alertes',
        icon: Terminal
      });
    }

    if (userRole === 'administrateur') {
      otherItems.push({
        id: 'users' as TabType,
        label: 'Gestion Utilisateurs',
        description: 'Comptes et accès portail',
        icon: Shield
      });
    }

    otherItems.push({
      id: 'settings' as TabType,
      label: 'Paramètres & Configuration',
      description: 'Horaires, retards, salaires & QR code',
      icon: Settings
    });

    categories.push({
      name: "Autres Onglets",
      items: otherItems
    });
  }


  return (
    <>
      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          onClick={onToggleMobileMenu}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container - Élevée vers le haut pour accès direct */}
      <aside 
        className={`
          fixed md:sticky top-0 md:top-14 z-50 md:z-30 h-full md:h-[calc(100vh-3.5rem)]
          bg-white border-r border-stone-200 shadow-none
          flex flex-col transition-all duration-300 ease-in-out shrink-0
          ${isOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top Header of Sidebar - Compact pour monter la navigation */}
        <div className="py-2 px-3 border-b border-stone-200/80 flex items-center justify-between shrink-0 bg-stone-50/50">
          {/* Mobile-only Logo and Brand */}
          <div className="flex md:hidden items-center gap-2.5 overflow-hidden cursor-pointer" onClick={() => onSelectTab(currentUser?.role === 'employé' ? 'employee_portal' : 'dashboard') }>
            <CMLogo variant="icon" className="h-8 w-8 drop-shadow-2xs shrink-0" />
            <div className="leading-none whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-serif font-bold text-stone-900 tracking-tight">
                  Citrine <span className="text-emerald-700 italic font-medium">Management</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop minimal title or indicator */}
          <div className="hidden md:flex items-center gap-2 overflow-hidden">
            {isOpen ? (
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
                Navigation
              </span>
            ) : (
              <span className="text-[9px] font-bold text-stone-400 mx-auto">
                Menu
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleOpen}
            className="hidden md:flex p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition shrink-0 cursor-pointer"
            title={isOpen ? "Réduire le menu" : "Agrandir le menu"}
          >
            {isOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition shrink-0 cursor-pointer"
            title="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto pt-1.5 pb-3 px-2 space-y-2">
          {categories.map((cat, catIdx) => (
            <div key={cat.name} className="space-y-1">
              {isOpen ? (
                <div className={`text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2.5 py-1 ${catIdx > 0 ? 'border-t border-stone-100 pt-3 mt-2' : ''}`}>
                  {cat.name}
                </div>
              ) : (
                catIdx > 0 && <div className="border-t border-stone-200 my-2" />
              )}

              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                let hoverTimer: any = null;

                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => {
                      hoverTimer = setTimeout(() => {
                        preloadTabModule(item.id);
                      }, 80);
                    }}
                    onMouseLeave={() => {
                      if (hoverTimer) clearTimeout(hoverTimer);
                    }}
                    onClick={() => {
                      if (hoverTimer) clearTimeout(hoverTimer);
                      preloadTabModule(item.id);
                      onSelectTab(item.id);
                      if (mobileMenuOpen) onToggleMobileMenu();
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    title={!isOpen ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-xs transition cursor-pointer relative group
                      ${isActive 
                        ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                        : 'text-stone-600 hover:bg-emerald-50/70 hover:text-emerald-900'
                      }
                      ${!isOpen ? 'justify-center px-0' : ''}
                    `}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 transition ${isActive ? 'bg-emerald-700/50 text-white' : 'text-stone-500 group-hover:text-emerald-700'}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {isOpen ? (
                      <div className="flex-1 text-left overflow-hidden flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {item.badge !== undefined && (
                          <span className="absolute top-1 right-1.5 bg-emerald-600 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border border-white">
                            {item.badge}
                          </span>
                        )}
                        {/* Tooltip on collapse hover */}
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-stone-900 text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 font-medium">
                          {item.label}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info inside sidebar */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/50 shrink-0">
          {isOpen ? (
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Portail Sécurisé</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                En ligne
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Session sécurisée en ligne">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
