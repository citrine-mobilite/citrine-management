import { SmtpConfig } from './mailTypesAndParsing';

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
          <tr>
            <td style="padding: 24px 30px; font-size: 14px; line-height: 1.6; color: #292524;">
              ${options.bodyHtml}
            </td>
          </tr>
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

export function normalizeSenderAndDomain(config: SmtpConfig, fallbackFromName?: string) {
  const effectiveSenderEmail =
    config.user ||
    (config.from?.includes('<') ? config.from.match(/<([^>]+)>/)?.[1].trim() : config.from) ||
    'citrinemobilite@gmail.com';
  const cleanFrom =
    config.from?.includes('<') && config.from?.includes('>')
      ? (config.from.match(/<([^>]+)>/)?.[1].trim() || config.from)
      : (config.from || effectiveSenderEmail);
  const senderName = config.senderName || fallbackFromName || 'Citrine Mobilité RH';
  const fromAddress = `"${senderName.replace(/"/g, '')}" <${cleanFrom}>`;
  const domainMatch = cleanFrom.match(/@([^>]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : 'citrinemobilite.com';

  return { cleanFrom, fromAddress, senderDomain };
}

export function buildThreadedPlainText(cleanCollabName: string, threadSubject: string): string {
  return [
    `CITRINE MOBILITÉ — GESTION DES RESSOURCES HUMAINES`,
    `Dossier : ${cleanCollabName}`,
    `Fil de discussion : ${threadSubject}`,
    `Date : ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Douala', dateStyle: 'full', timeStyle: 'short' }).format(new Date())}`,
    `--------------------------------------------------`,
    `La feuille de tâches officielle ainsi que le relevé d'activité sont consultables dans le corps du message et via le fichier tableur joint (.xlsx).`,
    ``,
    `Direction des Ressources Humaines & Opérations`,
    `Citrine Mobilité — Douala, Cameroun`,
  ].join('\n');
}
