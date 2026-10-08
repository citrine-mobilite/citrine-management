import { Employee } from '../../types';

export interface AlertData {
  employee: Employee;
  type: 'lateness' | 'priority_task' | 'payslip';
  details: {
    arrivalTime?: string;
    thresholdTime?: string;
    date?: string;
    taskTitle?: string;
    taskDescription?: string;
    taskDueDate?: string;
    taskDueTime?: string;
    taskPriority?: string;
    payslipPeriod?: string;
    payslipBaseAmount?: number;
    payslipBonusAmount?: number;
    payslipAdvanceAmount?: number;
    payslipNetAmount?: number;
    payslipStatus?: string;
  };
}

export function generateEmailHtml(data: AlertData): string {
  const { employee, type, details } = data;
  const empName = employee.name;

  switch (type) {
    case 'lateness':
      return `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #fdfafb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">⚠️</span>
            <h2 style="color: #9f1239; margin-top: 10px; font-family: serif; font-size: 24px;">Retard Enregistré</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Citrine Management - Système de Présence</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 20px;">
            <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Nous vous informons qu'un retard d'arrivée a été enregistré dans votre dossier individuel aujourd'hui :</p>
            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;"><td style="color: #6b7280; padding: 8px 0;">Date :</td><td style="color: #1f2937; font-weight: bold; text-align: right;">${details.date || new Date().toLocaleDateString('fr-FR')}</td></tr>
              <tr style="border-bottom: 1px solid #f3f4f6;"><td style="color: #6b7280; padding: 8px 0;">Heure de pointage :</td><td style="color: #9f1239; font-weight: bold; text-align: right;">${details.arrivalTime || 'N/A'}</td></tr>
              <tr><td style="color: #6b7280; padding: 8px 0;">Seuil de ponctualité :</td><td style="color: #1f2937; font-weight: bold; text-align: right;">${details.thresholdTime || 'configuré'}</td></tr>
            </table>
          </div>
        </div>
      `;

    case 'priority_task':
      return `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #fcfbfe;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🚨</span>
            <h2 style="color: #6b21a8; margin-top: 10px; font-family: serif; font-size: 24px;">Nouvelle Tâche Prioritaire</h2>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6;">
            <p style="color: #1f2937; font-size: 15px;">Bonjour <strong>${empName}</strong>,</p>
            <p>Une tâche prioritaire vous a été assignée :</p>
            <p style="font-weight: bold; color: #6b21a8;">${details.taskTitle || 'Tâche'}</p>
            <p>${details.taskDescription || ''}</p>
            <p>Échéance : <strong>${details.taskDueDate || ''} à ${details.taskDueTime || ''}</strong></p>
          </div>
        </div>
      `;

    case 'payslip':
      return `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #f0fdf4;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">💶</span>
            <h2 style="color: #15803d; margin-top: 10px; font-family: serif; font-size: 24px;">Fiche de Paie Disponible</h2>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6;">
            <p>Bonjour <strong>${empName}</strong>,</p>
            <p>Votre fiche de paie pour la période <strong>${details.payslipPeriod || ''}</strong> est disponible.</p>
            <p>Montant net : <strong>${details.payslipNetAmount?.toLocaleString('fr-FR') || '0'} XAF</strong></p>
          </div>
        </div>
      `;
  }
}

export function generateWhatsappText(data: AlertData): string {
  const { employee, type, details } = data;
  const empName = employee.name;

  switch (type) {
    case 'lateness':
      return `*CITRINE MANAGEMENT - ALERTE RETARD*\n\nBonjour *${empName}*,\nUn retard a été enregistré le *${details.date || ''}* à *${details.arrivalTime || ''}* (Seuil: ${details.thresholdTime || 'configuré'}).\n\nMerci de justifier ce retard depuis votre espace employé.`;

    case 'priority_task':
      return `*CITRINE MANAGEMENT - TÂCHE PRIORITAIRE*\n\nBonjour *${empName}*,\nUne tâche urgente vous a été assignée :\n📌 *${details.taskTitle || ''}*\n🗓️ Échéance : ${details.taskDueDate || ''} à ${details.taskDueTime || ''}\n\nConsultez les détails sur votre portail Citrine.`;

    case 'payslip':
      return `*CITRINE MANAGEMENT - BULLETIN DE PAIE*\n\nBonjour *${empName}*,\nVotre bulletin de paie pour *${details.payslipPeriod || ''}* est prêt.\nMontant Net : *${details.payslipNetAmount?.toLocaleString('fr-FR') || 0} XAF*.\n\nConsultez votre bulletin sur votre portail.`;
  }
}
