import {
  ConsolidatedEmailOptions,
  SmtpConfig,
  parseEmailList,
} from './mailTypesAndParsing';
import { getEffectiveSmtpConfig, getTransporter } from './smtpConfigAndTransporter';
import { normalizeSenderAndDomain } from './mailHtmlTemplates';

/**
 * Envoie un email global consolidé (ex: Récapitulatif Hebdomadaire des Présences)
 * Destinataire(s) principal(aux) : Responsables / RH
 * En copie (CC) : Tous les collaborateurs actifs
 */
export async function sendConsolidatedReportEmail(
  options: ConsolidatedEmailOptions,
  customConfig?: Partial<SmtpConfig>
): Promise<{ success: boolean; messageId?: string; recipients?: string[]; ccRecipients?: string[]; error?: string; details?: any }> {
  const config = await getEffectiveSmtpConfig(customConfig);
  const transporter = await getTransporter(customConfig);

  let recipients: string[] = [];
  if (options.recipientEmails && options.recipientEmails.length > 0) {
    recipients = parseEmailList(options.recipientEmails);
  } else {
    recipients = parseEmailList(config.hrEmail);
  }

  if (recipients.length === 0) {
    return {
      success: false,
      error: "Aucune adresse e-mail destinataire configurée dans HR_NOTIFICATION_EMAIL pour le rapport consolidé.",
    };
  }

  if (!transporter) {
    return {
      success: false,
      error: "Configuration SMTP incomplète ou introuvable : hôte, utilisateur ou mot de passe non configuré.",
    };
  }

  const rawCc = options.ccEmails ? parseEmailList(options.ccEmails) : [];
  const ccRecipients = rawCc.filter((c) => !recipients.some((r) => r.toLowerCase() === c.toLowerCase()));

  const { cleanFrom, fromAddress, senderDomain } = normalizeSenderAndDomain(config);
  const cleanMessageId = `<citrine-weekly-${Date.now()}.${Math.random().toString(36).substring(2, 7)}@${senderDomain}>`;

  const htmlBody = options.htmlContent.includes('<!DOCTYPE') || options.htmlContent.includes('<html')
    ? options.htmlContent
    : `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  ${options.htmlContent}
</body>
</html>`;

  const textBody = options.plainText || [
    `CITRINE MOBILITÉ — RAPPORT CONSOLIDÉ DES PRÉSENCES`,
    `Objet : ${options.subject}`,
    `Date d'émission : ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Douala', dateStyle: 'full', timeStyle: 'short' }).format(new Date())}`,
    `--------------------------------------------------`,
    `Le rapport détaillé de présence de l'ensemble des collaborateurs de la semaine est consultable dans le corps HTML du message.`,
    ``,
    `Direction des Ressources Humaines & Opérations`,
    `Citrine Mobilité — Douala, Cameroun`,
  ].join('\n');

  try {
    const attachments = (options.attachments || []).map((att) => ({
      ...att,
      contentType: att.contentType || 'application/octet-stream',
      contentDisposition: 'attachment',
    }));

    const mailOptions: any = {
      from: fromAddress,
      to: recipients.join(', '),
      replyTo: cleanFrom,
      subject: options.subject,
      text: textBody,
      html: htmlBody,
      messageId: cleanMessageId,
      date: new Date(),
      attachments,
      headers: {
        'X-Mailer': 'Citrine RH Mail System 2.1',
        'X-Priority': '3',
        'Importance': 'Normal',
        'Organization': 'Citrine Mobilité',
      },
    };

    if (ccRecipients.length > 0) {
      mailOptions.cc = ccRecipients.join(', ');
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [SMTP RAPPORT CONSOLIDÉ ENVOYÉ] ID: ${info.messageId} | "${options.subject}" -> To: [${recipients.join(', ')}] | CC: [${ccRecipients.length} collaborateurs]`);
    return {
      success: true,
      messageId: info.messageId,
      recipients,
      ccRecipients,
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error(`❌ [SMTP RAPPORT CONSOLIDÉ ÉCHEC]:`, err);
    return {
      success: false,
      error: rawError,
      details: err,
    };
  }
}
