import { Employee } from '../../types';
import { buildOutlookHtmlDocument } from '../mail/outlookEmailShell';

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

function wrapAlertHtml(title: string, cardBg: string, innerHtml: string): string {
  return buildOutlookHtmlDocument({
    title,
    maxWidth: 600,
    bodyBg: '#f8fafc',
    cardBg,
    innerHtml: `
      <tr>
        <td bgcolor="${cardBg}" class="email-pad" style="background-color: ${cardBg}; padding: 22px;">
          ${innerHtml}
        </td>
      </tr>
    `,
  });
}

export function generateEmailHtml(data: AlertData): string {
  const { employee, type, details } = data;
  const empName = employee.name;

  switch (type) {
    case 'lateness':
      return wrapAlertHtml(`Retard Enregistré - ${empName}`, '#fdfafb', `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
          <tr>
            <td align="center" style="text-align: center;">
              <h2 class="email-h1" style="color: #9f1239; margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 22px;">Retard Enregistré</h2>
              <p style="color: #6b7280; font-size: 13px; margin: 0;">Citrine Management - Système de Présence</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <tr>
            <td class="email-pad-sm" style="padding: 18px;">
              <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Nous vous informons qu&apos;un retard d&apos;arrivée a été enregistré dans votre dossier individuel aujourd&apos;hui :</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 14px 0 4px 0; font-size: 14px;">
                <tr>
                  <td class="email-kv-label" style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Date :</td>
                  <td align="right" class="email-kv-val" style="color: #1f2937; font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${details.date || new Date().toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                  <td class="email-kv-label" style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Heure de pointage :</td>
                  <td align="right" class="email-kv-val" style="color: #9f1239; font-weight: bold; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${details.arrivalTime || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="email-kv-label" style="color: #6b7280; padding: 8px 0;">Seuil de ponctualité :</td>
                  <td align="right" class="email-kv-val" style="color: #1f2937; font-weight: bold; padding: 8px 0;">${details.thresholdTime || 'configuré'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);

    case 'priority_task':
      return wrapAlertHtml(`Nouvelle Tâche Prioritaire - ${empName}`, '#fcfbfe', `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
          <tr>
            <td align="center" style="text-align: center;">
              <h2 class="email-h1" style="color: #6b21a8; margin: 0; font-family: Georgia, serif; font-size: 22px;">Nouvelle Tâche Prioritaire</h2>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <tr>
            <td class="email-pad-sm" style="padding: 18px; font-size: 14px; line-height: 1.6;">
              <p style="color: #1f2937; font-size: 15px; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
              <p>Une tâche prioritaire vous a été assignée :</p>
              <p style="font-weight: bold; color: #6b21a8; margin: 8px 0;">${details.taskTitle || 'Tâche'}</p>
              ${details.taskDescription ? `<p style="color: #4b5563;">${details.taskDescription}</p>` : ''}
              <p style="margin-bottom: 0;">Échéance : <strong>${details.taskDueDate || ''} à ${details.taskDueTime || ''}</strong></p>
            </td>
          </tr>
        </table>
      `);

    case 'payslip':
      return wrapAlertHtml(`Fiche de Paie Disponible - ${empName}`, '#f0fdf4', `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
          <tr>
            <td align="center" style="text-align: center;">
              <h2 class="email-h1" style="color: #15803d; margin: 0; font-family: Georgia, serif; font-size: 22px;">Fiche de Paie Disponible</h2>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <tr>
            <td class="email-pad-sm" style="padding: 18px; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
              <p>Votre fiche de paie pour la période <strong>${details.payslipPeriod || ''}</strong> est disponible.</p>
              <p style="margin-bottom: 0;">Montant net : <strong>${details.payslipNetAmount?.toLocaleString('fr-FR') || '0'} XAF</strong></p>
            </td>
          </tr>
        </table>
      `);
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
