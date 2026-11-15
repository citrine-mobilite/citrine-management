import { getDoualaDateInfo } from '../timesheetReportService';
import { extractFirstName, getWeeklyCoolQuote } from './mondayGreetingQuotesAndHelpers';

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

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon début de semaine — Citrine Mobilité</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 14px;">
    <tr>
      <td align="center">
        
        <!-- Conteneur Carte Material Design 3 -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- En-tête Supérieur Material You (Gradient Teal & Emerald) -->
          <tr>
            <td style="background: linear-gradient(135deg, #004D40 0%, #00695C 60%, #00897B 100%); padding: 32px 36px 24px 36px; text-align: left; position: relative;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.28); color: #E0F2F1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px;">
                      Bon début de semaine
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
                      CITRINE MOBILITÉ
                    </div>
                    <div style="font-size: 13px; color: #A7F3D0; font-weight: 500; margin-top: 4px;">
                      Lundi ${dateDisplay} · Douala, Cameroun
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.14); border-radius: 50%; text-align: center; line-height: 48px; font-size: 22px;">
                      ☕
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bloc Illustration Humaans avec Halo Doux -->
          <tr>
            <td align="center" style="padding: 26px 36px 12px 36px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background: radial-gradient(circle, #E0F2F1 0%, #ffffff 70%); border-radius: 24px; padding: 12px; display: inline-block;">
                      <img src="cid:humaans_monday" alt="Personnage Humaans vous souhaitant un bon lundi" width="260" height="260" style="display: block; max-width: 260px; width: 100%; height: auto; border-radius: 18px; box-shadow: 0 8px 24px rgba(0, 105, 92, 0.12); border: 2px solid #ffffff;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Chaleureux Exact & Personnalisé -->
          <tr>
            <td style="padding: 16px 36px 24px 36px; text-align: left;">
              
              <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin: 0 0 16px 0; line-height: 1.25;">
                Hello ${firstName} !
              </h1>

              <p style="font-size: 15.5px; color: #1e293b; line-height: 1.6; margin: 0 0 14px 0; font-weight: 600;">
                Un nouveau lundi, une nouvelle semaine et plein de belles choses à accomplir ! 😎
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 14px 0;">
                On espère que tu es prêt(e) à attaquer cette semaine avec le plein d'énergie, de motivation et de bonne humeur.
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Que les idées fusent, que les objectifs avancent et que les petites victoires s'enchaînent ! 🚀
              </p>

              <div style="background-color: #E0F2F1; border: 1.5px solid #80CBC4; border-radius: 14px; padding: 14px 20px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 15.5px; font-weight: 800; color: #004D40;">
                  On se souhaite une belle semaine de réussite chez Citrine Mobilité ! 💚
                </span>
              </div>

              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #B45309; margin-bottom: 5px;">
                  Il faut garder en tete que:
                </div>
                <div style="font-size: 14px; font-style: italic; color: #78350F; line-height: 1.5; font-weight: 600;">
                  ${quote}
                </div>
              </div>

              <div style="margin-bottom: 26px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #004D40; margin-bottom: 12px;">
                  3 petits tips bienveillants pour une semaine au top :
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">🎯</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">On pose les priorités au calme :</strong> Un pas après l'autre ! Commence par les 2 ou 3 dossiers qui comptent le plus, avance à ton rythme et valide tes étapes sans stress.
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">🤝</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">L'esprit d'équipe avant tout :</strong> Une question, un petit blocage ou une bonne idée ? N'hésite pas à échanger, on est toute une équipe prête à s'épauler avec le sourire !
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">⚡</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">Prends soin de ton énergie :</strong> On démarre motivés dès 08h00, et à midi, pause déjeuner sacrée pour recharger les batteries, déconnecter et souffler !
                    </td>
                  </tr>
                </table>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 16px 0;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #00796B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 28px; box-shadow: 0 4px 14px rgba(0, 121, 107, 0.35); letter-spacing: 0.3px;">
                      🚀 Ouvrir mon espace Citrine
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page Material Design 3 -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #004D40;">
                CITRINE MOBILITÉ · DIRECTION DES RESSOURCES HUMAINES
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
