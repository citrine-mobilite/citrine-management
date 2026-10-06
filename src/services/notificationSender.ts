import { Employee, NotificationLog, Presence, Task, SalaryPayment } from '../types';
import { sendEmailApi, sendWhatsappApi } from './apiClient';

export interface AlertData {
  employee: Employee;
  type: 'lateness' | 'priority_task' | 'payslip';
  details: {
    // Lateness details
    arrivalTime?: string;
    thresholdTime?: string;
    date?: string;
    
    // Task details
    taskTitle?: string;
    taskDescription?: string;
    taskDueDate?: string;
    taskDueTime?: string;
    taskPriority?: string;
    
    // Payslip details
    payslipPeriod?: string;
    payslipBaseAmount?: number;
    payslipBonusAmount?: number;
    payslipAdvanceAmount?: number;
    payslipNetAmount?: number;
    payslipStatus?: string;
  };
}

/**
 * Generates structured, high-quality HTML template for emails
 */
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
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Nous vous informons qu'un retard d'arrivée a été enregistré dans votre dossier individuel aujourd'hui :</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Date :</td>
                <td style="color: #1f2937; font-weight: bold; text-align: right; padding: 8px 0;">${details.date || new Date().toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Heure de pointage :</td>
                <td style="color: #9f1239; font-weight: bold; text-align: right; padding: 8px 0;">${details.arrivalTime || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Seuil de ponctualité :</td>
                <td style="color: #1f2937; font-weight: bold; text-align: right; padding: 8px 0;">${details.thresholdTime || 'configuré'}</td>
              </tr>
            </table>
            
            <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
              Si vous disposez d'un motif ou d'un justificatif valable, veuillez le déclarer sans tarder sur votre portail d'employé pour régulariser votre fiche d'assiduité.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-bottom: 0; line-height: 1.5;">
            Ceci est un email automatique envoyé par la plateforme Citrine Management.<br />Veuillez ne pas y répondre directement.
          </p>
        </div>
      `;

    case 'priority_task':
      return `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #fcfbfe;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🚨</span>
            <h2 style="color: #6b21a8; margin-top: 10px; font-family: serif; font-size: 24px;">Nouvelle Tâche Prioritaire</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Citrine Management - Direction des Opérations</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Une nouvelle tâche à haute priorité requérant votre intervention vous a été attribuée :</p>
            
            <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #6b21a8; font-weight: bold; margin: 0 0 6px 0; font-size: 15px;">${details.taskTitle || 'Tâche administrative'}</p>
              <p style="color: #581c87; margin: 0; font-size: 13px; line-height: 1.5;">${details.taskDescription || 'Pas de description fournie.'}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Date d'échéance :</td>
                <td style="color: #1f2937; font-weight: bold; text-align: right; padding: 8px 0;">${details.taskDueDate || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Heure limite :</td>
                <td style="color: #1f2937; font-weight: bold; text-align: right; padding: 8px 0;">${details.taskDueTime || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0;">Priorité :</td>
                <td style="color: #dc2626; font-weight: bold; text-align: right; padding: 8px 0; text-transform: uppercase;">${details.taskPriority === 'urgent' ? '🚨 URGENT' : '🔥 HAUTE'}</td>
              </tr>
            </table>
            
            <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
              Nous vous prions de vous connecter à votre portail employé pour initier et suivre cette tâche dans les délais impartis.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-bottom: 0; line-height: 1.5;">
            Ceci est un email automatique de votre instance Citrine Management.<br />Veuillez ne pas y répondre directement.
          </p>
        </div>
      `;

    case 'payslip':
      const net = details.payslipNetAmount || 0;
      const base = details.payslipBaseAmount || 0;
      const bonus = details.payslipBonusAmount || 0;
      const advance = details.payslipAdvanceAmount || 0;
      const actionText = details.payslipStatus === 'paid' ? 'a été viré / payé' : 'est disponible pour consultation';
      const headingColor = details.payslipStatus === 'paid' ? '#15803d' : '#0369a1';
      const bgColor = details.payslipStatus === 'paid' ? '#f0fdf4' : '#f0f9ff';

      return `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: ${bgColor};">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">📄</span>
            <h2 style="color: ${headingColor}; margin-top: 10px; font-family: serif; font-size: 24px;">Bulletin de Paie Disponible</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Citrine Management - Service Comptabilité & RH</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin-top: 0;">Bonjour <strong>${empName}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Votre bulletin de paie pour la période de <strong>${details.payslipPeriod || 'N/A'}</strong> ${actionText} :</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Période :</td>
                <td style="color: #1f2937; font-weight: bold; text-align: right; padding: 8px 0;">${details.payslipPeriod || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Salaire de Base :</td>
                <td style="color: #1f2937; text-align: right; padding: 8px 0;">${base.toLocaleString('fr-FR')} FCFA</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Primes & Bonus :</td>
                <td style="color: #1f2937; text-align: right; padding: 8px 0;">+${bonus.toLocaleString('fr-FR')} FCFA</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="color: #6b7280; padding: 8px 0;">Avances & Retenues :</td>
                <td style="color: #dc2626; text-align: right; padding: 8px 0;">-${advance.toLocaleString('fr-FR')} FCFA</td>
              </tr>
              <tr style="border-top: 2px solid #f3f4f6;">
                <td style="color: #1f2937; font-weight: bold; padding: 12px 0 6px 0;">Salaire Net :</td>
                <td style="color: ${headingColor}; font-weight: bold; font-size: 17px; text-align: right; padding: 12px 0 6px 0;">${net.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            </table>
            
            <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
              Le document officiel et complet au format PDF est téléchargeable dans votre portail personnel, section <em>"Mes Documents / Bulletins"</em>.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-bottom: 0; line-height: 1.5;">
            Ceci est un email automatique du service comptable de Citrine Management.<br />Veuillez ne pas y répondre directement.
          </p>
        </div>
      `;
  }
}

/**
 * Generates structured, high-quality, professional Markdown message for WhatsApp
 */
export function generateWhatsappMessage(data: AlertData): string {
  const { employee, type, details } = data;
  const empName = employee.name;

  switch (type) {
    case 'lateness':
      return `*⚠️ ALERTE DE RETARD - CITRINE*\n\n` +
        `Bonjour *${empName}*,\n\n` +
        `Un retard d'arrivée a été enregistré dans votre dossier individuel.\n\n` +
        `*Détails :*\n` +
        `• *Date :* ${details.date || new Date().toLocaleDateString('fr-FR')}\n` +
        `• *Heure d'arrivée :* ${details.arrivalTime || 'N/A'}\n` +
        `• *Seuil ponctualité :* ${details.thresholdTime || 'configuré'}\n\n` +
        `Si vous disposez d'un motif ou d'un justificatif de retard, veuillez le transmettre ou le déclarer depuis votre portail employé.\n\n` +
        `_Cordialement,\nL'administration de Citrine Management_`;

    case 'priority_task':
      return `*🚨 NOUVELLE TÂCHE PRIORITAIRE - CITRINE*\n\n` +
        `Bonjour *${empName}*,\n\n` +
        `Une nouvelle tâche requérant votre attention immédiate vous a été assignée :\n\n` +
        `👉 *${details.taskTitle || 'Tâche administrative'}*\n` +
        `• *Priorité :* ${details.taskPriority === 'urgent' ? '🚨 URGENT' : '🔥 HAUTE'}\n` +
        `• *Échéance :* ${details.taskDueDate || 'N/A'} à ${details.taskDueTime || 'N/A'}\n\n` +
        `*Description :*\n` +
        `"${details.taskDescription || 'Pas de description'}"\n\n` +
        `Veuillez consulter votre espace de travail Citrine Management pour initier cette tâche.\n\n` +
        `_Cordialement,\nVotre Chef de Projet_`;

    case 'payslip':
      const net = details.payslipNetAmount || 0;
      const statusText = details.payslipStatus === 'paid' ? 'payé / initié' : 'disponible';
      return `*📄 BULLETIN DE PAIE DISPONIBLE - CITRINE*\n\n` +
        `Bonjour *${empName}*,\n\n` +
        `Votre bulletin de paie pour la période de *${details.payslipPeriod || 'N/A'}* est *${statusText}*.\n\n` +
        `*Détails :*\n` +
        `• *Période :* ${details.payslipPeriod || 'N/A'}\n` +
        `• *Net à percevoir :* *${net.toLocaleString('fr-FR')} FCFA*\n\n` +
        `Vous pouvez télécharger le justificatif complet en PDF sur votre portail d'employé.\n\n` +
        `_Cordialement,\nLe service Comptabilité_`;
  }
}

/**
 * When reconnecting from offline mode, batches multiple queued notification logs into
 * a single consolidated WhatsApp message per recipient to avoid sending multiple messages.
 */
export async function sendBatchedOfflineWhatsappNotifications(
  pendingLogs: NotificationLog[]
): Promise<{ batchedCount: number; sentMessages: number }> {
  if (!pendingLogs || pendingLogs.length === 0) {
    return { batchedCount: 0, sentMessages: 0 };
  }

  // Group notifications by recipient
  const groupedByRecipient: Record<string, NotificationLog[]> = {};

  pendingLogs.forEach(log => {
    if (!log.recipient) return;
    const key = log.recipient.trim();
    if (!groupedByRecipient[key]) {
      groupedByRecipient[key] = [];
    }
    groupedByRecipient[key].push(log);
  });

  let sentMessages = 0;

  for (const [recipient, logs] of Object.entries(groupedByRecipient)) {
    if (logs.length === 1) {
      // Single action while offline: send standard single notification
      const log = logs[0];
      try {
        const res = await sendWhatsappApi({
          to: recipient,
          message: `*${log.title}*\n\n${log.content}`
        });
        if (res.success) sentMessages++;
      } catch (e) {
        console.error('Error sending single WhatsApp during batch sync:', e);
      }
    } else {
      // Multiple actions while offline: aggregate into 1 single WhatsApp message!
      const header = `*📊 RÉCAPITULATIF SYNCHRONISATION HORS-LIGNE - CITRINE MANAGEMENT*`;
      let bodyLines = [
        header,
        ``,
        `Bonjour,`,
        `Votre connexion a été rétablie avec succès. Voici le récapitulatif groupé des *${logs.length} actions/pointages* enregistrés en mode hors-ligne :`,
        ``
      ];

      logs.forEach((item, index) => {
        const timeStr = item.timestamp
          ? new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : 'Récent';
        bodyLines.push(`${index + 1}. 📌 *${item.title}* (${timeStr})\n   ${item.content}`);
      });

      bodyLines.push(``);
      bodyLines.push(`_Toutes vos données ont été synchronisées et enregistrées sur le serveur Citrine._`);

      const consolidatedMsg = bodyLines.join('\n');

      try {
        const res = await sendWhatsappApi({
          to: recipient,
          message: consolidatedMsg
        });
        if (res.success) sentMessages++;
      } catch (e) {
        console.error('Error sending aggregated batch WhatsApp:', e);
      }
    }
  }

  return { batchedCount: pendingLogs.length, sentMessages };
}

/**
 * Sends both WhatsApp and Email notifications concurrently to the target collaborator
 */
export async function sendDualNotifications(
  data: AlertData,
  settings: { notifyOnWhatsapp: boolean; notifyOnEmail: boolean }
): Promise<{ whatsappSent: boolean; emailSent: boolean; error?: string }> {
  const result = { whatsappSent: false, emailSent: false };

  try {
    const promises: Promise<any>[] = [];

    // 1. Send WhatsApp
    if (settings.notifyOnWhatsapp && data.employee.phone) {
      const waMessage = generateWhatsappMessage(data);
      promises.push(
        sendWhatsappApi({
          to: data.employee.phone,
          message: waMessage
        })
        .then(resData => {
          if (resData.success) {
            result.whatsappSent = true;
          } else {
            console.warn('WhatsApp send details failed:', resData);
          }
        })
        .catch(err => console.error('Error in WhatsApp API fetch:', err))
      );
    }

    // 2. Send Email
    if (settings.notifyOnEmail && data.employee.email) {
      const emailHtml = generateEmailHtml(data);
      const subject = data.type === 'lateness'
        ? `⚠️ Alerte de Retard - ${data.employee.name}`
        : data.type === 'priority_task'
          ? `🚨 Tâche Prioritaire Assignée : ${data.details.taskTitle}`
          : `📄 Bulletin de Paie Disponible (${data.details.payslipPeriod})`;

      promises.push(
        sendEmailApi({
          to: data.employee.email,
          subject: subject,
          html: emailHtml
        })
        .then(resData => {
          if (resData.success) {
            result.emailSent = true;
          } else {
            console.warn('Email send details failed:', resData);
          }
        })
        .catch(err => console.error('Error in Email API fetch:', err))
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return result;
  } catch (error: any) {
    console.error('Failed to send dual notifications:', error);
    return { ...result, error: error.message };
  }
}
