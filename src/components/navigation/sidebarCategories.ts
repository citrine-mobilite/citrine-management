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
  UserCheck, 
  BarChart3, 
  LayoutDashboard, 
  Settings, 
  Package, 
  Compass, 
  PhoneCall, 
  Scale, 
  Network,
  ShieldCheck,
  UserPlus,
  Receipt,
  ShieldAlert,
  Contact2,
  Lightbulb
} from 'lucide-react';
import { TabType } from '../Sidebar';
import { CompanyModuleConfig } from '../../types';

export interface SidebarItem {
  id: TabType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

export interface SidebarCategory {
  name: string;
  items: SidebarItem[];
}

interface GetSidebarCategoriesOptions {
  userRole: 'employé' | 'responsable' | 'administrateur';
  moduleConfig: CompanyModuleConfig;
  unreadRemindersCount: number;
  pendingPresencesRequestsCount: number;
}

export function getSidebarCategories({
  userRole,
  moduleConfig,
  unreadRemindersCount,
  pendingPresencesRequestsCount,
}: GetSidebarCategoriesOptions): SidebarCategory[] {
  const categories: SidebarCategory[] = [];

  if (userRole === 'employé') {
    // Espace Personnel unique pour les collaborateurs / employés IT
    const empPresenceItems: SidebarItem[] = [
      {
        id: 'employee_portal',
        label: "Espace Personnel",
        description: '',
        icon: UserCheck,
      },
    ];

    if (moduleConfig.enableExpenseClaims !== false) {
      empPresenceItems.push({
        id: 'expense_claims',
        label: 'Notes de Frais & Missions',
        description: 'Soumettre et suivre mes remboursements de frais',
        icon: Receipt,
      });
    }

    if (moduleConfig.enableHse !== false) {
      empPresenceItems.push({
        id: 'hse',
        label: 'Sécurité & Signalement HSE',
        description: 'Signaler un incident ou une situation dangereuse',
        icon: ShieldAlert,
      });
    }

    if (moduleConfig.enableIdeasSurveys !== false) {
      empPresenceItems.push({
        id: 'ideas_surveys',
        label: 'Boîte à Idées & Sondages',
        description: 'Partager des idées et voter aux sondages internes',
        icon: Lightbulb,
      });
    }

    if (moduleConfig.enableVisitors !== false) {
      empPresenceItems.push({
        id: 'visitors',
        label: 'Accueil & Visiteurs Siège',
        description: 'Consulter les arrivées de visiteurs et rendez-vous',
        icon: Contact2,
      });
    }

    categories.push({ name: 'Mon Espace Collaborateur', items: empPresenceItems });
  } else {
    // Administrateur ou Responsable
    const pilotageItems: SidebarItem[] = [
      {
        id: 'dashboard',
        label: 'Tableau de Bord',
        description: '',
        icon: LayoutDashboard,
      },
      {
        id: 'employee_portal',
        label: 'Espace Personnel',
        description: '',
        icon: UserCheck,
      },
    ];

    if (moduleConfig.enablePresences !== false) {
      pilotageItems.push({
        id: 'presences',
        label: 'Gestion des Présences',
        description: '',
        icon: Clock,
        badge: pendingPresencesRequestsCount > 0 ? pendingPresencesRequestsCount : undefined,
      });
    }

    if (moduleConfig.enableStatistics !== false) {
      pilotageItems.push({
        id: 'statistics',
        label: 'Statistiques & Assiduité',
        description: '',
        icon: BarChart3,
      });
    }

    categories.push({ name: 'Pilotage & Présences', items: pilotageItems });

    const opItems: SidebarItem[] = [];
    if (moduleConfig.enableCollaborators !== false) {
      opItems.push({
        id: 'collaborators',
        label: 'Collaborateurs',
        description: '',
        icon: Users,
      });
    }
    if (moduleConfig.enableRecruitment !== false) {
      opItems.push({
        id: 'recruitment',
        label: 'Recrutement & Vivier (ATS)',
        description: 'Offres, candidatures et entretiens de recrutement',
        icon: UserPlus,
      });
    }
    if (moduleConfig.enableTasks !== false) {
      opItems.push({
        id: 'tasks',
        label: 'Tâches & Jalons',
        description: '',
        icon: Calendar,
      });
    }
    if (moduleConfig.enableReminders !== false) {
      opItems.push({
        id: 'reminders',
        label: 'Alertes & Rappels',
        description: '',
        icon: Bell,
        badge: unreadRemindersCount > 0 ? unreadRemindersCount : undefined,
      });
    }
    if (moduleConfig.enableDiscipline !== false) {
      opItems.push({
        id: 'discipline',
        label: 'Conseil & Discipline',
        description: '',
        icon: Scale,
      });
    }

    if (opItems.length > 0) {
      categories.push({ name: 'Opérations RH', items: opItems });
    }

    const businessItems: SidebarItem[] = [];
    if (moduleConfig.enableFinances !== false) {
      businessItems.push({
        id: 'finances',
        label: 'Finances & Paie',
        description: '',
        icon: DollarSign,
      });
    }
    if (moduleConfig.enableExpenseClaims !== false) {
      businessItems.push({
        id: 'expense_claims',
        label: 'Notes de Frais & Missions',
        description: 'Gestion et remboursement des dépenses professionnelles',
        icon: Receipt,
      });
    }
    if (moduleConfig.enableDocuments !== false) {
      businessItems.push({
        id: 'documents',
        label: 'Documents RH',
        description: '',
        icon: FileText,
      });
    }
    if (moduleConfig.enableCommunications !== false) {
      businessItems.push({
        id: 'communications',
        label: 'Messagerie & SMS',
        description: '',
        icon: Send,
      });
    }
    if (moduleConfig.enableInventory !== false) {
      businessItems.push({
        id: 'inventory',
        label: 'Inventaire & Stock',
        description: '',
        icon: Package,
      });
    }
    if (moduleConfig.enablePartners !== false) {
      businessItems.push({
        id: 'partners',
        label: 'Partenaires & Clients',
        description: '',
        icon: Network,
      });
    }
    if (moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false) {
      businessItems.push({
        id: 'calls',
        label: "Appels d'Équipe",
        description: '',
        icon: PhoneCall,
      });
    }

    if (businessItems.length > 0) {
      categories.push({ name: 'Gestion & Métier', items: businessItems });
    }

    // Sécurité, Accueil & Vie d'Entreprise
    const securityItems: SidebarItem[] = [];
    if (moduleConfig.enableHse !== false) {
      securityItems.push({
        id: 'hse',
        label: 'Registre HSE & Incidents',
        description: 'Hygiène, sécurité, environnement et actions correctives',
        icon: ShieldAlert,
      });
    }
    if (moduleConfig.enableVisitors !== false) {
      securityItems.push({
        id: 'visitors',
        label: 'Accueil & Visiteurs Siège',
        description: 'Registre d\'accueil Japoma / Akwa et badges',
        icon: Contact2,
      });
    }
    if (moduleConfig.enableIdeasSurveys !== false) {
      securityItems.push({
        id: 'ideas_surveys',
        label: 'Boîte à Idées & Sondages',
        description: 'Suggestions, amélioration continue et consultations',
        icon: Lightbulb,
      });
    }

    if (securityItems.length > 0) {
      categories.push({ name: 'Sécurité & Vie Entreprise', items: securityItems });
    }

    // Administration : Utilisateurs & Rôles, Journaux & Audit, et Configuration Entreprise
    const adminItems: SidebarItem[] = [
      {
        id: 'users',
        label: 'Utilisateurs & Rôles',
        description: '',
        icon: ShieldCheck,
      },
    ];

    if (moduleConfig.enableLogs !== false) {
      adminItems.push({
        id: 'logs',
        label: 'Journaux et Audit',
        description: 'Événements système, audit des comptes et notifications',
        icon: Terminal,
      });
    }

    adminItems.push({
      id: 'settings',
      label: 'Configuration Entreprise',
      description: '',
      icon: Settings,
    });

    categories.push({ name: 'Administration', items: adminItems });
  }

  return categories;
}
