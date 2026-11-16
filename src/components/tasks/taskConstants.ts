import { TaskProject, TaskProjectRule, TaskSection } from '../../types';

export const DEFAULT_PROJECT_SECTIONS: TaskSection[] = [
  { id: 'sec_todo', title: 'À faire', orderIndex: 0, color: '#64748b' },
  { id: 'sec_in_progress', title: 'En cours', orderIndex: 1, color: '#d97706' },
  { id: 'sec_review', title: 'Revue & Validation', orderIndex: 2, color: '#2563eb' },
  { id: 'sec_completed', title: 'Terminé', orderIndex: 3, color: '#16a34a' },
];

export const DEFAULT_PROJECT_RULES: TaskProjectRule[] = [
  {
    id: 'rule_auto_complete_parent',
    name: 'Terminer la tâche lorsque toutes ses sous-tâches sont cochées',
    trigger: 'all_subtasks_done',
    action: 'complete_parent',
    enabled: true,
  },
  {
    id: 'rule_notify_blocked',
    name: 'Alerter le responsable dès qu’une tâche passe en bloquée',
    trigger: 'moved_to_blocked',
    action: 'notify_lead',
    enabled: true,
  },
  {
    id: 'rule_recurrence',
    name: 'Générer l’occurrence suivante à l’achèvement d’une tâche récurrente',
    trigger: 'task_completed',
    action: 'create_next_recurrence',
    enabled: true,
  },
];

export const DEFAULT_TASK_PROJECTS: TaskProject[] = [
  {
    id: 'all',
    name: 'Tous les projets',
    icon: '📁',
    createdAt: '',
    sections: DEFAULT_PROJECT_SECTIONS,
    rules: DEFAULT_PROJECT_RULES,
  },
  {
    id: 'general',
    name: 'Général',
    icon: '🚀',
    description: "Tâches d'exploitation et gestion courante",
    createdAt: '',
    sections: DEFAULT_PROJECT_SECTIONS,
    rules: DEFAULT_PROJECT_RULES,
  },
  {
    id: 'prevision',
    name: 'Prévision',
    icon: '📊',
    description: 'Prévisions budgétaires, stratégie et feuille de route',
    createdAt: '',
    sections: DEFAULT_PROJECT_SECTIONS,
    rules: DEFAULT_PROJECT_RULES,
  },
  {
    id: 'rh_operations',
    name: 'Opérations RH',
    icon: '👥',
    description: 'Recrutements, audits et entretiens annuels',
    createdAt: '',
    sections: DEFAULT_PROJECT_SECTIONS,
    rules: DEFAULT_PROJECT_RULES,
  },
];
