import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailThreadingOptions {
  /** Nom complet du collaborateur (ex: "Éric MBIDA") */
  employeeName: string;
  /** Identifiant unique du collaborateur (ex: "12" ou "emp_123") */
  employeeId?: string | number;
  /** Adresse email du collaborateur */
  employeeEmail?: string;
  /** Titre ou objet de l'événement précis (ex: "Affectation en Mission Professionnelle") */
  eventTitle: string;
  /** Contenu HTML du message */
  htmlContent: string;
  /** Destinataires supplémentaires (ex: manager direct, direction RH) */
  recipientEmails?: string[];
  /** Nom de l'expéditeur */
  fromName?: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  hrEmail?: string;
}

/**
 * Nettoie et normalise une chaîne pour servir d'identifiant de message RFC 2822
 */
function sanitizeThreadKey(name: string, id?: string | number): string {
  const cleanName = (name || 'collab')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, '-');
  const cleanId = id ? String(id).replace(/[^a-z0-9]/gi, '') : 'main';
  return `${cleanName}-${cleanId}`;
}

/**
 * Crée le transporteur Nodemailer exclusivement à partir des variables d'environnement (.env)
 */
export function getTransporter(): any | null {
  dotenv.config();
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Génère un template HTML élégant et professionnel aux couleurs de Citrine SARL
 */
export function buildThreadedEmailHtml(options: {
  employeeName: string;
  eventTitle: string;
  bodyHtml: string;
  tagColor?: string;
  dateStr?: string;
}): string {
  const dateStr = options.dateStr || new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          
          <!-- En-tête officiel Citrine SARL -->
          <tr>
            <td style="background: linear-gradient(135deg, #1F625E 0%, #0F3E3B 100%); padding: 25px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                      CITRINE SARL
                    </span>
                    <span style="display: block; font-size: 11px; color: #A7F3D0; font-weight: 500; margin-top: 2px;">
                      Direction des Ressources Humaines & Opérations
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25);">
                      Fil RH Collaborateur
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bannière Objet du Message dans le fil -->
          <tr>
            <td style="padding: 24px 30px 12px 30px; border-bottom: 1px solid #f5f5f4;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #1F625E; text-transform: uppercase; letter-spacing: 0.8px;">
                      Dossier : ${options.employeeName}
                    </span>
                    <h1 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; color: #0c0a09; line-height: 1.3;">
                      ${options.eventTitle}
                    </h1>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="font-size: 11px; color: #78716c; font-family: monospace;">
                      ${dateStr}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 24px 30px; font-size: 14px; line-height: 1.6; color: #292524;">
              ${options.bodyHtml}
            </td>
          </tr>

          <!-- Encart informatif de regroupement en fil -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; font-size: 11px; color: #166534; line-height: 1.5;">
                📌 <strong>Fil Unique Collaborateur :</strong> Cet e-mail est groupé automatiquement dans la conversation dédiée à <strong>${options.employeeName}</strong> pour un suivi chronologique unifié sans dispersion.
              </div>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 30px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #44403c;">
                Citrine SARL — Douala, Cameroun
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                Système Automatisé de Gestion des Ressources Humaines & Pointage · Ne pas répondre directement à cet email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envoie un email transactionnel groupé dans le fil du collaborateur
 */
export async function sendThreadedEmployeeEmail(
  options: EmailThreadingOptions
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  dotenv.config();
  const transporter = getTransporter();

  const cleanCollabName = (options.employeeName || 'Collaborateur').trim();
  const threadKey = sanitizeThreadKey(cleanCollabName, options.employeeId);
  
  // Expéditeur configuré exclusivement via les variables d'environnement (.env)
  const senderName = process.env.SMTP_SENDER_NAME || options.fromName;
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!fromEmail) {
    return {
      success: false,
      error: "Variables d'environnement manquantes dans le .env : SMTP_FROM ou SMTP_USER doit être renseigné.",
    };
  }

  const fromAddress = senderName ? `"${senderName}" <${fromEmail}>` : fromEmail;
  const domain = fromEmail.includes('@') ? fromEmail.split('@')[1].replace(/[<>]/g, '').trim() : 'localhost';

  // RFC 2822 Message-ID racine stable pour tout le fil de ce collaborateur
  const rootThreadMessageId = `<collab-thread-${threadKey}@${domain}>`;
  const specificMessageId = `<msg-${threadKey}-${Date.now()}@${domain}>`;

  const threadSubject = `[Notification RH] Collaborateur : ${cleanCollabName}`;

  // Déterminer la liste des destinataires
  const recipients: string[] = [];
  if (options.employeeEmail && options.employeeEmail.includes('@')) {
    recipients.push(options.employeeEmail.trim());
  }
  if (options.recipientEmails && options.recipientEmails.length > 0) {
    options.recipientEmails.forEach((em) => {
      if (em && em.includes('@') && !recipients.includes(em.trim())) {
        recipients.push(em.trim());
      }
    });
  }
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL;
  if (hrEmail && hrEmail.includes('@') && !recipients.includes(hrEmail.trim())) {
    recipients.push(hrEmail.trim());
  }

  if (recipients.length === 0) {
    return {
      success: false,
      error: "Aucune adresse e-mail destinataire spécifiée et la variable HR_NOTIFICATION_EMAIL n'est pas définie dans le .env.",
    };
  }

  const htmlBody = buildThreadedEmailHtml({
    employeeName: cleanCollabName,
    eventTitle: options.eventTitle,
    bodyHtml: options.htmlContent,
  });

  if (!transporter) {
    return {
      success: false,
      error: "Configuration SMTP incomplète dans le .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS requis).",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(', '),
      subject: threadSubject,
      html: htmlBody,
      messageId: specificMessageId,
      inReplyTo: rootThreadMessageId,
      references: [rootThreadMessageId],
      headers: {
        'X-Entity-Ref-ID': threadKey,
        'X-Employee': cleanCollabName,
        'Thread-Topic': `[Notification RH] Collaborateur : ${cleanCollabName}`,
        'Thread-Index': Buffer.from(threadKey).toString('base64'),
      },
    });

    console.log(`✅ [SMTP ENVOYÉ] ID: ${info.messageId} vers ${recipients.join(', ')}`);
    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error(`❌ [SMTP ERROR] Échec envoi email pour ${cleanCollabName}:`, rawError);
    return {
      success: false,
      error: rawError,
    };
  }
}
