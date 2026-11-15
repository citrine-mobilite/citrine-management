import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail, parseEmailList } from './serverMailService';
import { getDoualaDateInfo } from './timesheetReportService';
import {
  MondayGreetingOptions,
  MondayGreetingResult,
  COOL_MONDAY_QUOTES,
  getWeeklyCoolQuote,
  extractFirstName,
  getHumaansImageAttachment,
} from './mail/mondayGreetingQuotesAndHelpers';
import { buildMondayGreetingHtml } from './mail/mondayGreetingHtmlTemplate';

export type { MondayGreetingOptions, MondayGreetingResult };
export {
  COOL_MONDAY_QUOTES,
  getWeeklyCoolQuote,
  extractFirstName,
  getHumaansImageAttachment,
  buildMondayGreetingHtml,
};

export async function sendMondayGreetingToAllEmployees(
  options?: MondayGreetingOptions
): Promise<MondayGreetingResult> {
  const doualaTime = getDoualaDateInfo();
  const errors: string[] = [];
  const recipientEmails: string[] = [];
  let sentCount = 0;

  const now = new Date();
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Douala',
    weekday: 'long',
  })
    .format(now)
    .toLowerCase();
  const isMonday = weekdayName === 'monday';

  if (!isMonday && !options?.forceMonday) {
    const skipMsg = `⏸️ [GREETING LUNDI] Envoi ignoré : nous sommes ${weekdayName} et le message de bon début de semaine est programmé chaque lundi à 08h00.`;
    console.log(skipMsg);
    return {
      success: true,
      message: skipMsg,
      sentCount: 0,
      recipientEmails: [],
      errors: [],
      timestamp: doualaTime.fullDateStr,
    };
  }

  console.log(`🌅 [GREETING LUNDI 08:00] Démarrage de l'envoi du message de bon début de semaine (${doualaTime.fullDateStr})...`);

  try {
    const humaansAttachment = getHumaansImageAttachment();
    const attachments = humaansAttachment ? [humaansAttachment] : [];
    const coolQuote = getWeeklyCoolQuote();
    const appUrl = 'https://citrine-management.vercel.app';

    if (options?.testRecipient && options.testRecipient.trim()) {
      const targetEmails = parseEmailList(options.testRecipient);
      if (targetEmails.length === 0) {
        return {
          success: false,
          message: 'Adresse e-mail destinataire invalide.',
          sentCount: 0,
          recipientEmails: [],
          errors: ['Adresse e-mail destinataire invalide'],
          timestamp: doualaTime.fullDateStr,
        };
      }

      const testEmployeeName = 'Équipe Citrine';
      const testFirstName = extractFirstName(testEmployeeName);

      const htmlContent = buildMondayGreetingHtml({
        employeeName: testEmployeeName,
        dateStr: doualaTime.dateOnly,
        quote: coolQuote.quote,
        appUrl,
      });

      console.log(`✉️ [GREETING LUNDI TEST] Envoi du mail de bonjour vers : ${targetEmails.join(', ')}...`);

      const result = await sendThreadedEmployeeEmail({
        employeeName: testEmployeeName,
        employeeId: 'greeting-test',
        eventTitle: 'Bon début de semaine — Citrine Mobilité',
        threadCategory: 'greeting',
        threadSubject: `Hello ${testFirstName} ! Bon début de semaine chez Citrine Mobilité`,
        htmlContent,
        attachments,
        overrideRecipients: targetEmails,
        recipientEmails: targetEmails,
      });

      if (!result.success) {
        return {
          success: false,
          message: `Échec d'envoi du message de bonjour : ${result.error}`,
          sentCount: 0,
          recipientEmails: targetEmails,
          errors: [result.error || 'Erreur inconnue'],
          timestamp: doualaTime.fullDateStr,
        };
      }

      return {
        success: true,
        message: `Message de bon début de semaine envoyé avec succès à ${targetEmails.join(', ')}.`,
        sentCount: 1,
        recipientEmails: targetEmails,
        errors: [],
        timestamp: doualaTime.fullDateStr,
      };
    }

    const employees = await getCollectionData('employees');
    const activeEmployees = employees.filter((emp: any) => {
      const status = String(emp.status || emp.employmentStatus || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive' || status === 'parti') {
        return false;
      }
      return Boolean(emp.email && emp.email.includes('@'));
    });

    if (activeEmployees.length === 0) {
      console.warn('⚠️ [GREETING LUNDI] Aucun collaborateur avec e-mail valide trouvé.');
      return {
        success: true,
        message: 'Aucun collaborateur éligible trouvé.',
        sentCount: 0,
        recipientEmails: [],
        errors: [],
        timestamp: doualaTime.fullDateStr,
      };
    }

    console.log(`🚀 [GREETING LUNDI] Envoi personnalisé à ${activeEmployees.length} collaborateur(s)...`);

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      const empEmail = emp.email?.trim();
      const empId = emp.id;

      if (!empEmail) continue;

      const empFirstName = extractFirstName(empName);

      try {
        const htmlContent = buildMondayGreetingHtml({
          employeeName: empName,
          dateStr: doualaTime.dateOnly,
          quote: coolQuote.quote,
          appUrl,
        });

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: 'Bon début de semaine — Citrine Mobilité',
          threadCategory: 'greeting',
          threadSubject: `Hello ${empFirstName} ! Bon début de semaine chez Citrine Mobilité`,
          htmlContent,
          attachments,
          overrideRecipients: [empEmail],
          recipientEmails: [empEmail],
        });

        sentCount++;
        recipientEmails.push(empEmail);
        console.log(`✓ [GREETING LUNDI] E-mail transmis à ${empName} (Prénom: ${empFirstName}, Email: ${empEmail})`);
      } catch (err: any) {
        const msg = `Erreur pour ${empName} (${empEmail}) : ${err?.message || err}`;
        console.error('❌ [GREETING LUNDI Error]:', msg);
        errors.push(msg);
      }
    }

    const summaryMsg = `Message de bon début de semaine envoyé avec succès à ${sentCount}/${activeEmployees.length} collaborateurs.`;
    console.log(`✅ [GREETING LUNDI 08:00 TERMINÉ] ${summaryMsg}`);

    return {
      success: errors.length === 0 || sentCount > 0,
      message: summaryMsg,
      sentCount,
      recipientEmails,
      errors,
      timestamp: doualaTime.fullDateStr,
    };
  } catch (globalErr: any) {
    const rawError = globalErr?.message || String(globalErr);
    console.error('💥 [GREETING LUNDI FATAL ERROR]:', globalErr);
    return {
      success: false,
      message: `Erreur générale lors de l'envoi du message de bon début de semaine : ${rawError}`,
      sentCount,
      recipientEmails,
      errors: [rawError],
      timestamp: doualaTime.fullDateStr,
    };
  }
}
