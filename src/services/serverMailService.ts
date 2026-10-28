import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getCollectionData } from '../db/repository.ts';

dotenv.config();

export interface EmailThreadingOptions {
  /** Nom complet du collaborateur (ex: "Éric MBIDA") */
  employeeName: string;
  /** Identifiant unique du collaborateur (ex: "12" ou "emp_123") */
  employeeId?: string | number;
  /** Titre ou objet de l'événement précis (ex: "Affectation en Mission Professionnelle") */
  eventTitle: string;
  /** Contenu HTML du message */
  htmlContent: string;
  /** Catégorie de fil pour regrouper tous les mails du même thème (ex: "timesheet", "conges", "missions") */
  threadCategory?: string;
  /** Sujet optionnel forcé pour le fil (sinon canonique automatique) */
  threadSubject?: string;
  /** Nom de l'expéditeur */
  fromName?: string;
  /** Destinataires optionnels de surcharge pour les tests directs */
  overrideRecipients?: string[];
  /** Ignoré lors de l'envoi : la règle stricte Citrine n'envoie qu'aux adresses de HR_NOTIFICATION_EMAIL */
  employeeEmail?: string;
  recipientEmails?: string[];
  /** Pièces jointes éventuelles (ex: feuille de temps Excel .xlsx) */
  attachments?: Array<{
    filename: string;
    content: any;
    encoding?: string;
    contentType?: string;
  }>;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  senderName?: string;
  hrEmail?: string;
}

/**
 * Découpe et valide une chaîne contenant un ou plusieurs e-mails (séparateurs: virgule, point-virgule, espace, saut de ligne)
 */
export function parseEmailList(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.flatMap(r => parseEmailList(r))));
  }

  // Découpage selon virgules, points-virgules, retours à la ligne ou espaces multiples
  const tokens = String(raw).split(/[,;\n\r\t]+/).map(t => t.trim()).filter(Boolean);
  const emails: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const token of tokens) {
    // Si le format est "Nom <adresse@domaine.com>"
    const match = token.match(/<([^>]+)>/);
    const candidate = (match ? match[1] : token).trim();
    if (emailRegex.test(candidate)) {
      const lower = candidate.toLowerCase();
      if (!emails.some(e => e.toLowerCase() === lower)) {
        emails.push(candidate);
      }
    }
  }

  return emails;
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
 * Génère un en-tête Thread-Index standard compatible Microsoft Outlook / Exchange / M365 (RFC MS-OXOMSG).
 * Structure de base : 6 octets horodatage + 16 octets de hash déterministe (22 octets base64).
 * Cela force Outlook à regrouper TOUS les messages du même collaborateur et même thème dans la même conversation.
 */
function generateOutlookThreadIndex(threadKey: string): string {
  const buf = Buffer.alloc(22);
  buf.writeUInt32BE(0x01da4b00, 0); // Filetime de base
  buf.writeUInt16BE(0x0000, 4);
  let hash = 0x811c9dc5;
  for (let i = 0; i < threadKey.length; i++) {
    hash ^= threadKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 6; i < 22; i++) {
    buf[i] = ((hash >> ((i % 4) * 8)) & 0xff) ^ (threadKey.charCodeAt(i % threadKey.length) || 0x42);
  }
  return buf.toString('base64');
}

/**
 * Récupère la configuration SMTP effective avec priorité :
 * 1. customConfig passé en argument (ex: lors d'un test depuis le formulaire)
 * 2. Données persistées en base de données (table company_settings)
 * 3. Variables d'environnement (.env / secrets)
 */
