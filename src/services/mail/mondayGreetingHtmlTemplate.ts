import { getDoualaDateInfo } from '../taskSheetReportService';
import { extractFirstName, getWeeklyCoolQuote } from './mondayGreetingQuotesAndHelpers';
import { buildOutlookHtmlDocument } from './outlookEmailShell';

export function buildMondayGreetingHtml(options: {
  employeeName: string;
  dateStr?: string;
  quote?: string;
  appUrl?: string;
}): string {
  const firstName = extractFirstName(options.employeeName);
  const doualaTime = getDoualaDateInfo();
  const dateDisplay = options.dateStr || doualaTime.dateOnly;
  const quote = options.quote || getWeeklyCoolQuote().quote;
  const appUrl = options.appUrl || 'https://citrine-management.vercel.app';

  const innerHtml = `
    <tr>
      <td bgcolor="#004D40" class="email-pad" style="background-color: #004D40; padding: 26px 30px 22px 30px; text-align: left;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #00695C; border: 1px solid #26A69A; color: #E0F2F1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; margin-bottom: 10px;">
                Bon début de semaine
              </span>
              <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
                CITRINE MOBILITÉ
              </div>
              <div style="font-size: 13px; color: #A7F3D0; font-weight: 500; margin-top: 4px;">
                Lundi ${dateDisplay} · Douala, Cameroun
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" bgcolor="#ffffff" class="email-pad" style="padding: 20px 28px 10px 28px; background-color: #ffffff;">
        <img src="cid:humaans_monday" alt="Illustration Citrine Mobilité" width="240" height="240" style="display: block; max-width: 240px; width: 100%; height: auto; border: 2px solid #E0F2F1;" />
      </td>
    </tr>

    <tr>
      <td class="email-pad" style="padding: 16px 30px 24px 30px; text-align: left;">
        <h1 class="email-h1" style="font-size: 22px; font-weight: 900; color: #0F172A; margin: 0 0 14px 0; line-height: 1.25;">
          Bonjour ${firstName} !
        </h1>

        <p style="font-size: 15px; color: #1e293b; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">
          Un nouveau lundi, une nouvelle semaine et plein de belles opportunités à concrétiser !
        </p>

        <p style="font-size: 14.5px; color: #334155; line-height: 1.6; margin: 0 0 18px 0;">
          Toute l&apos;équipe vous souhaite une semaine productive, sereine et rythmée par l&apos;esprit d&apos;entraide chez Citrine Mobilité.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#E0F2F1" style="width: 100%; background-color: #E0F2F1; border: 1px solid #80CBC4; margin-bottom: 18px;">
          <tr>
            <td align="center" style="padding: 14px 18px; text-align: center; font-size: 15px; font-weight: 800; color: #004D40;">
              Belle semaine de réussite à vous chez Citrine Mobilité !
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFBEB" style="width: 100%; background-color: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; margin-bottom: 20px;">
          <tr>
            <td style="padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #B45309; margin-bottom: 5px;">
                À garder à l&apos;esprit :
              </div>
              <div style="font-size: 14px; font-style: italic; color: #78350F; line-height: 1.5; font-weight: 600;">
                ${quote}
              </div>
            </td>
          </tr>
        </table>

        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #004D40; margin-bottom: 10px;">
          3 repères pratiques pour une semaine efficace :
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8FAFC" style="width: 100%; background-color: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 8px;">
          <tr>
            <td style="padding: 12px 14px; font-size: 13.5px; color: #1E293B; line-height: 1.45;">
              <strong style="color: #00695C;">1. Priorités claires :</strong> Concentrez-vous d&apos;abord sur vos 2 ou 3 dossiers P1–P3 du jour.
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8FAFC" style="width: 100%; background-color: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 8px;">
          <tr>
            <td style="padding: 12px 14px; font-size: 13.5px; color: #1E293B; line-height: 1.45;">
              <strong style="color: #00695C;">2. Esprit d&apos;équipe :</strong> Signalez tout blocage opérationnel dès qu&apos;il survient pour obtenir du soutien.
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8FAFC" style="width: 100%; background-color: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 20px;">
          <tr>
            <td style="padding: 12px 14px; font-size: 13.5px; color: #1E293B; line-height: 1.45;">
              <strong style="color: #00695C;">3. Équilibre quotidien :</strong> Démarrage ponctuel à 08h00 et pause déjeuner respectée de 12h00 à 13h00.
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 6px 0 12px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="#00796B" style="background-color: #00796B;">
                <tr>
                  <td align="center" style="padding: 12px 28px;">
                    <a href="${appUrl}" target="_blank" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">
                      Ouvrir mon espace Citrine
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td bgcolor="#F8FAFC" class="email-pad-sm" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 28px; text-align: center;">
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #004D40;">
          CITRINE MOBILITÉ · DIRECTION DES RESSOURCES HUMAINES
        </p>
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: 'Bon début de semaine — Citrine Mobilité',
    maxWidth: 600,
    bodyBg: '#f1f5f9',
    cardBg: '#ffffff',
    innerHtml,
  });
}
