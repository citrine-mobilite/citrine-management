import { ClockingAppearance } from './clockingNotificationHelpers';
import { buildOutlookHtmlDocument } from './outlookEmailShell';

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
    methodClean,
    locationClean,
  } = appearance;

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
                Gestion Intégrée des Présences &amp; Temps de Travail
              </span>
            </td>
            <td align="right" class="email-stack-left">
              <span style="display: inline-block; background-color: #0d3835; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 12px; border: 1px solid #2A7B76;">
                Notification en Direct
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="email-pad" style="padding: 20px 26px 16px 26px; border-bottom: 1px solid #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-stack">
              <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: ${themeColor}; margin-bottom: 4px;">
                Relevé Automatique de Pointage
              </span>
              <h2 class="email-h1" style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                ${actionLabel}
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                ${actionDescription}
              </p>
            </td>
            <td align="right" valign="top" class="email-stack-left">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="${badgeBg}" style="background-color: ${badgeBg}; border: 1px solid ${badgeBorder};">
                <tr>
                  <td align="center" style="padding: 6px 14px; color: ${badgeText}; font-size: 15px; font-weight: 800; font-family: Consolas, monospace;">
                    ${actionTime}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="email-pad" style="padding: 20px 26px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #cbd5e1; margin-bottom: 18px;">
          <tr>
            <td class="email-pad-sm" style="padding: 14px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                <tr>
                  <td class="email-kv-label" style="padding: 4px 0; color: #64748b; font-weight: 600; width: 38%;">Collaborateur :</td>
                  <td class="email-kv-val" style="padding: 4px 0; font-weight: 700; color: #0f172a;">${employeeName}</td>
                </tr>
                <tr>
                  <td class="email-kv-label" style="padding: 4px 0; color: #64748b; font-weight: 600;">Département / Poste :</td>
                  <td class="email-kv-val" style="padding: 4px 0; color: #334155;">${department} · ${position}</td>
                </tr>
                <tr>
                  <td class="email-kv-label" style="padding: 4px 0; color: #64748b; font-weight: 600;">Date du jour :</td>
                  <td class="email-kv-val" style="padding: 4px 0; color: #334155; font-weight: 600;">${fullDateStr}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 8px 0;">
          Paramètres &amp; Horodatage
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 13px; border: 1px solid #cbd5e1; margin-bottom: 18px;">
          <tr bgcolor="#f8fafc" style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 40%; border-bottom: 1px solid #e2e8f0;">Action badgée</td>
            <td style="padding: 10px 14px; font-weight: 700; color: ${themeColor}; border-bottom: 1px solid #e2e8f0;">${actionLabel}</td>
          </tr>
          <tr bgcolor="#ffffff" style="background-color: #ffffff;">
            <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Heure enregistrée</td>
            <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-family: Consolas, monospace; border-bottom: 1px solid #e2e8f0;">${actionTime}</td>
          </tr>
          <tr bgcolor="#f8fafc" style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Dispositif de badge</td>
            <td style="padding: 10px 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">${methodClean}</td>
          </tr>
          <tr bgcolor="#ffffff" style="background-color: #ffffff;">
            <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Site / Emplacement</td>
            <td style="padding: 10px 14px; color: #334155;">${locationClean}</td>
          </tr>
        </table>

        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 8px 0;">
          Horaires de la Journée
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9" style="width: 100%; background-color: #f1f5f9; border: 1px solid #cbd5e1; font-size: 12px; text-align: center;">
          <tr>
            <td class="email-kpi-cell" style="padding: 10px 6px; width: 25%;">
              <div style="color: #64748b; font-weight: 600; font-size: 11px;">Arrivée</div>
              <strong style="color: #0f172a; font-size: 13px; font-family: Consolas, monospace;">${presence.arrivalTime || '—'}</strong>
            </td>
            <td class="email-kpi-cell" style="padding: 10px 6px; width: 25%; border-left: 1px solid #cbd5e1;">
              <div style="color: #64748b; font-weight: 600; font-size: 11px;">Pause (Début)</div>
              <strong style="color: #0f172a; font-size: 13px; font-family: Consolas, monospace;">${presence.pauseStart || '—'}</strong>
            </td>
            <td class="email-kpi-cell" style="padding: 10px 6px; width: 25%; border-left: 1px solid #cbd5e1;">
              <div style="color: #64748b; font-weight: 600; font-size: 11px;">Pause (Fin)</div>
              <strong style="color: #0f172a; font-size: 13px; font-family: Consolas, monospace;">${presence.pauseEnd || '—'}</strong>
            </td>
            <td class="email-kpi-cell" style="padding: 10px 6px; width: 25%; border-left: 1px solid #cbd5e1;">
              <div style="color: #64748b; font-weight: 600; font-size: 11px;">Départ</div>
              <strong style="color: #0f172a; font-size: 13px; font-family: Consolas, monospace;">${presence.departureTime || '—'}</strong>
            </td>
          </tr>
        </table>

        ${incident?.reason ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffbeb" style="width: 100%; background-color: #fffbeb; border: 1px solid #fde68a; margin-top: 16px;">
          <tr>
            <td style="padding: 12px 14px; font-size: 13px; color: #92400e; line-height: 1.4;">
              <strong>Incident consigné :</strong> ${incident.reason}
            </td>
          </tr>
        </table>
        ` : ''}
      </td>
    </tr>

    <tr>
      <td bgcolor="#f8fafc" class="email-pad-sm" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
          Ce pointage est horodaté et sécurisé par le Système de Gestion Intégrée Citrine Mobilité.<br />
          Plage officielle : Travail 08h00 – 17h00 · Pause Déjeuner stricte 12h00 – 13h00.
        </p>
      </td>
    </tr>
  `;

  return buildOutlookHtmlDocument({
    title: `Pointage : ${actionLabel} - ${employeeName}`,
    maxWidth: 620,
    bodyBg: '#f8fafc',
    cardBg: '#ffffff',
    innerHtml,
  });
}
