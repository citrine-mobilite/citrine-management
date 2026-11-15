import React from 'react';
import {
  UserCheck,
  Terminal,
  Settings,
  ShieldCheck,
  Receipt,
  ShieldAlert,
  Contact2,
  Lightbulb,
  Flag,
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

export function buildEmployeeSidebarCategories(moduleConfig: CompanyModuleConfig): SidebarCategory[] {
  const empPresenceItems: SidebarItem[] = [
    {
      id: 'employee_portal',
      label: "Espace Personnel",
      description: '',
      icon: UserCheck,
    },
  ];

  if (moduleConfig.enableStrategicProjects !== false) {
    empPresenceItems.push({
      id: 'projects',
      label: 'Projets & Jalons',
      description: 'Consulter l\'évolution des projets et prochains jalons',
      icon: Flag,
    });
  }

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

  return [{ name: 'Mon Espace Collaborateur', items: empPresenceItems }];
}

export function buildSecurityAndAdminCategories(moduleConfig: CompanyModuleConfig): SidebarCategory[] {
  const categories: SidebarCategory[] = [];

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
      description: '',
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
  return categories;
}
