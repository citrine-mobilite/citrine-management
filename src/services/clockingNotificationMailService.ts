import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail, getEffectiveSmtpConfig, parseEmailList } from './serverMailService';
import { getDoualaDateInfo } from './timesheetReportService';
import { isArrivalAfterThreshold } from './weeklyAttendanceReportService';

export interface ClockingEmailNotificationInput {
  presence: any;
  action?: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | string;
  incident?: any;
  notification?: any;
  employeeName?: string;
  employeeEmail?: string;
  employeeId?: string | number;
}

/**
 * Service centralisé pour l'envoi d'e-mails de notification en temps réel
 * lors de chaque badgeage de présence ou de pause (Arrivée, Pause Début, Pause Fin, Départ).
 */
export async function sendClockingNotificationEmail(input: ClockingEmailNotificationInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const presence = input.presence || {};
  const doualaTime = getDoualaDateInfo();

  try {
    // 1. Récupération des employés, utilisateurs et paramètres d'entreprise
    const [employees, users, companySettingsList] = await Promise.all([
      getCollectionData('employees'),
      getCollectionData('users'),
      getCollectionData('company_settings'),
    ]);

    // Identification du collaborateur
    const empId = String(input.employeeId || presence.employeeId || presence.employee_id || '');
    const empMatch = employees.find((e: any) => {
      const eId = String(e.id || '');
      const eUid = String(e.uid || '');
      const eDbId = String(e._dbId || '');
      return (empId && (eId === empId || eUid === empId || eDbId === empId)) ||
        (input.employeeEmail && (e.email || '').toLowerCase() === input.employeeEmail.toLowerCase()) ||
        (input.employeeName && (e.name || '').toLowerCase() === input.employeeName.toLowerCase());
    });

    const userMatch = users.find((u: any) => {
      const uId = String(u.id || '');
      return (empId && uId === empId) ||
        (empMatch?.email && (u.email || '').toLowerCase() === empMatch.email.toLowerCase()) ||
        (input.employeeEmail && (u.email || '').toLowerCase() === input.employeeEmail.toLowerCase());
    });

    const employeeName = input.employeeName || empMatch?.name || presence.employeeName || userMatch?.name || 'Collaborateur Citrine';
    const employeeEmail = input.employeeEmail || empMatch?.email || userMatch?.email || presence.employeeEmail || '';
    const department = empMatch?.department || 'Direction Générale';
    const position = empMatch?.position || empMatch?.jobTitle || 'Collaborateur';

    // Seuil de retard paramétré (ex: 08:30 ou 08:00 par défaut)
    const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
    let lateThreshold = '08:30';
    if (companySettings) {
      const rawVal =
        companySettings.lateThresholdTime ||
        companySettings.late_threshold_time ||
        companySettings.workStartTime ||
        companySettings.work_start_time;
      if (typeof rawVal === 'string' && rawVal.trim().includes(':')) {
        lateThreshold = rawVal.trim();
      }
    }

    // 2. Détermination précise de l'action de pointage badgée
    let actionKey = input.action;
    if (!actionKey && input.notification?.payload) {
      try {
        const parsedPayload = typeof input.notification.payload === 'string'
          ? JSON.parse(input.notification.payload)
          : input.notification.payload;
        if (parsedPayload?.action) actionKey = parsedPayload.action;
      } catch {}
    }

    // Si non explicite, inférer depuis la présence
    if (!actionKey) {
      if (presence.departureTime) actionKey = 'departure';
      else if (presence.pauseEnd) actionKey = 'pauseEnd';
      else if (presence.pauseStart) actionKey = 'pauseStart';
      else if (presence.sortieProEnd) actionKey = 'sortieProEnd';
      else if (presence.sortieProStart) actionKey = 'sortieProStart';
      else actionKey = 'arrival';
    }

    // Normalisation de l'action
    actionKey = String(actionKey).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); // pause_start -> pauseStart

    let actionLabel = 'Pointage';
    let actionDescription = 'Pointage enregistré';
    let actionTime = doualaTime.timeOnly;
    let themeColor = '#1F625E'; // Vert Citrine
    let badgeBg = '#ecfdf5';
    let badgeBorder = '#a7f3d0';
    let badgeText = '#065f46';
    let iconEmoji = '⏱️';

    if (actionKey === 'arrival') {
      actionTime = presence.arrivalTime || doualaTime.timeOnly;
      const isLate = presence.status === 'late' || isArrivalAfterThreshold(actionTime, lateThreshold);
      if (isLate) {
        actionLabel = 'Arrivée (Retard constaté)';
        actionDescription = `Arrivée badgée après le seuil officiel de ${lateThreshold}`;
        themeColor = '#d97706'; // Ambre
        badgeBg = '#fffbeb';
        badgeBorder = '#fde68a';
        badgeText = '#92400e';
        iconEmoji = '⚠️';
      } else {
        actionLabel = 'Arrivée au poste';
        actionDescription = 'Prise de service ponctuelle au bureau';
        iconEmoji = '🟢';
      }
    } else if (actionKey === 'pauseStart') {
      actionTime = presence.pauseStart || doualaTime.timeOnly;
      actionLabel = 'Début de Pause Déjeuner';
      actionDescription = 'Mise en pause journalière (plage officielle : 12h00 – 13h00)';
      themeColor = '#2563eb'; // Bleu
      badgeBg = '#eff6ff';
      badgeBorder = '#bfdbfe';
      badgeText = '#1e40af';
      iconEmoji = '☕';
    } else if (actionKey === 'pauseEnd') {
      actionTime = presence.pauseEnd || doualaTime.timeOnly;
      actionLabel = 'Fin de Pause / Reprise';
      actionDescription = 'Reprise de poste opérationnelle après pause';
      themeColor = '#059669'; // Émeraude
      badgeBg = '#ecfdf5';
      badgeBorder = '#a7f3d0';
      badgeText = '#065f46';
      iconEmoji = '💼';
    } else if (actionKey === 'departure') {
      actionTime = presence.departureTime || doualaTime.timeOnly;
      const plannedDeparture = companySettings?.plannedDepartureTime || '17:00';
      const isEarly = actionTime < plannedDeparture;
      if (isEarly) {
        actionLabel = 'Départ (Sortie Prématurée)';
        actionDescription = `Départ badgé avant l'horaire contractuel de ${plannedDeparture}`;
        themeColor = '#e11d48'; // Rouge rosé
        badgeBg = '#fff1f2';
        badgeBorder = '#fecdd3';
        badgeText = '#9f1239';
        iconEmoji = '🚪';
      } else {
        actionLabel = 'Départ de fin de journée';
        actionDescription = 'Clôture de journée de travail effectuée';
        themeColor = '#475569';
        badgeBg = '#f1f5f9';
        badgeBorder = '#cbd5e1';
        badgeText = '#334155';
        iconEmoji = '🏁';
      }
    } else if (actionKey === 'sortieProStart') {
      actionTime = presence.sortieProStart || doualaTime.timeOnly;
      actionLabel = 'Départ en Mission Professionnelle';
      actionDescription = 'Sortie extérieure pour motif professionnel';
      themeColor = '#7c3aed';
      badgeBg = '#f5f3ff';
      badgeBorder = '#ddd6fe';
      badgeText = '#5b21b6';
      iconEmoji = '🚗';
    } else if (actionKey === 'sortieProEnd') {
      actionTime = presence.sortieProEnd || doualaTime.timeOnly;
      actionLabel = 'Retour de Mission Professionnelle';
      actionDescription = 'Réintégration au bureau après mission extérieure';
      themeColor = '#7c3aed';
      badgeBg = '#f5f3ff';
      badgeBorder = '#ddd6fe';
      badgeText = '#5b21b6';
      iconEmoji = '🏢';
    }

    // Méthode de badgeage lisible
    const rawMethod = presence.clockingMethod || presence.method || 'Standard';
    const methodLabels: Record<string, string> = {
      qr_code_dynamic: 'Scan QR Code Dynamique Tournant',
      qr_code_door: 'Scan QR Code de Porte',
      qr_code_mobile: 'Scan Mobile Sécurisé',
      kiosk_pin: 'Borne Tactile Kiosque (Code PIN)',
      badge_code_16: 'Carte / Badge Numérique 16 Chiffres',
      manual_admin: 'Validation Administrative par le Responsable',
      admin_on_behalf: 'Pointage par Délégation RH',
      gps: 'Application Collaborateur (Géolocalisation GPS)',
    };
    const methodClean = methodLabels[rawMethod] || rawMethod;

    // Emplacement géographique
    const locationClean = presence.location || 'Siège Citrine - Japoma Carrefour Matango';

    // 3. Destinataires : Administrateurs + RH (+ Collaborateur en copie)
    const admins = users.filter((u: any) => u.role_id === 1 || u.role === 'administrateur' || String(u.raw_data?.role).toLowerCase().includes('admin'));
    const adminEmails = admins.map((a: any) => a.email).filter(Boolean);

    const smtpConfig = await getEffectiveSmtpConfig();
    const hrEmails = parseEmailList(smtpConfig.hrEmail);

    const recipientSet = new Set<string>();
    adminEmails.forEach((e: string) => recipientSet.add(e.toLowerCase().trim()));
    hrEmails.forEach((e: string) => recipientSet.add(e.toLowerCase().trim()));

    // Ajouter le collaborateur s'il a un e-mail valide
    if (employeeEmail && employeeEmail.includes('@')) {
      recipientSet.add(employeeEmail.toLowerCase().trim());
    }

    if (recipientSet.size === 0) {
      if (process.env.HR_NOTIFICATION_EMAIL) recipientSet.add(process.env.HR_NOTIFICATION_EMAIL.toLowerCase().trim());
      else if (process.env.SMTP_USER) recipientSet.add(process.env.SMTP_USER.toLowerCase().trim());
      else recipientSet.add('citrinemobilite@gmail.com');
    }

    const recipientList = Array.from(recipientSet);

    // 4. Construction de l'e-mail HTML stylisé et professionnel
    const htmlContent = `
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
                    <td style="padding: 4px 0; color: #334155; font-weight: 600;">${doualaTime.fullDateStr}</td>
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

              ${input.incident?.reason ? `
              <!-- Alerte Incident Associé -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin-top: 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="28" valign="top">⚠️</td>
                    <td style="font-size: 13px; color: #92400e; line-height: 1.4;">
                      <strong>Incident consigné :</strong> ${input.incident.reason}
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

    // 5. Envoi via le fil de discussion unifié du collaborateur
    console.log(`📨 [MAIL POINTAGE] Envoi notification "${actionLabel}" pour ${employeeName} vers ${recipientList.length} destinataire(s)...`);

    const result = await sendThreadedEmployeeEmail({
      employeeName,
      employeeId: empId,
      employeeEmail,
      eventTitle: `Pointage : ${actionLabel}`,
      threadCategory: 'attendance',
      threadSubject: `Pointage & Présence - ${employeeName}`,
      htmlContent,
      recipientEmails: recipientList,
    });

    if (result.success) {
      console.log(`✅ [MAIL POINTAGE SUCCÈS] Notification de pointage envoyée pour ${employeeName} (${actionLabel}).`);
    } else {
      console.warn(`⚠️ [MAIL POINTAGE AVERTISSEMENT] Résultat :`, result.error);
    }

    return result;
  } catch (error: any) {
    const rawError = error?.message || String(error);
    console.error(`❌ [sendClockingNotificationEmail Error]:`, error);
    return {
      success: false,
      error: rawError,
    };
  }
}
