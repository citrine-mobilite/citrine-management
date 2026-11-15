import {
  EmailThreadingOptions,
  SmtpConfig,
  generateOutlookThreadIndex,
  parseEmailList,
  sanitizeThreadKey,
} from './mailTypesAndParsing';
import { getEffectiveSmtpConfig, getTransporter } from './smtpConfigAndTransporter';
import {
  buildThreadedEmailHtml,
  buildThreadedPlainText,
  normalizeSenderAndDomain,
} from './mailHtmlTemplates';
import { RESPONSIVE_EMAIL_STYLE_TAG } from './responsiveEmailCss';
import { buildOutlookHtmlDocument } from './outlookEmailShell';

export async function sendThreadedEmployeeEmail(
  options: EmailThreadingOptions,
  customConfig?: Partial<SmtpConfig>
): Promise<{ success: boolean; messageId?: string; recipients?: string[]; simulated?: boolean; error?: string; details?: any }> {
  const config = await getEffectiveSmtpConfig(customConfig);
  const transporter = await getTransporter(customConfig);

  const cleanCollabName = (options.employeeName || 'Collaborateur').trim();
  const threadKey = sanitizeThreadKey(cleanCollabName, options.employeeId);

  let recipients: string[] = [];
  if (options.overrideRecipients && options.overrideRecipients.length > 0) {
    recipients = parseEmailList(options.overrideRecipients);
  } else if (options.recipientEmails && options.recipientEmails.length > 0) {
    recipients = parseEmailList(options.recipientEmails);
  } else {
    recipients = parseEmailList(config.hrEmail);
  }

  if (recipients.length === 0) {
    return {
      success: false,
      error: "Aucune adresse e-mail destinataire configurée dans HR_NOTIFICATION_EMAIL. Veuillez renseigner au moins une adresse valide dans les Paramètres de l'entreprise (E-mail & SMTP) ou dans les variables d'environnement.",
    };
  }

  if (!transporter) {
    return {
      success: false,
      error: "Configuration SMTP incomplète ou introuvable : hôte, utilisateur ou mot de passe non configuré. Veuillez vérifier les Paramètres de l'entreprise > E-mail & SMTP.",
    };
  }

  const { cleanFrom, fromAddress, senderDomain } = normalizeSenderAndDomain(config, options.fromName);

  const isTaskSheet =
    options.threadCategory === 'tasksheet' ||
    options.threadCategory === 'timesheet' ||
    /tasksheet|feuille|timesheet|fiche de temps|plan du jour/i.test(options.eventTitle);
  const themeKey = isTaskSheet ? 'tasksheet' : (options.threadCategory || 'rh');

  const threadSubject =
    options.threadSubject ||
    (isTaskSheet
      ? `TaskSheet - Feuille d'avancement des tâches - ${cleanCollabName}`
      : options.eventTitle
      ? `${options.eventTitle} - ${cleanCollabName}`
      : `Dossier RH - ${cleanCollabName}`);

  const threadRootId = `<citrine-thread-${themeKey}-${threadKey}@${senderDomain}>`;
  const cleanMessageId = `<citrine-msg-${themeKey}-${threadKey}-${Date.now()}.${Math.random().toString(36).substring(2, 7)}@${senderDomain}>`;

  const hasDocShell = /<!DOCTYPE|<html/i.test(options.htmlContent);
  const isAlreadyFullHtml =
    options.htmlContent.includes('CITRINE') ||
    options.htmlContent.includes('<table') ||
    hasDocShell;

  let htmlBody: string;
  if (hasDocShell) {
    htmlBody = options.htmlContent.includes('.email-scroll-x')
      ? options.htmlContent
      : options.htmlContent.replace(/<\/head>/i, `${RESPONSIVE_EMAIL_STYLE_TAG}\n</head>`);
  } else if (isAlreadyFullHtml) {
    htmlBody = buildOutlookHtmlDocument({
      title: threadSubject,
      maxWidth: 700,
      bodyBg: '#f8fafc',
      cardBg: '#ffffff',
      innerHtml: `<tr><td class="email-pad" style="padding: 18px 22px;">${options.htmlContent}</td></tr>`,
    });
  } else {
    htmlBody = buildThreadedEmailHtml({
      employeeName: cleanCollabName,
      eventTitle: options.eventTitle,
      bodyHtml: options.htmlContent,
    });
  }

  const plainText = buildThreadedPlainText(cleanCollabName, threadSubject);

  try {
    const attachments = (options.attachments || []).map((att) => {
      let contentType = att.contentType;
      if (!contentType) {
        if (att.filename?.endsWith('.xls')) {
          contentType = 'application/vnd.ms-excel';
        } else if (att.filename?.endsWith('.xlsx')) {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
          contentType = 'application/octet-stream';
        }
      }

      const disposition = att.cid ? 'inline' : 'attachment';
      if (typeof att.content === 'string' && att.encoding === 'base64') {
        return {
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType,
          contentDisposition: disposition,
          cid: att.cid,
        };
      }
      return { ...att, contentType, contentDisposition: disposition, cid: att.cid };
    });

    const rawCc = options.cc ? parseEmailList(options.cc) : [];
    const ccList = rawCc.filter((c) => !recipients.some((r) => r.toLowerCase() === c.toLowerCase()));

    const mailOptions: any = {
      from: fromAddress,
      to: recipients.join(', '),
      replyTo: cleanFrom,
      subject: threadSubject,
      text: plainText,
      html: htmlBody,
      messageId: cleanMessageId,
      inReplyTo: threadRootId,
      references: [threadRootId],
      date: new Date(),
      attachments,
      headers: {
        'In-Reply-To': threadRootId,
        'References': threadRootId,
        'Thread-Topic': threadSubject,
        'Thread-Index': generateOutlookThreadIndex(`${themeKey}-${threadKey}`),
        'X-Entity-Ref-ID': threadRootId,
        'X-Mailer': 'Citrine RH Mail System 2.1',
        'X-Priority': '3',
        'Priority': 'normal',
        'Importance': 'Normal',
        'X-MSMail-Priority': 'Normal',
        'MIME-Version': '1.0',
        'Organization': 'Citrine Mobilité',
      },
    };

    if (ccList.length > 0) {
      mailOptions.cc = ccList.join(', ');
    }

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      recipients,
      simulated: false,
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error(`❌ [SMTP ERROR BRUTE] Échec envoi email pour ${cleanCollabName}:`, {
      message: rawError,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
      stack: err?.stack,
    });
    return {
      success: false,
      error: rawError,
      details: {
        code: err?.code,
        command: err?.command,
        response: err?.response,
        responseCode: err?.responseCode,
        stack: err?.stack,
      },
    };
  }
}