export async function getEffectiveSmtpConfig(customConfig?: Partial<SmtpConfig>): Promise<SmtpConfig> {
  dotenv.config();

  let dbSettings: any = null;
  try {
    const list = await getCollectionData('company_settings');
    if (Array.isArray(list) && list.length > 0) {
      dbSettings = list.find((s: any) => s.id === 'main_config' || s.docId === 'main_config') || list[0];
    }
  } catch (err) {
    // Erreur silencieuse de DB, fallback automatique sur les variables d'environnement
  }

  const rawHost = customConfig?.host || dbSettings?.smtpHost || process.env.SMTP_HOST || '';
  const rawPort = customConfig?.port ?? (dbSettings?.smtpPort ? Number(dbSettings.smtpPort) : undefined) ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const rawSecure = customConfig?.secure ?? (dbSettings?.smtpSecure !== undefined ? Boolean(dbSettings.smtpSecure) : undefined) ?? (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1');
  const rawFrom = (customConfig?.from || dbSettings?.smtpFrom || process.env.SMTP_FROM || '').trim();
  const rawUser = (customConfig?.user || dbSettings?.smtpUser || process.env.SMTP_USER || rawFrom || '').trim();
  const rawPass = (customConfig?.pass || dbSettings?.smtpPass || process.env.SMTP_PASS || '').trim();
  const senderName = (customConfig?.senderName || dbSettings?.smtpSenderName || process.env.SMTP_SENDER_NAME || 'Citrine Mobilité RH').trim();
  const hrEmail = (customConfig?.hrEmail || dbSettings?.hrNotificationEmail || process.env.HR_NOTIFICATION_EMAIL || '').trim();

  // Nettoyage de l'adresse utilisateur
  const cleanFrom = rawFrom.includes('<') && rawFrom.includes('>') ? rawFrom.match(/<([^>]+)>/)?.[1].trim() : rawFrom;
  const cleanUser = rawUser.includes('<') && rawUser.includes('>') ? rawUser.match(/<([^>]+)>/)?.[1].trim() : rawUser;
  const user = cleanFrom || cleanUser;

  // Suppression des espaces éventuels dans le mot de passe d'application Google (ex: "abcd efgh ijkl mnop")
  const pass = rawPass.replace(/\s+/g, '');

  let host = rawHost.trim();
  let port = Number(rawPort) || 587;
  let secure = Boolean(rawSecure);

  // Auto-détection de l'hôte si manquant ou contenant "example.com"
  if ((!host || host === 'smtp.example.com' || host.includes('example.com')) && user) {
    if (user.endsWith('@gmail.com') || user.endsWith('@googlemail.com')) {
      host = 'smtp.gmail.com';
    } else if (user.endsWith('@outlook.com') || user.endsWith('@hotmail.com')) {
      host = 'smtp.office365.com';
    } else if (user.endsWith('@yahoo.com')) {
      host = 'smtp.mail.yahoo.com';
    }
  }

  // Optimisations TLS/SSL pour Gmail
  if (host === 'smtp.gmail.com') {
    if (port === 465) secure = true;
    if (port === 587) secure = false;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: rawFrom || user,
    senderName,
    hrEmail,
  };
}

/**
 * Crée le transporteur Nodemailer à partir de la configuration effective
 */
export async function getTransporter(customConfig?: Partial<SmtpConfig>): Promise<any | null> {
  const config = await getEffectiveSmtpConfig(customConfig);

  if (!config.host || config.host === 'smtp.example.com' || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Génère un template HTML élégant et professionnel aux couleurs de Citrine Mobilité
 */
export function buildThreadedEmailHtml(options: {
  employeeName: string;
  eventTitle: string;
  bodyHtml: string;
  tagColor?: string;
  dateStr?: string;
}): string {
  const dateStr = options.dateStr || new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

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
          
          <!-- En-tête officiel Citrine Mobilité -->
          <tr>
            <td style="background: linear-gradient(135deg, #1F625E 0%, #0F3E3B 100%); padding: 25px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                      CITRINE MOBILITÉ
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

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 30px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #44403c;">
                Citrine Mobilité — Douala, Cameroun
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                Système Automatisé de Gestion des Ressources Humaines & Pointage · Notification interne confidentielle
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
 * Envoie un email transactionnel groupé dans le fil du collaborateur.
 * RÈGLE STRICTE CITRINE : Seules les adresses e-mails configurées dans HR_NOTIFICATION_EMAIL
 * reçoivent les messages (ou overrideRecipients lors d'un test direct).
 * Aucun employé ni collaborateur externe ne reçoit ces emails.
 */
export async function sendThreadedEmployeeEmail(
  options: EmailThreadingOptions,
  customConfig?: Partial<SmtpConfig>
): Promise<{ success: boolean; messageId?: string; recipients?: string[]; simulated?: boolean; error?: string; details?: any }> {
  const config = await getEffectiveSmtpConfig(customConfig);
  const transporter = await getTransporter(customConfig);

  const cleanCollabName = (options.employeeName || 'Collaborateur').trim();
  const threadKey = sanitizeThreadKey(cleanCollabName, options.employeeId);

  // Détermination stricte des destinataires :
  // Si overrideRecipients est fourni (ex: test de connexion), l'utiliser.
  // Sinon, STRICTEMENT et UNIQUEMENT la liste des e-mails définis dans HR_NOTIFICATION_EMAIL (base de données ou .env).
  let recipients: string[] = [];
  if (options.overrideRecipients && options.overrideRecipients.length > 0) {
    recipients = parseEmailList(options.overrideRecipients);
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

  // Préparation de l'expéditeur et conformité SPF/DKIM
  const effectiveSenderEmail = config.user || (config.from?.includes('<') ? config.from.match(/<([^>]+)>/)?.[1].trim() : config.from) || 'citrinemobilite@gmail.com';
  const cleanFrom = config.from?.includes('<') && config.from?.includes('>')
    ? (config.from.match(/<([^>]+)>/)?.[1].trim() || config.from)
    : (config.from || effectiveSenderEmail);
  const senderName = config.senderName || options.fromName || 'Citrine Mobilité RH';
  
  // Format RFC 5322 strict : "Nom" <adresse@domaine.com>
  const fromAddress = `"${senderName.replace(/"/g, '')}" <${cleanFrom}>`;

  // Thème du fil : détection stricte feuille de temps vs autre démarche RH
  const isTimesheet = (options.threadCategory === 'timesheet') ||
    /feuille|timesheet|fiche de temps|plan du jour/i.test(options.eventTitle);
  const themeKey = isTimesheet ? 'timesheet' : (options.threadCategory || 'rh');

  // RÈGLE ABSOLUE POUR LE GROUPEMENT EN CONVERSATION (GMAIL & OUTLOOK) :
  // Le Sujet (Subject) DOIT ÊTRE STRICTEMENT CONSTANT pour tous les e-mails d'un même collaborateur sur ce thème.
  // Jamais de date dans le titre pour ne pas ouvrir une nouvelle boucle chaque jour !
  const threadSubject = options.threadSubject || (isTimesheet
    ? `Feuille de temps - ${cleanCollabName}`
    : (options.eventTitle ? `${options.eventTitle} - ${cleanCollabName}` : `Dossier RH - ${cleanCollabName}`));

  // Domaine expéditeur pour identifiants RFC 2822
  const domainMatch = cleanFrom.match(/@([^>]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : 'citrinemobilite.com';

  // Identifiant racine CANONIQUE et UNIQUE par collaborateur et par thème :
  // Exemple: <citrine-thread-timesheet-kenne-londo-doleres-emp1@citrine-mobilite.com>
  // Tous les messages quotidiens de ce collaborateur sur ce thème font référence à cette racine.
  const threadRootId = `<citrine-thread-${themeKey}-${threadKey}@${senderDomain}>`;

  // Identifiant unique pour ce message précis du jour
  const cleanMessageId = `<citrine-msg-${themeKey}-${threadKey}-${Date.now()}.${Math.random().toString(36).substring(2, 7)}@${senderDomain}>`;

  // Éviter la double encapsulation HTML si le contenu est déjà structuré
  const isAlreadyFullHtml = options.htmlContent.includes('CITRINE') || options.htmlContent.includes('<table') || options.htmlContent.includes('<!DOCTYPE');

  const htmlBody = isAlreadyFullHtml
    ? `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${threadSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${options.htmlContent}
</body>
</html>`
    : buildThreadedEmailHtml({
        employeeName: cleanCollabName,
        eventTitle: options.eventTitle,
        bodyHtml: options.htmlContent,
      });

  // Version texte brut soignée pour conformité et délivrabilité
  const plainText = [
    `CITRINE MOBILITÉ — GESTION DES RESSOURCES HUMAINES`,
    `Dossier : ${cleanCollabName}`,
    `Fil de discussion : ${threadSubject}`,
    `Date : ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Douala', dateStyle: 'full', timeStyle: 'short' }).format(new Date())}`,
    `--------------------------------------------------`,
    `La feuille de temps officielle ainsi que le relevé d'activité sont consultables dans le corps du message et via le fichier tableur joint (.xlsx).`,
    ``,
    `Direction des Ressources Humaines & Opérations`,
    `Citrine Mobilité — Douala, Cameroun`,
  ].join('\n');

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

      if (typeof att.content === 'string' && att.encoding === 'base64') {
        return {
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType,
          contentDisposition: 'attachment',
        };
      }
      return {
        ...att,
        contentType,
        contentDisposition: 'attachment',
      };
    });

    const info = await transporter.sendMail({
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
    });

    console.log(`✅ [SMTP ENVOYÉ THREADÉ] ID: ${info.messageId} | Fil: "${threadSubject}" -> [${recipients.join(', ')}]`);
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
