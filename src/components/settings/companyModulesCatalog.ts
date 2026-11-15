import React from 'react';
import {
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
  UserPlus,
  Receipt,
  Contact2,
  Lightbulb,
  Flag,
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

export interface ModuleDefinition {
  key: keyof CompanyModuleConfig;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  category: 'core' | 'operations' | 'metier';
}

export const MODULES_LIST: ModuleDefinition[] = [
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
    key: 'enableStrategicProjects',
    title: 'Gestion de Projets & Jalons',
    description: 'Suivi stratégique des projets phares, progression automatique et prochains jalons clés dès l\'accueil.',
    icon: Flag,
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
