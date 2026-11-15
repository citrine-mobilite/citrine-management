import {
  ConsolidatedEmailOptions,
  SmtpConfig,
  parseEmailList,
} from './mailTypesAndParsing';
import { getEffectiveSmtpConfig, getTransporter } from './smtpConfigAndTransporter';
import { normalizeSenderAndDomain } from './mailHtmlTemplates';
import { buildOutlookHtmlDocument } from './outlookEmailShell';

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
    : buildOutlookHtmlDocument({
        title: options.subject,
        maxWidth: 820,
        bodyBg: '#f4f4f5',
        cardBg: '#ffffff',
        innerHtml: `<tr><td class="email-pad" style="padding: 18px 22px;">${options.htmlContent}</td></tr>`,
      });

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
