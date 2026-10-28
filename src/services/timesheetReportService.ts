import * as XLSX from 'xlsx';

export interface TimesheetItem {
  index: number;
  taskTitle: string;
  subTitle: string;
  status: string; // 'completed' | 'in_progress' | 'todo' | 'blocked' etc.
  statusLabel: string;
  estimatedHours: number;
  actualHours: number;
  blockerReason?: string;
  isBlocked?: boolean;
}

export interface TimesheetBlocker {
  sourceTask: string;
  reason: string;
  status?: string;
  time?: string;
}

export interface TimesheetManagerPoint {
  sourceTask?: string;
  author?: string;
  content: string;
  time?: string;
  urgency?: string;
}

export interface TimesheetPriority {
  id?: string;
  title: string;
  priority?: string;
  status: string;
  isMilestone?: boolean;
}

export interface TimesheetScheduleSlot {
  timeRange: string;
  activity: string;
  isBuffer?: boolean;
  isBreak?: boolean;
  resolutionNote?: string;
}

export interface TimesheetReportData {
  employeeName: string;
  employeeEmail?: string;
  employeeId?: string | number;
  department?: string;
  dateStr?: string; // e.g. "21/09/2026" ou "mardi 27 octobre 2026"
  timeStr?: string; // e.g. "18:27"
  items: TimesheetItem[];
  blockers: TimesheetBlocker[];
  managerPoints: TimesheetManagerPoint[];
  totalEstimatedHours: number;
  totalActualHours: number;
  topPriorities?: TimesheetPriority[];
  scheduleSlots?: TimesheetScheduleSlot[];
  postponedTasks?: string[];
  location?: string;
  dayName?: string;
}

/**
 * Formate une date selon le fuseau horaire officiel du Cameroun (Africa/Douala - WAT UTC+1)
 */
export function getDoualaDateInfo(date: Date = new Date()): {
  dateOnly: string;
  timeOnly: string;
  fullDateStr: string;
  dayIso: string;
} {
  const fullFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateOnlyFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeOnlyFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = fullFormatter.format(date);
  const dateOnly = dateOnlyFormatter.format(date);
  const timeOnly = timeOnlyFormatter.format(date);

  const isoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayIso = isoFormatter.format(date);

  return {
    dateOnly,
    timeOnly,
    fullDateStr: `${parts} (Heure locale Douala, Cameroun)`,
    dayIso,
  };
}

/**
 * Normalise le statut pour affichage visuel
 */
