import { ClockingAppearance } from './clockingNotificationHelpers';

interface ClockingHtmlParams {
  appearance: ClockingAppearance;
  employeeName: string;
  department: string;
  position: string;
  fullDateStr: string;
  presence: any;
  incident?: any;
}

export function buildClockingNotificationHtml({
  appearance,
  employeeName,
  department,
  position,
  fullDateStr,
  presence,
  incident,
}: ClockingHtmlParams): string {
  const {
    actionLabel,
    actionDescription,
    actionTime,
    themeColor,
    badgeBg,
    badgeBorder,
    badgeText,
    iconEmoji,
    methodClean,
    locationClean,
  } = appearance;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pointage : ${actionLabel} - ${employeeName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 25px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0">
          
          <!-- En-tête Citrine Mobilité -->
          <tr>
            <td style="background: linear-gradient(135deg, #1F625E 0%, #0d3835 100%); padding: 24px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                      CITRINE MOBILITÉ
                    </span>
                    <span style="display: block; font-size: 11px; color: #A7F3D0; font-weight: 500; margin-top: 2px;">
                      Gestion Intégrée des Présences & Temps de Travail
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); color: #ffffff; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25);">
                      Notification en Direct
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bannière Statut Action -->
          <tr>
            <td style="padding: 24px 28px 16px 28px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: ${themeColor}; margin-bottom: 6px;">
                      Relevé Automatique de Pointage
                    </span>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${iconEmoji} ${actionLabel}
                    </h2>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                      ${actionDescription}
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeText}; font-size: 15px; font-weight: 800; padding: 6px 14px; border-radius: 10px; display: inline-block; text-align: center;">
                      ${actionTime}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Détails Collaborateur & Badgeage -->
          <tr>
            <td style="padding: 24px 28px;">
              
              <!-- Carte Identité Collaborateur -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 38%;">Collaborateur :</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${employeeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Département / Poste :</td>
                    <td style="padding: 4px 0; color: #334155;">${department} · ${position}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Date du jour :</td>
                    <td style="padding: 4px 0; color: #334155; font-weight: 600;">${fullDateStr}</td>
                  </tr>
                </table>
              </div>

              <!-- Tableau Synthétique du Pointage -->
              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 10px 0;">
                Paramètres &amp; Horodatage
              </h3>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 40%;">Action badgée</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: ${themeColor};">${actionLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Heure enregistrée</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${actionTime}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Dispositif de badge</td>
                  <td style="padding: 10px 14px; color: #334155;">${methodClean}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Site / Emplacement</td>
                  <td style="padding: 10px 14px; color: #334155;">${locationClean}</td>
                </tr>
              </table>

              <!-- Situation Complète du Jour (Arrivée, Pause, Départ) -->
              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 10px 0;">
                Horaires de la Journée
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 10px; padding: 12px; font-size: 12px; text-align: center;">
                <tr>
                  <td style="padding: 6px; width: 25%;">
                    <span style="display: block; color: #64748b; font-weight: 600; font-size: 11px;">Arrivée</span>
                    <strong style="color: #0f172a; font-size: 13px;">${presence.arrivalTime || '—'}</strong>
                  </td>
                  <td style="padding: 6px; width: 25%; border-left: 1px solid #e2e8f0;">
                    <span style="display: block; color: #64748b; font-weight: 600; font-size: 11px;">Pause (Début)</span>
                    <strong style="color: #0f172a; font-size: 13px;">${presence.pauseStart || '—'}</strong>
                  </td>
                  <td style="padding: 6px; width: 25%; border-left: 1px solid #e2e8f0;">
                    <span style="display: block; color: #64748b; font-weight: 600; font-size: 11px;">Pause (Fin)</span>
                    <strong style="color: #0f172a; font-size: 13px;">${presence.pauseEnd || '—'}</strong>
                  </td>
                  <td style="padding: 6px; width: 25%; border-left: 1px solid #e2e8f0;">
                    <span style="display: block; color: #64748b; font-weight: 600; font-size: 11px;">Départ</span>
                    <strong style="color: #0f172a; font-size: 13px;">${presence.departureTime || '—'}</strong>
                  </td>
                </tr>
              </table>

              ${incident?.reason ? `
              <!-- Alerte Incident Associé -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin-top: 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="28" valign="top">⚠️</td>
                    <td style="font-size: 13px; color: #92400e; line-height: 1.4;">
                      <strong>Incident consigné :</strong> ${incident.reason}
                    </td>
                  </tr>
                </table>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Pied de page officiel -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Ce pointage est horodaté et sécurisé par le Système de Gestion Intégrée Citrine Mobilité.<br>
                Plage officielle : Travail 08h00 – 17h00 · Pause Déjeuner stricte 12h00 – 13h00.
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
