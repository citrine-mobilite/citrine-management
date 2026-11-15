import { SmtpConfig } from './mailTypesAndParsing';
import { buildOutlookHtmlDocument } from './outlookEmailShell';

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

  const innerHtml = `
    <tr>
      <td bgcolor="#1F625E" class="email-pad" style="background-color: #1F625E; padding: 22px 26px; text-align: left;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-stack">
              <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                CITRINE MOBILITÉ
              </span>
              <span style="display: block; font-size: 11px; color: #A7F3D0; font-weight: 600; margin-top: 2px;">
                Direction des Ressources Humaines &amp; Opérations
              </span>
            </td>
            <td align="right" class="email-stack-left">
              <span style="display: inline-block; background-color: #0F3E3B; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border: 1px solid #2A7B76;">
                Fil RH Collaborateur
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding: 20px 26px 12px 26px; border-bottom: 1px solid #e7e5e4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-stack">
              <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #1F625E; text-transform: uppercase; letter-spacing: 0.8px;">
                Dossier : ${options.employeeName}
              </span>
              <h1 class="email-h1" style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; color: #0c0a09; line-height: 1.3;">
                ${options.eventTitle}
              </h1>
            </td>
            <td align="right" class="email-stack-left" style="vertical-align: top;">
              <span style="font-size: 11px; color: #78716c; font-family: Consolas, monospace;">
                ${dateStr}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="email-pad email-wrap-text" style="padding: 22px 26px; font-size: 14px; line-height: 1.6; color: #292524;">
        ${options.bodyHtml}
      </td>
    </tr>
    <tr>
      <td bgcolor="#fafaf9" class="email-pad-sm" style="background-color: #fafaf9; padding: 18px 26px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c;">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #44403c;">
          Citrine Mobilité — Douala, Cameroun
        </p>
        <p style="margin: 0; font-size: 10px; color: #a8a29e;">
          Système Automatisé de Gestion des Ressources Humaines &amp; Pointage · Notification interne confidentielle
        </p>
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: options.eventTitle,
    maxWidth: 600,
    bodyBg: '#f5f5f4',
    cardBg: '#ffffff',
    innerHtml,
  });
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
    `La feuille d'avancement des tâches officielle ainsi que le relevé d'activité sont consultables dans le corps du message et via le fichier tableur joint (.xlsx).`,
    ``,
    `Direction des Ressources Humaines & Opérations`,
    `Citrine Mobilité — Douala, Cameroun`,
  ].join('\n');
}
