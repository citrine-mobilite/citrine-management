import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Clock, 
  Layers, 
  Users, 
  ShieldCheck, 
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CompanyModuleConfig, Employee, Presence, NotificationLog } from '../types';
import { CompanyIdentitySettings } from './settings/CompanyIdentitySettings';
import { CompanyScheduleSettings } from './settings/CompanyScheduleSettings';
import { CompanyModulesToggle } from './settings/CompanyModulesToggle';
import { DisciplinaryMotifsManagementSection } from './settings/DisciplinaryMotifsManagementSection';
import { SecuritySettingsSection } from './settings/SecuritySettingsSection';
import { DatabaseRebuildSection } from './settings/DatabaseRebuildSection';

interface CompanySettingsPanelProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  employeeCount?: number;
  employees?: Employee[];
  presences?: Presence[];
  onUpdatePresences?: (presences: Presence[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  initialTab?: SettingsTabId;
}

export type SettingsTabId = 'identity' | 'schedules' | 'modules' | 'discipline' | 'security' | 'database';

interface TabItem {
  id: SettingsTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SETTINGS_TABS: TabItem[] = [
  {
    id: 'identity',
    label: 'Identité & Entreprise',
    shortLabel: 'Entreprise',
    description: 'Logo en BD, mentions légales et siège',
    icon: Building2,
    badge: 'Officiel',
  },
  {
    id: 'schedules',
    label: 'Horaires & Pointage',
    shortLabel: 'Horaires',
    description: 'Arrivée, seuils de retard, pause & GPS',
    icon: Clock,
    badge: 'Temps',
  },
  {
    id: 'modules',
    label: 'Modules & Services',
    shortLabel: 'Modules',
    description: 'Activation sélective des modules',
    icon: Layers,
    badge: 'Architecture',
  },
  {
    id: 'discipline',
    label: 'Règles RH & Motifs',
    shortLabel: 'Règles RH',
    description: 'Catalogue des sanctions et barèmes',
    icon: Users,
    badge: 'Discipline',
  },
  {
    id: 'security',
    label: 'Sécurité & Accès',
    shortLabel: 'Sécurité',
    description: 'Bornes QR, Wi-Fi agréé et adresses IP',
    icon: ShieldCheck,
    badge: 'Chiffré',
  },
  {
    id: 'database',
    label: 'Base de Données',
    shortLabel: 'Maintenance',
    description: 'Santé Firestore & reconstruction',
    icon: Database,
    badge: 'Firestore',
  },
];

export default function CompanySettingsPanel({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
  initialTab = 'identity',
}: CompanySettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  const currentTabInfo = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Bannière principale */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <Settings className="h-5 w-5 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl md:text-2xl">
              Paramètres & Configuration de l'Entreprise
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90 pl-1 max-w-2xl">
            Gestion cloisonnée par domaines d'activité. Chaque onglet possède son périmètre fonctionnel et son enregistrement indépendant.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-black/20 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-emerald-100">Synchronisé avec Firestore</span>
        </div>
      </div>

      {/* Barre de Navigation par Onglets Thématiques (Nav Tabs) */}
      <div className="bg-white p-2 sm:p-2.5 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2A7B76] text-white shadow-md shadow-[#2A7B76]/20 font-bold'
                    : 'bg-stone-50/70 hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <div className="text-left flex flex-col">
                  <span className="leading-tight">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full uppercase tracking-wider font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-200/70 text-stone-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Domaine Thématique Actif (Contenu Cloisonné) */}
      <div className="transition-all duration-200">
        {activeTab === 'identity' && (
          <CompanyIdentitySettings
            moduleConfig={moduleConfig}
            onUpdateModuleConfig={onUpdateModuleConfig}
            showToast={showToast}
          />
        )}

        {activeTab === 'schedules' && (
          <CompanyScheduleSettings
            moduleConfig={moduleConfig}
            onUpdateModuleConfig={onUpdateModuleConfig}
            showToast={showToast}
          />
        )}

        {activeTab === 'modules' && (
          <CompanyModulesToggle
            moduleConfig={moduleConfig}
            onUpdateModuleConfig={onUpdateModuleConfig}
            showToast={showToast}
          />
        )}

        {activeTab === 'discipline' && (
          <DisciplinaryMotifsManagementSection showToast={showToast} />
        )}

        {activeTab === 'security' && (
          <SecuritySettingsSection
            moduleConfig={moduleConfig}
            onUpdateModuleConfig={onUpdateModuleConfig}
            showToast={showToast}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseRebuildSection showToast={showToast} />
        )}
      </div>
    </div>
  );
}
