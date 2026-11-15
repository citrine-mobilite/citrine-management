import {
  Clock,
  Users,
  Calendar,
  Bell,
  FileText,
  Send,
  DollarSign,
  UserCheck,
  BarChart3,
  LayoutDashboard,
  Package,
  PhoneCall,
  Scale,
  Network,
  UserPlus,
  Receipt,
  CalendarDays,
  Flag,
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { normalizeRoleString } from '../../utils/roleUtils';
import {
  SidebarItem,
  SidebarCategory,
  buildEmployeeSidebarCategories,
  buildSecurityAndAdminCategories,
} from './sidebarCategoryBuilders';

export type { SidebarItem, SidebarCategory };

interface GetSidebarCategoriesOptions {
  userRole: 'employé' | 'responsable' | 'administrateur';
  moduleConfig: CompanyModuleConfig;
  unreadRemindersCount: number;
  pendingPresencesRequestsCount: number;
  pendingLeavesCount?: number;
  nonBadgedEmployeesCount?: number;
}

export function getSidebarCategories({
  userRole,
  moduleConfig,
  unreadRemindersCount,
  pendingPresencesRequestsCount,
  pendingLeavesCount = 0,
  nonBadgedEmployeesCount,
}: GetSidebarCategoriesOptions): SidebarCategory[] {
  const normalizedRole = normalizeRoleString(userRole);

  if (normalizedRole === 'employe' || normalizedRole === 'employee') {
    return buildEmployeeSidebarCategories(moduleConfig);
  }

  const categories: SidebarCategory[] = [];

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
      badge: typeof nonBadgedEmployeesCount === 'number'
        ? (nonBadgedEmployeesCount > 0 ? nonBadgedEmployeesCount : undefined)
        : (pendingPresencesRequestsCount > 0 ? pendingPresencesRequestsCount : undefined),
    });

    pilotageItems.push({
      id: 'leave_requests',
      label: 'Congés et permissions',
      description: '',
      icon: CalendarDays,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
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
  if (moduleConfig.enableStrategicProjects !== false) {
    opItems.push({
      id: 'projects',
      label: 'Gestion de Projets',
      description: 'Suivi stratégique des projets et jalons clés',
      icon: Flag,
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

  categories.push(...buildSecurityAndAdminCategories(moduleConfig));

  return categories;
}
