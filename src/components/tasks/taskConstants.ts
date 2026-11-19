import { TaskProject } from '../../types';

export const DEFAULT_TASK_PROJECTS: TaskProject[] = [
  { id: 'all', name: 'Tous les projets', icon: '📁', createdAt: '' },
  { id: 'general', name: 'Général', icon: '🚀', description: 'Tâches d\'exploitation et gestion courante', createdAt: '' },
  { id: 'prevision', name: 'Prévision', icon: '📊', description: 'Prévisions budgétaires, stratégie et feuille de route', createdAt: '' },
  { id: 'rh_operations', name: 'Opérations RH', icon: '👥', description: 'Recrutements, audits et entretiens annuels', createdAt: '' },
];
