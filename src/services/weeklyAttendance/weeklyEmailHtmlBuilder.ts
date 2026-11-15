import { WeeklyAttendanceReportData } from './weeklyReportTypes';
import { buildEmployeeSummaryCardHtml } from './weeklyEmailEmployeeCardHtml';

export function buildWeeklyConsolidatedEmailHtml(data: WeeklyAttendanceReportData): string {
  const badgeText = data.isManualTrigger
    ? 'Point d’Étape en Cours de Semaine'
    : 'Bilan Hebdomadaire Officiel (Clôture)';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 860px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background: linear-gradient(135deg, #164e4b 0%, #064e3b 100%); padding: 30px; text-align: left; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">CITRINE MOBILITÉ</div>
                    <div style="font-size: 11px; color: #a7f3d0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Direction des Ressources Humaines &amp; Opérations</div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); color: #ffffff; font-size: 10px; font-weight: bold; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);">${badgeText}</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.2);">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 1.3;">${data.title}</h1>
                <div style="font-size: 12px; color: #ccfbf1; margin-top: 6px;">Période analysée : <strong>${data.startDateStr}</strong> au <strong>${data.endDateStr}</strong></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 14px 30px; font-size: 12px; color: #166534; line-height: 1.5;">
              📢 <strong>Information Équipe :</strong> Ce rapport unique consolidé regroupe l’assiduité de l’ensemble des collaborateurs pour la semaine. Les responsables ont reçu le rapport en destinataires principaux et l’ensemble des collaborateurs sont en copie (CC) pour transparence opérationnelle.
              <div style="margin-top: 6px; font-size: 11px; color: #15803d; font-weight: 600;">
                ⏱️ <strong>Heure limite de retard appliquée :</strong> ${data.lateThreshold} (par défaut 08:00 si non configurée) • 👥 <em>Comptes Super Administrateurs exclus du récapitulatif.</em>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 10px 0;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Collaborateurs</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${data.totalCollaborators}</div>
                    <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-top: 2px;">Actifs suivis</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Heures Équipe</div>
                    <div style="font-size: 20px; font-weight: 800; color: #164e4b; margin-top: 4px;">${data.totalCollectiveHoursText}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Temps cumulé</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Assiduité Moy.</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px;">${data.averageAttendanceRate}%</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Présence globale</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Retards Signalés</div>
                    <div style="font-size: 20px; font-weight: 800; color: ${data.totalLateness > 0 ? '#b91c1c' : '#10b981'}; margin-top: 4px;">${data.totalLateness}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Seuil : &gt; ${data.lateThreshold}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px;">
              <div style="font-size: 13px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 2px solid #164e4b; padding-bottom: 6px;">📋 Registre Individuel Détaillé par Collaborateur</div>
              ${data.summaries.map((emp) => buildEmployeeSummaryCardHtml(emp)).join('')}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #e4e4e7; padding: 24px 30px; text-align: center; font-size: 11px; color: #71717a;">
              <div style="font-weight: 700; color: #3f3f46; font-size: 12px; margin-bottom: 4px;">Citrine Mobilité — Douala, Cameroun</div>
              <div>Généré automatiquement par le Système Intégré RH &amp; Pointage le ${data.generatedAtStr}</div>
              <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px;">Notification interne confidentielle • Strictement réservée aux collaborateurs et à la direction</div>
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
