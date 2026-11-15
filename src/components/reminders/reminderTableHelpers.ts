import { Reminder, Employee } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  getReminderCategoryLabel,
} from '../../services/reminderService';

export function getReminderTargetLabel(reminder: Reminder, employees: Employee[]): string {
  if (reminder.allEmployees) return "Toute l'équipe";
  if (!reminder.employeeIds || reminder.employeeIds.length === 0) return 'Direction';
  if (reminder.employeeIds.length === 1) {
    const emp = employees.find((e) => e.id === reminder.employeeIds?.[0]);
    return emp ? emp.name : '1 personne';
  }
  return `${reminder.employeeIds.length} personnes`;
}

export function exportRemindersToExcel(sortedReminders: Reminder[], employees: Employee[]): void {
  const headers = [
    'Document / Intitulé',
    'Élément concerné',
    'Catégorie',
    'Échéance',
    'Statut',
    'Périodicité',
    'Alerte accueil',
    'Destinataires',
  ];
  const rows = sortedReminders.map((r) => {
    const urgency = computeReminderUrgency(r);
    return [
      r.title || r.note || '',
      r.entityName || '',
      getReminderCategoryLabel(r.category),
      urgency.targetDateStr || 'Non datée',
      urgency.statusLabel,
      RENEWAL_CYCLE_LABELS[r.renewalCycle || 'none'],
      `J-${urgency.leadDays}`,
      getReminderTargetLabel(r, employees),
    ];
  });
  exportToExcel(
    'echeances_et_alertes.xls',
    'Registre des Échéances & Alertes Citrine',
    headers,
    rows
  );
}
