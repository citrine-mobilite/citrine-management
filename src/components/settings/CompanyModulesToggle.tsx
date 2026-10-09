import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Clock, 
  Users, 
  Calendar, 
  Bell, 
  DollarSign, 
  FileText, 
  Send, 
  Package, 
  Network, 
  PhoneCall, 
  ShieldAlert, 
  Compass, 
  Terminal, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Settings,
  UserPlus,
  Receipt,
  Contact2,
  Lightbulb
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyModulesToggleProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

interface ModuleDefinition {
  key: keyof CompanyModuleConfig;
  title: string;
  description: string;
  icon: React.FC<any>;
  category: 'core' | 'operations' | 'metier';
}

const MODULES_LIST: ModuleDefinition[] = [
  {
    key: 'enablePresences',
    title: 'Gestion des Présences & Pointage',
    description: 'Enregistrement des présences, badgeages QR code, feuilles d\'émargement et horaires.',
    icon: Clock,
    category: 'core',
  },
  {
    key: 'enableStatistics',
    title: 'Statistiques & Assiduité',
    description: 'Calculs de ponctualité, taux de présence, score d\'assiduité et classement des collaborateurs.',
    icon: Compass,
    category: 'core',
  },
  {
    key: 'enableCollaborators',
    title: 'Gestion des Collaborateurs',
    description: 'Fiches salariés, contrats, coordonnées, historique salarial et statuts professionnels.',
    icon: Users,
    category: 'operations',
  },
  {
    key: 'enableTasks',
    title: 'Tâches & Jalons',
    description: 'Attribution de missions, suivi d\'avancement, dates d\'échéance et statuts des livrables.',
    icon: Calendar,
    category: 'operations',
  },
  {
    key: 'enableReminders',
    title: 'Alertes & Rappels',
    description: 'Gestion des échéances contractuelles, rendez-vous RH et notifications programmées.',
    icon: Bell,
    category: 'operations',
  },
  {
    key: 'enableDiscipline',
    title: 'Conseil & Discipline RH',
    description: 'Registre des écarts d\'assiduité, avertissements formels, sanctions et audits disciplinaires.',
    icon: ShieldAlert,
    category: 'operations',
  },
  {
    key: 'enableFinances',
    title: 'Finances & Salaires',
    description: 'Calcul des bulletins de paie, acomptes, remboursements de prêts et grand livre financier.',
    icon: DollarSign,
    category: 'metier',
  },
  {
    key: 'enableDocuments',
    title: 'Documents RH & Contrats',
    description: 'Génération automatique d\'attestations de travail, contrats de travail et fiches de poste.',
    icon: FileText,
    category: 'metier',
  },
  {
    key: 'enableCommunications',
    title: 'Messagerie & SMS / WhatsApp',
    description: 'Diffusion de notes de service, convocations et communications officielles.',
    icon: Send,
    category: 'metier',
  },
  {
    key: 'enableInventory',
    title: 'Inventaire & Matériel',
    description: 'Suivi du parc informatique, dotations professionnelles, clés et équipements confiés.',
    icon: Package,
    category: 'metier',
  },
  {
    key: 'enablePartners',
    title: 'Partenaires & Clients',
    description: 'Annuaire des partenaires d\'affaires, prestataires et conventions externes.',
    icon: Network,
    category: 'metier',
  },
  {
    key: 'enableRecruitment',
    title: 'Recrutement & Vivier (ATS)',
    description: 'Offres de postes, suivi des candidatures, entretiens RH & techniques et vivier de talents.',
    icon: UserPlus,
    category: 'operations',
  },
  {
    key: 'enableExpenseClaims',
    title: 'Notes de Frais & Missions',
    description: 'Déclaration des frais de déplacement, carburant, justificatifs et remboursements comptables.',
    icon: Receipt,
    category: 'metier',
  },
  {
    key: 'enableHse',
    title: 'Registre HSE & Incidents',
    description: 'Signalement des risques, presque-accidents, sécurité des sites et plans d\'actions CAPA.',
    icon: ShieldAlert,
    category: 'operations',
  },
  {
    key: 'enableVisitors',
    title: 'Accueil & Visiteurs Siège (Japoma / Akwa)',
    description: 'Registre d\'accueil numérique, émargement des arrivées/départs et attribution des badges.',
    icon: Contact2,
    category: 'metier',
  },
  {
    key: 'enableIdeasSurveys',
    title: 'Boîte à Idées & Sondages',
    description: 'Suggestions d\'amélioration continue, votes collaboratifs et sondages d\'entreprise.',
    icon: Lightbulb,
    category: 'metier',
  },
  {
    key: 'enableTeamCalls',
    title: 'Appels d\'Équipe & Visioconférence',
    description: 'Salons audio et visio en direct pour les réunions d\'équipe internes.',
    icon: PhoneCall,
    category: 'metier',
  },
  {
    key: 'enableLogs',
    title: 'Journaux Système & Audit Logs',
    description: 'Traçabilité complète des actions, connexions, modifications administratives et sécurité.',
    icon: Terminal,
    category: 'core',
  },
];

export const CompanyModulesToggle: React.FC<CompanyModulesToggleProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<CompanyModuleConfig>({ ...moduleConfig });

  useEffect(() => {
    setFormData({ ...moduleConfig });
  }, [moduleConfig]);

  const handleToggle = (key: keyof CompanyModuleConfig, title: string) => {
    const currentState = formData[key] !== false;
    const newState = !currentState;
    const updated = {
      ...formData,
      [key]: newState,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    if (showToast) {
      showToast(
        `Module "${title}" ${newState ? 'activé' : 'désactivé'}`,
        'success'
      );
    }
  };

  const activeCount = MODULES_LIST.filter((m) => formData[m.key] !== false).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Activation & Désactivation des Modules
            </h3>
            <p className="text-xs text-stone-500">
              Tous les modules du système sont activables ou désactivables selon les besoins de votre organisation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl font-mono">
            {activeCount} / {MODULES_LIST.length} modules actifs
          </span>
        </div>
      </div>

      {/* Grid of All Toggleable Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES_LIST.map((module) => {
          const isEnabled = formData[module.key] !== false;
          const Icon = module.icon;

          return (
            <div
              key={module.key}
              onClick={() => handleToggle(module.key, module.title)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                isEnabled
                  ? 'bg-white border-[#2A7B76]/30 shadow-2xs hover:border-[#2A7B76]/60'
                  : 'bg-stone-50/70 border-stone-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`p-3 rounded-2xl shrink-0 transition-colors ${
                    isEnabled ? 'bg-emerald-50 text-[#2A7B76] border border-emerald-100' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-xs text-stone-900 truncate">
                      {module.title}
                    </h4>
                    {isEnabled ? (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full shrink-0">
                        Actif
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-stone-200 text-stone-600 px-2 py-0.2 rounded-full shrink-0">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {module.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-[#2A7B76]">
                {isEnabled ? (
                  <ToggleRight className="h-8 w-8 text-[#2A7B76]" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-stone-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice on Permanent Core Modules */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-3xl p-4 flex items-start gap-3 text-xs text-stone-600">
        <ShieldCheck className="h-5 w-5 text-[#2A7B76] shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900">Socle d'Administration Permanent :</strong>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Conformément aux règles de sécurité, les sections <strong>« Utilisateurs & Rôles »</strong> et <strong>« Configuration Entreprise »</strong> restent toujours actives afin de garantir la continuité de gestion administrative par les super-administrateurs.
          </p>
        </div>
      </div>
    </div>
  );
};