export function normalizeStatusBadge(status?: string, completed?: boolean): { label: string; bg: string; color: string; border: string } {
  if (completed || status === 'completed' || status === 'done' || status === 'fait' || status === 'Fait' || status === 'termine') {
    return { label: 'Fait', bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
  }
  if (status === 'blocked' || status === 'bloque') {
    return { label: 'Bloqué', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
  }
  if (status === 'in_progress' || status === 'en_cours' || status === 'En cours') {
    return { label: 'En cours', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
  }
  return { label: 'À faire', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
}

/**
 * Construit les données dérivées nécessaires au Plan du Jour officiel Citrine
 */
function preparePlanDuJourData(data: TimesheetReportData) {
  const dept = (data.department || 'IT').toUpperCase();
  const dateText = data.dateStr || new Date().toLocaleDateString('fr-FR');
  const locationText = data.location || 'Douala';
  const dayText = data.dayName || dateText;

  // 1. Top 3 priorités
  let topPriorities = data.topPriorities || [];
  if (topPriorities.length === 0) {
    const uniqueParents: string[] = [];
    data.items.forEach((item) => {
      const p = item.taskTitle || item.subTitle;
      if (p && !uniqueParents.includes(p)) {
        uniqueParents.push(p);
      }
    });

    topPriorities = uniqueParents.slice(0, 3).map((p, idx) => ({
      id: `prio-${idx + 1}`,
      title: p,
      priority: idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3',
      status: data.items.filter((i) => i.taskTitle === p).every((i) => i.status === 'completed') ? 'Fait' : 'En cours',
    }));

    if (topPriorities.length === 0) {
      topPriorities = [
        { title: 'Prise de contact & coordination', priority: 'P1', status: 'Fait' },
        { title: 'Exécution des livrables clés', priority: 'P2', status: 'En cours' },
        { title: 'Clôture et revue opérationnelle', priority: 'P3', status: 'En cours' },
      ];
    }
  }

  // 2. Tâches détaillées
  const tasks = data.items.map((item, idx) => {
    const isDone = item.status === 'completed' || item.status === 'fait' || item.status === 'done';
    const isInProgress = item.status === 'in_progress' || item.status === 'en_cours';
    const statusText = isDone ? 'Fait' : isInProgress ? 'En cours' : 'À faire';

    return {
      title: item.subTitle || item.taskTitle,
      domain: item.taskTitle || 'Autre',
      priorityLabel: (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3') as 'P1' | 'P2' | 'P3',
      estimatedMinutes: Math.round((item.estimatedHours || 1) * 60),
      dueDate: dateText,
      status: statusText,
      isDone,
    };
  });

  const totalTasks = tasks.length || topPriorities.length;
  const completedTasks = tasks.filter((t) => t.isDone).length || topPriorities.filter((p) => p.status === 'Fait').length;
  const ratePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const postponedCount = Math.max(0, totalTasks - completedTasks);

  // 3. Plan horaire standard Citrine avec pause 13h-14h
  let scheduleSlots = data.scheduleSlots || [];
  if (scheduleSlots.length === 0) {
    const p1 = topPriorities[0]?.title || tasks[0]?.title || 'Prise de contact';
    const p2 = topPriorities[1]?.title || tasks[1]?.title || 'Exécution opérationnelle';
    const p3 = topPriorities[2]?.title || tasks[2]?.title || 'Création et finalisation des tâches';
    const p4 = tasks[3]?.title || 'Revue et synthèse de la journée';

    scheduleSlots = [
      { timeRange: '08:00 – 09:00', activity: p1 },
      { timeRange: '09:00 – 13:00', activity: p2 },
      { timeRange: '11:00 – 13:00', activity: p3 },
      { timeRange: '13:00 – 14:00', activity: '⚡ TAMPON IMPRÉVUS / pause', isBuffer: true, isBreak: true },
      { timeRange: '14:00 – 17:00', activity: p4 },
    ];
  }

  // 4. Imprévus
  const unforeseenEvents = data.blockers.map((b) => ({
    time: b.time || 'Journée',
    subject: b.sourceTask ? `[${b.sourceTask}] ${b.reason}` : b.reason,
    lostMinutes: 30,
  }));

  // 5. Bilan fin de journée
  let postponedTasks = data.postponedTasks || [];
  if (postponedTasks.length === 0) {
    postponedTasks = tasks.filter((t) => !t.isDone).map((t) => t.title);
  }

  const managerAlertPoint = data.managerPoints.length > 0
    ? data.managerPoints.map((p) => p.content).join(' ; ')
    : 'Aucun blocage majeur rencontré aujourd’hui.';

  return {
    dept,
    dateText,
    locationText,
    dayText,
    topPriorities,
    tasks,
    totalTasks,
    completedTasks,
    ratePercentage,
    postponedCount,
    scheduleSlots,
    unforeseenEvents,
    postponedTasks,
    managerAlertPoint,
  };
}

/**
 * Génère le code HTML complet et stylé conforme exactement aux captures d'écran
 * du modèle officiel Citrine "PLAN DU JOUR"
 */
export function buildPlanDuJourExcelHtml(data: TimesheetReportData): string {
  const p = preparePlanDuJourData(data);

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Plan du Jour</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 16px; }
        .company-header { font-family: Georgia, serif; font-size: 22pt; font-weight: bold; font-style: italic; color: #104c38; }
        .subtitle { font-family: Georgia, Calibri, sans-serif; font-size: 13pt; font-weight: bold; color: #92400e; border-bottom: 1.5px solid #92400e; padding-bottom: 4px; }
        .section-header { background-color: #0e3d2f; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; border: 1px solid #0e3d2f; }
        .col-header { background-color: #1f514c; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 6px 10px; border: 1px solid #143e3a; }
        td { font-size: 10pt; padding: 5px 8px; border: 1px solid #cbd5e1; }
        .blue-text { color: #1d4ed8; font-weight: bold; }
        .prio-p1 { background-color: #fee2e2; color: #dc2626; font-weight: bold; text-align: center; }
        .prio-p2 { color: #2563eb; font-weight: bold; text-align: center; }
        .prio-p3 { color: #2563eb; font-weight: bold; text-align: center; }
        .status-fait { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #a7f3d0; }
        .status-encours { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
        .status-afaire { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        .summary-row { background-color: #0e3d2f; color: #ffffff; font-weight: bold; }
        .tampon-row { background-color: #fef9c3; color: #854d0e; font-weight: bold; }
        .guide-title { color: #0e3d2f; font-weight: bold; font-size: 11pt; padding-top: 14px; }
        .guide-text { color: #334155; font-size: 9.5pt; line-height: 1.4; }
      </style>
    </head>
    <body>
      <!-- EN-TÊTE OFFICIEL CITRINE -->
      <table border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr>
          <td colspan="6" class="company-header" style="border: none; padding-bottom: 2px;">CITRINE</td>
        </tr>
        <tr>
          <td colspan="6" class="subtitle" style="border-top: none; border-left: none; border-right: none; margin-bottom: 8px;">
            PLAN DU JOUR — ${p.dept}
          </td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
        <tr>
          <td style="border: none; width: 140px;"><strong>Date :</strong> ${p.dateText}</td>
          <td style="border: none; width: 120px;" class="blue-text">${p.locationText}</td>
          <td style="border: none; width: 80px;"><strong>Jour :</strong></td>
          <td style="border: none;" colspan="2"></td>
          <td style="border: none; text-align: right;" class="blue-text">${p.dateText}</td>
        </tr>
        <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
      </table>

      <!-- 1. LES 3 PRIORITÉS DU JOUR -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</td>
        </tr>
        ${p.topPriorities.map((item, idx) => `
          <tr>
            <td style="width: 35px; text-align: center; font-weight: bold; color: #b45309;">${idx + 1}.</td>
            <td colspan="5" class="blue-text" style="text-decoration: underline;">${item.title}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 2. TÂCHES DU JOUR -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">📋 TÂCHES DU JOUR</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 34%;">Tâche</td>
          <td class="col-header" style="width: 16%;">Domaine</td>
          <td class="col-header" style="width: 10%; text-align: center;">Prio</td>
          <td class="col-header" style="width: 14%; text-align: center;">Estimé (min)</td>
          <td class="col-header" style="width: 12%; text-align: center;">Échéance</td>
          <td class="col-header" style="width: 14%; text-align: center;">Statut</td>
        </tr>
        ${p.tasks.map((t) => {
          const prioClass = t.priorityLabel === 'P1' ? 'prio-p1' : (t.priorityLabel === 'P2' ? 'prio-p2' : 'prio-p3');
          const statusClass = t.status === 'Fait' ? 'status-fait' : (t.status === 'En cours' ? 'status-encours' : 'status-afaire');
          return `
            <tr>
              <td class="blue-text">${t.title}</td>
              <td class="blue-text">${t.domain}</td>
              <td class="${prioClass}">${t.priorityLabel}</td>
              <td style="text-align: right;">${t.estimatedMinutes}</td>
              <td style="text-align: center;">${t.dueDate}</td>
              <td class="${statusClass}">${t.status}</td>
            </tr>
          `;
        }).join('')}
        <tr class="summary-row">
          <td colspan="2" style="border: 1px solid #0e3d2f; padding: 6px 10px;">Total / réalisées / taux</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.totalTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.completedTasks}</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.ratePercentage}%</td>
          <td style="border: 1px solid #0e3d2f; text-align: center;">${p.postponedCount} report.</td>
        </tr>
      </table>

      <!-- 3. PLAN HORAIRE -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">🕐 PLAN HORAIRE — garde un créneau « tampon » pour les imprévus</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 25%;">Heure</td>
          <td class="col-header" colspan="5">Ce que je fais sur ce créneau</td>
        </tr>
        ${p.scheduleSlots.map((s) => `
          <tr class="${s.isBuffer || s.isBreak ? 'tampon-row' : ''}">
            <td style="font-weight: bold;">${s.timeRange}</td>
            <td colspan="5" class="${s.isBuffer || s.isBreak ? '' : 'blue-text'}">${s.activity}</td>
          </tr>
        `).join('')}
      </table>

      <!-- 4. IMPRÉVUS SURVENUS AUJOURD'HUI -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td colspan="6" class="section-header">⚡ IMPRÉVUS SURVENUS AUJOURD'HUI</td>
        </tr>
        <tr>
          <td class="col-header" style="width: 20%;">Heure</td>
          <td class="col-header" colspan="4">Quoi ? (qui / quel sujet)</td>
          <td class="col-header" style="width: 20%; text-align: center;">Temps perdu (min)</td>
        </tr>
        ${p.unforeseenEvents.length > 0 ? p.unforeseenEvents.map((u) => `
          <tr>
            <td>${u.time}</td>
            <td colspan="4" class="blue-text">${u.subject}</td>
            <td style="text-align: right;">${u.lostMinutes} min</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 8px;">
              Aucun imprévu signalé aujourd'hui.
            </td>
          </tr>
        `}
      </table>

      <!-- 5. BILAN FIN DE JOURNÉE -->
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td colspan="6" class="section-header">☑️ BILAN FIN DE JOURNÉE (2 min)</td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; vertical-align: top; background-color: #f8fafc;">
            À reporter à demain :
          </td>
          <td colspan="5" class="blue-text" style="vertical-align: top;">
            ${p.postponedTasks.length > 0 ? p.postponedTasks.map((t) => `<div>${t}</div>`).join('') : 'Toutes les tâches du jour ont été clôturées !'}
          </td>
        </tr>
        <tr>
          <td style="width: 28%; font-weight: bold; background-color: #f8fafc;">
            Point à signaler au manager :
          </td>
          <td colspan="5" class="blue-text">
            ${p.managerAlertPoint}
          </td>
        </tr>
      </table>

      <!-- 6. COMMENT L'UTILISER -->
      <table border="0" style="width: 100%; margin-top: 10px;">
        <tr>
          <td colspan="6" class="guide-title" style="border: none;">Comment l'utiliser</td>
        </tr>
        <tr>
          <td colspan="6" class="guide-text" style="border: none;">
            • Le matin (5 min) : écris tes 3 priorités, liste tes tâches, choisis P1/P2/P3, pose-les dans le plan horaire. Garde le créneau tampon libre.
          </td>
        </tr>
        <tr>
          <td colspan="6" class="guide-text" style="border: none;">
            • Dans la journée : mets à jour le Statut (menu déroulant). Note chaque imprévu d'une ligne pour voir où part ton temps.
          </td>
        </tr>
        <tr>
          <td colspan="6" class="guide-text" style="border: none;">
            • Le soir (2 min) : reporte ce qui n'est pas fait à demain, écris le point manager. Recopie les chiffres dans l'onglet « Suivi manager ».
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Construit le corps HTML de la fiche de temps pour le mail
 * Identique au document officiel Citrine Plan du Jour
 */
/**
 * Construit le corps HTML de la fiche de temps pour le mail
 * Design Exécutif Haut de Gamme (Asana / Linear) avec KPI Flash, badges modernes et respect de l'identité Citrine
 */
export function buildTimesheetHtmlReport(data: TimesheetReportData): string {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';
  const hasBlockers = p.unforeseenEvents.length > 0 || (p.managerAlertPoint && !p.managerAlertPoint.toLowerCase().includes('aucun'));
  
  // Couleurs dynamiques selon taux de réussite
  const rateColor = p.ratePercentage >= 80 ? '#059669' : p.ratePercentage >= 50 ? '#d97706' : '#dc2626';
  const rateBg = p.ratePercentage >= 80 ? '#ecfdf5' : p.ratePercentage >= 50 ? '#fffbeb' : '#fef2f2';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px 12px; color: #1e293b;">
      <div style="max-width: 780px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- EN-TÊTE CITRINE OFFICIEL -->
        <div style="background: linear-gradient(135deg, #0e3d2f 0%, #164e4b 100%); padding: 24px 28px; color: #ffffff;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td>
                <div style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; font-style: italic; letter-spacing: 0.5px; color: #ffffff;">
                  CITRINE
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #fde68a; letter-spacing: 0.5px; margin-top: 4px; text-transform: uppercase;">
                  PLAN DU JOUR — ${p.dept}
                </div>
              </td>
              <td align="right" style="vertical-align: top;">
                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #ffffff;">
                  📍 ${p.locationText} • ${p.dayText}
                </div>
              </td>
            </tr>
          </table>

          <!-- INFO CARD COLLABORATEUR -->
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.18);">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #e2e8f0;">
                  Collaborateur : <strong style="color: #ffffff;">${employeeName}</strong>
                </td>
                <td align="right" style="font-size: 13px; color: #e2e8f0;">
                  Date de référence : <strong style="color: #ffffff;">${p.dateText}</strong>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- ⚡ BANDEAU DE SYNTHÈSE « KPI FLASH » (3 CARTES HERO) -->
        <div style="background-color: #f1f5f9; padding: 18px 24px; border-bottom: 1px solid #e2e8f0;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 12px 0;">
            <tr>
              <!-- CARTE 1: TAUX RÉALISATION -->
              <td width="33.33%" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 14px 16px; vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Taux du jour</div>
                <div style="font-size: 24px; font-weight: 800; color: ${rateColor}; margin: 6px 0 4px 0;">
                  ${p.ratePercentage}%
                </div>
                <!-- Mini barre de progression -->
                <div style="background-color: #e2e8f0; border-radius: 9999px; height: 6px; width: 100%; overflow: hidden; margin-bottom: 6px;">
                  <div style="background-color: ${rateColor}; height: 6px; border-radius: 9999px; width: ${p.ratePercentage}%;"></div>
                </div>
                <div style="font-size: 11px; color: #64748b;">${p.completedTasks} sur ${p.totalTasks} tâche(s) faite(s)</div>
              </td>

              <!-- CARTE 2: CHARGE HORAIRE -->
              <td width="33.33%" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 14px 16px; vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Charge Traitée</div>
                <div style="font-size: 24px; font-weight: 800; color: #0e3d2f; margin: 6px 0 4px 0;">
                  ${data.totalActualHours || (p.completedTasks > 0 ? p.completedTasks * 2 : 8)}h
                </div>
                <div style="font-size: 11px; color: #475569; margin-top: 8px;">
                  Estimé : <strong>${data.totalEstimatedHours || 8}h</strong>
                </div>
                <div style="font-size: 11px; color: #854d0e; font-weight: 600;">Pause tampon 13h–14h incluse</div>
              </td>

              <!-- CARTE 3: SANTÉ OPÉRATIONNELLE -->
              <td width="33.33%" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 14px 16px; vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Diagnostic</div>
                <div style="margin: 8px 0;">
                  <span style="display: inline-block; background-color: ${hasBlockers ? '#fef3c7' : '#d1fae5'}; color: ${hasBlockers ? '#92400e' : '#065f46'}; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid ${hasBlockers ? '#fde68a' : '#a7f3d0'};">
                    ${hasBlockers ? '⚠️ Attention requise' : '✅ Déroulement nominal'}
                  </span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  ${p.unforeseenEvents.length > 0 ? `${p.unforeseenEvents.length} imprévu(s) noté(s)` : '0 imprévu critique'} • ${p.postponedCount} report(s)
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding: 24px 28px;">

          <!-- 1. LES 3 PRIORITÉS DU JOUR -->
          <div style="margin-bottom: 24px; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="background-color: #0e3d2f; color: #ffffff; padding: 10px 16px; font-weight: 700; font-size: 13px; letter-spacing: 0.3px;">
              🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie
            </div>
            <div style="background-color: #ffffff; padding: 6px 12px;">
              ${p.topPriorities.map((item, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; ${idx < p.topPriorities.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
                  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="width: 32px; vertical-align: middle;">
                        <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background-color: #fef3c7; color: #92400e; font-weight: 800; font-size: 12px;">
                          ${idx + 1}
                        </span>
                      </td>
                      <td style="vertical-align: middle; padding-left: 6px;">
                        <span style="font-weight: 700; font-size: 13px; color: #1d4ed8; text-decoration: underline;">
                          ${item.title}
                        </span>
                        ${item.isMilestone ? '<span style="margin-left: 8px; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">🏆 JALON CLÉ</span>' : ''}
                      </td>
                      <td align="right" style="vertical-align: middle; width: 90px;">
                        <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; ${item.status === 'Fait' ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fef3c7; color: #92400e;'}">
                          ${item.status}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. TÂCHES DU JOUR (TABLEAU MODERNE & RESPONSIVE) -->
          <div style="margin-bottom: 24px; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="background-color: #0e3d2f; color: #ffffff; padding: 10px 16px; font-weight: 700; font-size: 13px;">
              📋 TÂCHES DU JOUR
            </div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #1f514c; color: #ffffff; font-size: 11px;">
                  <th style="padding: 9px 12px; text-align: left; font-weight: 700;">Tâche</th>
                  <th style="padding: 9px 10px; text-align: left; font-weight: 700;">Domaine</th>
                  <th style="padding: 9px 8px; text-align: center; font-weight: 700; width: 55px;">Prio</th>
                  <th style="padding: 9px 8px; text-align: right; font-weight: 700; width: 85px;">Estimé</th>
                  <th style="padding: 9px 8px; text-align: center; font-weight: 700; width: 85px;">Échéance</th>
                  <th style="padding: 9px 10px; text-align: center; font-weight: 700; width: 95px;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${p.tasks.map((t, index) => {
                  const prioBadge = t.priorityLabel === 'P1'
                    ? '<span style="background-color: #fee2e2; color: #dc2626; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 4px;">P1</span>'
                    : (t.priorityLabel === 'P2'
                      ? '<span style="background-color: #dbeafe; color: #2563eb; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 4px;">P2</span>'
                      : '<span style="background-color: #fef3c7; color: #d97706; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 4px;">P3</span>');

                  const statusBadge = t.status === 'Fait'
                    ? '<span style="background-color: #d1fae5; color: #065f46; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 12px; border: 1px solid #a7f3d0;">✓ Fait</span>'
                    : (t.status === 'En cours'
                      ? '<span style="background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 12px; border: 1px solid #fde68a;">⏳ En cours</span>'
                      : '<span style="background-color: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 12px; border: 1px solid #cbd5e1;">À faire</span>');

                  const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

                  return `
                    <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px 12px; color: #1d4ed8; font-weight: 600;">${t.title}</td>
                      <td style="padding: 8px 10px; color: #475569;">${t.domain}</td>
                      <td style="padding: 8px 8px; text-align: center;">${prioBadge}</td>
                      <td style="padding: 8px 8px; text-align: right; color: #334155; font-weight: 600;">${t.estimatedMinutes} min</td>
                      <td style="padding: 8px 8px; text-align: center; color: #64748b;">${t.dueDate}</td>
                      <td style="padding: 8px 10px; text-align: center;">${statusBadge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #0e3d2f; color: #ffffff; font-weight: 700;">
                  <td colspan="2" style="padding: 10px 12px;">Total / Réalisées / Taux global</td>
                  <td style="text-align: center; padding: 10px 6px;">${p.totalTasks}</td>
                  <td style="text-align: right; padding: 10px 8px;">${p.completedTasks} faites</td>
                  <td style="text-align: center; padding: 10px 6px;">${p.ratePercentage}%</td>
                  <td style="text-align: center; padding: 10px 6px; color: #fde68a;">${p.postponedCount} report.</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 3. PLAN HORAIRE DE LA JOURNÉE (TIMELINE ÉPURÉE) -->
          <div style="margin-bottom: 24px; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="background-color: #0e3d2f; color: #ffffff; padding: 10px 16px; font-weight: 700; font-size: 13px;">
              🕐 PLAN HORAIRE — garde un créneau « tampon » pour les imprévus
            </div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #1f514c; color: #ffffff; font-size: 11px;">
                  <th style="padding: 8px 12px; text-align: left; width: 140px; font-weight: 700;">Heure</th>
                  <th style="padding: 8px 12px; text-align: left; font-weight: 700;">Ce que je fais sur ce créneau</th>
                </tr>
              </thead>
              <tbody>
                ${p.scheduleSlots.map((s) => {
                  const isTampon = s.isBuffer || s.isBreak;
                  const rowBg = isTampon ? '#fef9c3' : '#ffffff';
                  const textColor = isTampon ? '#854d0e' : '#1d4ed8';

                  return `
                    <tr style="background-color: ${rowBg}; border-bottom: 1px solid ${isTampon ? '#fef08a' : '#e2e8f0'};">
                      <td style="padding: 8px 12px; font-weight: 700; color: ${isTampon ? '#854d0e' : '#1e293b'};">
                        ${s.timeRange}
                      </td>
                      <td style="padding: 8px 12px; font-weight: 600; color: ${textColor};">
                        ${isTampon ? '⚡ TAMPON IMPRÉVUS / pause' : s.activity}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- 4. IMPRÉVUS SURVENUS AUJOURD'HUI -->
          <div style="margin-bottom: 24px; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="background-color: #0e3d2f; color: #ffffff; padding: 10px 16px; font-weight: 700; font-size: 13px;">
              ⚡ IMPRÉVUS SURVENUS AUJOURD'HUI
            </div>
            ${p.unforeseenEvents.length > 0 ? `
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background-color: #1f514c; color: #ffffff; font-size: 11px;">
                    <th style="padding: 8px 12px; text-align: left; width: 110px;">Heure</th>
                    <th style="padding: 8px 12px; text-align: left;">Quoi ? (qui / quel sujet)</th>
                    <th style="padding: 8px 12px; text-align: right; width: 140px;">Temps perdu</th>
                  </tr>
                </thead>
                <tbody>
                  ${p.unforeseenEvents.map((u) => `
                    <tr style="background-color: #fffbeb; border-bottom: 1px solid #fde68a;">
                      <td style="padding: 8px 12px; font-weight: 700; color: #92400e;">${u.time}</td>
                      <td style="padding: 8px 12px; color: #92400e; font-weight: 600;">${u.subject}</td>
                      <td style="padding: 8px 12px; text-align: right; color: #b45309; font-weight: 700;">${u.lostMinutes} min</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div style="background-color: #ecfdf5; padding: 12px 18px; color: #065f46; font-size: 12px; font-weight: 600;">
                ✅ Aucun imprévu ou difficulté signalée. La journée s'est déroulée selon le planning nominal.
              </div>
            `}
          </div>

          <!-- 5. BILAN FIN DE JOURNÉE & POINTS MANAGER -->
          <div style="margin-bottom: 24px; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden;">
            <div style="background-color: #0e3d2f; color: #ffffff; padding: 10px 16px; font-weight: 700; font-size: 13px;">
              ☑️ BILAN FIN DE JOURNÉE (2 min)
            </div>
            <div style="padding: 16px; background-color: #ffffff;">
              <!-- À reporter à demain -->
              <div style="margin-bottom: 14px;">
                <div style="font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">
                  📌 À reporter à demain :
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #1d4ed8; font-weight: 600;">
                  ${p.postponedTasks.length > 0
                    ? p.postponedTasks.map((t) => `<div style="padding: 3px 0;">• ${t}</div>`).join('')
                    : '<div style="color: #059669;">🎉 Aucune tâche reportée — 100% des engagements du jour ont été clôturés !</div>'}
                </div>
              </div>

              <!-- Point à signaler au manager -->
              <div>
                <div style="font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">
                  💬 Point à signaler au manager :
                </div>
                <div style="background-color: ${hasBlockers ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${hasBlockers ? '#fde68a' : '#e2e8f0'}; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: ${hasBlockers ? '#92400e' : '#1e293b'}; font-weight: 600;">
                  ${p.managerAlertPoint || 'Aucun blocage particulier à signaler.'}
                </div>
              </div>
            </div>
          </div>

          <!-- 6. COMMENT L'UTILISER (GUIDE MÉTHODOLOGIQUE) -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 11px; color: #475569; line-height: 1.6;">
            <div style="font-weight: 800; color: #0e3d2f; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">
              Comment l'utiliser au quotidien
            </div>
            <div>• <strong style="color: #1e293b;">Le matin (5 min) :</strong> écris tes 3 priorités, liste tes tâches, choisis P1/P2/P3, pose-les dans le plan horaire. Garde le créneau tampon libre.</div>
            <div>• <strong style="color: #1e293b;">Dans la journée :</strong> mets à jour le Statut (menu déroulant). Note chaque imprévu d'une ligne pour voir où part ton temps.</div>
            <div>• <strong style="color: #1e293b;">Le soir (2 min) :</strong> reporte ce qui n'est pas fait à demain, écris le point manager. Recopie les chiffres dans l'onglet « Suivi manager ».</div>
          </div>

          <!-- BOUTON D'ACTION DIRECT (CTA MANAGER) -->
          <div style="text-align: center; margin-top: 10px; margin-bottom: 8px;">
            <a href="https://ais-pre-b3vg5qszt7gkoqpkdf7qtf-526853028491.europe-west2.run.app" target="_blank" style="display: inline-block; background-color: #0e3d2f; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(14, 61, 47, 0.25);">
              📂 Ouvrir la feuille dans le portail Citrine ↗
            </a>
          </div>

          <!-- FOOTER EXÉCUTIF RH -->
          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px;">
            Rapport officiel généré par Citrine Mobilité RH • Fuseau horaire officiel Africa/Douala (UTC+1)<br/>
            <em>Le classeur Excel officiel (.xlsx) est joint en pièce jointe pour archivage et exploitation administrative.</em>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Construit un classeur Microsoft Excel natif et valide (.xlsx - OpenXML)
 * Respecte à 100% l'organisation en 6 sections du Plan du Jour Citrine
 * et élimine tout risque de faux positif anti-spam (MIME extension mismatch).
 */
export function buildTimesheetXlsxWorkbook(data: TimesheetReportData): XLSX.WorkBook {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || 'Collaborateur';

  const rows: any[][] = [
    ['CITRINE MOBILITÉ'],
    [`PLAN DU JOUR — ${p.dept}`],
    [`Collaborateur : ${employeeName}`, `Date : ${p.dateText}`, `Ville : ${p.locationText}`, `Jour : ${p.dayText}`],
    [],
    ['🎯 LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie'],
    ...p.topPriorities.map((item, idx) => [`${idx + 1}.`, item.title, item.status]),
    [],
    ['📋 TÂCHES DU JOUR'],
    ['Tâche', 'Domaine', 'Prio', 'Estimé (min)', 'Échéance', 'Statut'],
    ...p.tasks.map((t) => [
      t.title,
      t.domain,
      t.priorityLabel,
      t.estimatedMinutes,
      t.dueDate,
      t.status,
    ]),
    ['Total / réalisées / taux', '', p.totalTasks, p.completedTasks, `${p.ratePercentage}%`, `${p.postponedCount} report.`],
    [],
    ['🕐 PLAN HORAIRE — garde un créneau « tampon » pour les imprévus'],
    ['Heure', 'Ce que je fais sur ce créneau'],
    ...p.scheduleSlots.map((s) => [s.timeRange, s.isBuffer || s.isBreak ? '⚡ TAMPON IMPRÉVUS / pause' : s.activity]),
    [],
    ['⚡ IMPRÉVUS SURVENUS AUJOURD\'HUI'],
    ['Heure', 'Quoi ? (qui / quel sujet)', 'Temps perdu (min)'],
    ...(p.unforeseenEvents.length > 0
      ? p.unforeseenEvents.map((u) => [u.time, u.subject, u.lostMinutes])
      : [['Journée', 'Aucun imprévu ou incident majeur signalé aujourd’hui.', 0]]),
    [],
    ['☑️ BILAN FIN DE JOURNÉE (2 min)'],
    ['À reporter à demain :', p.postponedTasks.length > 0 ? p.postponedTasks.join(' ; ') : 'Aucune tâche reportée — 100% clôturé'],
    ['Point à signaler au manager :', p.managerAlertPoint || 'Déroulement nominal, aucun blocage'],
    [],
    ['Comment l\'utiliser au quotidien'],
    ['• Le matin (5 min) : écris tes 3 priorités, liste tes tâches, choisis P1/P2/P3, pose-les dans le plan horaire. Garde le créneau tampon libre.'],
    ['• Dans la journée : mets à jour le Statut (menu déroulant). Note chaque imprévu d\'une ligne pour voir où part ton temps.'],
    ['• Le soir (2 min) : reporte ce qui n\'est pas fait à demain, écris le point manager. Recopie les chiffres dans l\'onglet « Suivi manager ».']
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs de colonnes optimisées pour une lecture parfaite dans Microsoft Excel
  ws['!cols'] = [
    { wch: 34 },
    { wch: 26 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Plan du Jour');
  return wb;
}

/**
 * Génère le fichier Excel (.xlsx) binaire officiel sous forme de Buffer
 * Signature binaire OpenXML réelle (PK) pour garantir une délivrabilité maximale
 */
export function buildTimesheetExcelBuffer(data: TimesheetReportData): Buffer {
  const wb = buildTimesheetXlsxWorkbook(data);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Génère le fichier Excel (.xlsx) en base64 pour transmission par JSON depuis le navigateur
 * avec signature OpenXML réelle (.xlsx)
 */
export function buildTimesheetExcelBase64(data: TimesheetReportData): string {
  const wb = buildTimesheetXlsxWorkbook(data);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}
