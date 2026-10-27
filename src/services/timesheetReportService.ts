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

export interface TimesheetReportData {
  employeeName: string;
  employeeEmail?: string;
  employeeId?: string | number;
  department?: string;
  dateStr?: string; // e.g. "mardi 27 octobre 2026"
  timeStr?: string; // e.g. "18:27"
  items: TimesheetItem[];
  blockers: TimesheetBlocker[];
  managerPoints: TimesheetManagerPoint[];
  totalEstimatedHours: number;
  totalActualHours: number;
}

/**
 * Formate une date selon le fuseau horaire officiel du Cameroun (Africa/Douala - WAT UTC+1)
 * Élimine le décalage d'une heure causé par les environnements serveur en UTC.
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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

  // Jour au format YYYY-MM-DD à Douala
  const isoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayIso = isoFormatter.format(date);

  return {
    dateOnly: dateOnly.charAt(0).toUpperCase() + dateOnly.slice(1),
    timeOnly,
    fullDateStr: `${parts} (Heure locale Douala, Cameroun)`,
    dayIso,
  };
}

/**
 * Normalise le statut pour affichage visuel
 */
export function normalizeStatusBadge(status?: string, completed?: boolean): { label: string; bg: string; color: string; border: string } {
  if (completed || status === 'completed' || status === 'done' || status === 'fait' || status === 'termine') {
    return { label: 'TERMINÉ', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  }
  if (status === 'blocked' || status === 'bloque') {
    return { label: 'BLOQUÉ', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  }
  if (status === 'in_progress' || status === 'en_cours') {
    return { label: 'EN COURS', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  }
  return { label: 'À FAIRE', bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
}

/**
 * Construit le corps HTML de la fiche de temps avec un design "Feuille de Temps Excel"
 * clair, élégant, organisé et aux couleurs de Citrine Mobilité.
 */
export function buildTimesheetHtmlReport(data: TimesheetReportData): string {
  const completionRate = data.totalEstimatedHours > 0
    ? Math.min(100, Math.round((data.totalActualHours / data.totalEstimatedHours) * 100))
    : (data.items.length > 0 ? Math.round((data.items.filter(i => i.status === 'completed').length / data.items.length) * 100) : 0);

  const diffHours = data.totalActualHours - data.totalEstimatedHours;
  const diffSign = diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;

  return `
    <!-- EN-TÊTE RÉCAPITULATIF PROPRIÉTAIRE FEUILLE DE TEMPS -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align: top; width: 60%;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1F625E; letter-spacing: 0.5px;">
              Fiche de Temps Individuelle Journalière
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">
              ${data.employeeName}
            </div>
            <div style="font-size: 13px; color: #475569; margin-top: 2px;">
              Département : <strong>${data.department || 'Opérations & Projets'}</strong>
              ${data.employeeEmail ? ` · <span style="color: #64748b;">${data.employeeEmail}</span>` : ''}
            </div>
          </td>
          <td style="vertical-align: top; text-align: right; width: 40%;">
            <div style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; text-align: right;">
              <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Date & Heure (Douala)</span>
              <span style="font-size: 13px; font-weight: 700; color: #1e293b;">${data.dateStr || 'Aujourd\'hui'}</span>
              <span style="display: block; font-size: 11px; font-weight: 600; color: #047857;">${data.timeStr ? `à ${data.timeStr} (UTC+1)` : ''}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- 3 CARTES DE SYNTHÈSE CHIFFRÉE -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
        <tr>
          <td style="width: 33.33%; padding-right: 8px;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
              <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Total Activités</span>
              <span style="font-size: 17px; font-weight: 800; color: #0f172a;">${data.items.length}</span>
            </div>
          </td>
          <td style="width: 33.33%; padding: 0 4px;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
              <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Heures Travaillées</span>
              <span style="font-size: 17px; font-weight: 800; color: #1F625E;">${data.totalActualHours} h <span style="font-size: 11px; font-weight: normal; color: #64748b;">/ ${data.totalEstimatedHours}h</span></span>
            </div>
          </td>
          <td style="width: 33.33%; padding-left: 8px;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
              <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Taux d'Achèvement</span>
              <span style="font-size: 17px; font-weight: 800; color: ${completionRate >= 80 ? '#047857' : completionRate >= 50 ? '#d97706' : '#2563eb'};">${completionRate}%</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- TABLEAU STYLE FEUILLE DE TEMPS EXCEL -->
    <div style="margin-bottom: 24px;">
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
          📊 Tableau des Activités & Feuilles de Temps (${data.items.length})
        </span>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; background-color: #ffffff;">
        <thead>
          <tr style="background-color: #1F625E; color: #ffffff;">
            <th style="padding: 10px 8px; text-align: center; border: 1px solid #164e4b; font-size: 11px; font-weight: 700; width: 32px;">N°</th>
            <th style="padding: 10px 10px; text-align: left; border: 1px solid #164e4b; font-size: 11px; font-weight: 700;">Tâche / Projet</th>
            <th style="padding: 10px 10px; text-align: left; border: 1px solid #164e4b; font-size: 11px; font-weight: 700;">Sous-activité traitée</th>
            <th style="padding: 10px 8px; text-align: center; border: 1px solid #164e4b; font-size: 11px; font-weight: 700; width: 85px;">Statut</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #164e4b; font-size: 11px; font-weight: 700; width: 70px;">Estimé</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #164e4b; font-size: 11px; font-weight: 700; width: 70px;">Réel</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.length > 0 ? data.items.map((item, idx) => {
            const badge = normalizeStatusBadge(item.status, item.status === 'completed');
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            return `
              <tr style="background-color: ${rowBg};">
                <td style="padding: 9px 8px; text-align: center; border: 1px solid #e2e8f0; color: #64748b; font-family: monospace; font-size: 11px;">
                  ${item.index || (idx + 1)}
                </td>
                <td style="padding: 9px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                  ${item.taskTitle}
                </td>
                <td style="padding: 9px 10px; border: 1px solid #e2e8f0; color: #334155;">
                  ${item.subTitle}
                  ${item.blockerReason ? `<div style="font-size: 11px; color: #b91c1c; margin-top: 3px;">⚠️ <em>${item.blockerReason}</em></div>` : ''}
                </td>
                <td style="padding: 8px 6px; text-align: center; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700; border-radius: 12px; background-color: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border};">
                    ${badge.label}
                  </span>
                </td>
                <td style="padding: 9px 8px; text-align: right; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #475569;">
                  ${item.estimatedHours} h
                </td>
                <td style="padding: 9px 8px; text-align: right; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; font-weight: 700; color: #0f172a;">
                  ${item.actualHours} h
                </td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="6" style="padding: 24px; text-align: center; color: #64748b; font-style: italic; border: 1px solid #e2e8f0;">
                Aucune activité enregistrée sur cette journée.
              </td>
            </tr>
          `}
        </tbody>
        <!-- LIGNE DE TOTALISATION EXCEL -->
        <tfoot>
          <tr style="background-color: #ecfdf5; font-weight: 800; border-top: 2px solid #1F625E;">
            <td colspan="4" style="padding: 10px 12px; text-align: right; border: 1px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #064e3b; letter-spacing: 0.5px;">
              TOTAL HEURES GÉNÉRAL
            </td>
            <td style="padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1; font-family: monospace; font-size: 13px; color: #064e3b;">
              ${data.totalEstimatedHours} h
            </td>
            <td style="padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1; font-family: monospace; font-size: 13px; color: #047857;">
              ${data.totalActualHours} h
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- SECTION 1 : BLOCAGES RENCONTRÉS -->
    <div style="margin-bottom: 22px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
        <tr>
          <td>
            <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #991b1b; letter-spacing: 0.5px;">
              🚨 Blocages &amp; Difficultés Rencontrées
            </span>
          </td>
          <td align="right">
            <span style="font-size: 11px; font-weight: 700; color: ${data.blockers.length > 0 ? '#b91c1c' : '#047857'};">
              ${data.blockers.length > 0 ? `${data.blockers.length} incident(s)` : '0 blocage'}
            </span>
          </td>
        </tr>
      </table>

      ${data.blockers.length > 0 ? `
        <div style="border: 1px solid #fecaca; border-radius: 8px; background-color: #fff5f5; padding: 12px 14px;">
          ${data.blockers.map((b) => `
            <div style="padding: 8px 0; border-bottom: 1px dashed #fecaca; font-size: 13px;">
              <div style="font-weight: 700; color: #991b1b;">
                • ${b.sourceTask}
                ${b.time ? `<span style="font-size: 11px; font-weight: normal; color: #7f1d1d;"> (${b.time})</span>` : ''}
              </div>
              <div style="color: #7f1d1d; margin-top: 2px; padding-left: 12px;">
                ${b.reason}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; color: #166534; font-size: 13px;">
          ✅ <strong>Aucun blocage signalé</strong> pour cette journée. Toutes les activités se sont déroulées normalement.
        </div>
      `}
    </div>

    <!-- SECTION 2 : POINTS À SIGNALER AU MANAGER -->
    <div style="margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
        <tr>
          <td>
            <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
              📌 Points à Signaler au Manager &amp; Direction
            </span>
          </td>
          <td align="right">
            <span style="font-size: 11px; font-weight: 700; color: ${data.managerPoints.length > 0 ? '#1d4ed8' : '#64748b'};">
              ${data.managerPoints.length > 0 ? `${data.managerPoints.length} point(s)` : '0 remarque'}
            </span>
          </td>
        </tr>
      </table>

      ${data.managerPoints.length > 0 ? `
        <div style="border: 1px solid #bfdbfe; border-radius: 8px; background-color: #eff6ff; padding: 12px 14px;">
          ${data.managerPoints.map((p) => `
            <div style="padding: 8px 0; border-bottom: 1px dashed #bfdbfe; font-size: 13px;">
              <div style="font-weight: 700; color: #1e40af;">
                💬 ${p.sourceTask ? `${p.sourceTask} :` : 'Note de journée :'}
                ${p.author ? `<span style="font-size: 11px; font-weight: normal; color: #3b82f6;"> (par ${p.author})</span>` : ''}
              </div>
              <div style="color: #1e3a8a; margin-top: 2px; padding-left: 12px; font-style: italic;">
                "${p.content}"
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; color: #64748b; font-size: 13px;">
          ℹ️ <strong>Aucun point particulier à signaler</strong> au manager pour cette journée.
        </div>
      `}
    </div>

    <!-- SECTION 3 : TÉLÉCHARGEMENT FORMAT EXCEL (.XLSX) -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e6f7f2 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width: 42px; vertical-align: middle;">
            <div style="background-color: #1F625E; color: #ffffff; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; font-weight: 800; font-size: 16px;">
              📊
            </div>
          </td>
          <td style="vertical-align: middle; padding-left: 10px;">
            <div style="font-size: 13px; font-weight: 800; color: #064e3b;">
              Feuille de Temps jointe au format Excel (.xlsx)
            </div>
            <div style="font-size: 11px; color: #047857; margin-top: 2px;">
              Le fichier Excel complet et officiel est joint en pièce jointe de ce mail pour téléchargement, archivage et exploitation RH immédiate.
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Génère le fichier Excel (.xlsx) binaire complet sous forme de Buffer
 */
export function buildTimesheetExcelBuffer(data: TimesheetReportData): Buffer {
  const wb = XLSX.utils.book_new();

  const sheetData: any[][] = [
    ['CITRINE MOBILITÉ — FEUILLE DE TEMPS JOURNALIÈRE'],
    [],
    ['Collaborateur :', data.employeeName, 'Date :', data.dateStr || '', 'Heure locale :', data.timeStr ? `${data.timeStr} (Douala)` : ''],
    ['Département :', data.department || 'Opérations', 'Email :', data.employeeEmail || '', 'Total activités :', data.items.length],
    [],
    ['N°', 'Tâche Principale / Projet', 'Sous-activité / Tâche concrète', 'Statut', 'Temps Estimé (h)', 'Temps Réel (h)', 'Écart (h)'],
  ];

  data.items.forEach((item, idx) => {
    const badge = normalizeStatusBadge(item.status, item.status === 'completed');
    const diff = item.actualHours - item.estimatedHours;
    sheetData.push([
      item.index || (idx + 1),
      item.taskTitle,
      item.subTitle,
      badge.label,
      item.estimatedHours,
      item.actualHours,
      diff,
    ]);
  });

  // Ligne de total
  const diffTotal = data.totalActualHours - data.totalEstimatedHours;
  sheetData.push([
    'TOTAL GÉNÉRAL',
    '',
    '',
    '',
    data.totalEstimatedHours,
    data.totalActualHours,
    diffTotal,
  ]);

  sheetData.push([]);
  sheetData.push(['--- BLOCAGES ET DIFFICULTÉS RENCONTRÉES ---']);
  if (data.blockers.length > 0) {
    sheetData.push(['Source / Tâche', 'Détail du blocage', 'Heure']);
    data.blockers.forEach((b) => {
      sheetData.push([b.sourceTask, b.reason, b.time || '']);
    });
  } else {
    sheetData.push(['Aucun blocage signalé pour cette journée.']);
  }

  sheetData.push([]);
  sheetData.push(['--- POINTS À SIGNALER AU MANAGER ---']);
  if (data.managerPoints.length > 0) {
    sheetData.push(['Source', 'Point / Commentaire', 'Auteur']);
    data.managerPoints.forEach((p) => {
      sheetData.push([p.sourceTask || 'Général', p.content, p.author || '']);
    });
  } else {
    sheetData.push(['Aucun point particulier à signaler au manager pour cette journée.']);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Largeurs de colonnes optimisées
  ws['!cols'] = [
    { wch: 6 },
    { wch: 34 },
    { wch: 42 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Feuille de Temps');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Génère le fichier Excel (.xlsx) en base64 pour transmission par JSON depuis le navigateur
 */
export function buildTimesheetExcelBase64(data: TimesheetReportData): string {
  const wb = XLSX.utils.book_new();

  const sheetData: any[][] = [
    ['CITRINE MOBILITÉ — FEUILLE DE TEMPS JOURNALIÈRE'],
    [],
    ['Collaborateur :', data.employeeName, 'Date :', data.dateStr || '', 'Heure locale :', data.timeStr ? `${data.timeStr} (Douala)` : ''],
    ['Département :', data.department || 'Opérations', 'Email :', data.employeeEmail || '', 'Total activités :', data.items.length],
    [],
    ['N°', 'Tâche Principale / Projet', 'Sous-activité / Tâche concrète', 'Statut', 'Temps Estimé (h)', 'Temps Réel (h)', 'Écart (h)'],
  ];

  data.items.forEach((item, idx) => {
    const badge = normalizeStatusBadge(item.status, item.status === 'completed');
    const diff = item.actualHours - item.estimatedHours;
    sheetData.push([
      item.index || (idx + 1),
      item.taskTitle,
      item.subTitle,
      badge.label,
      item.estimatedHours,
      item.actualHours,
      diff,
    ]);
  });

  const diffTotal = data.totalActualHours - data.totalEstimatedHours;
  sheetData.push([
    'TOTAL GÉNÉRAL',
    '',
    '',
    '',
    data.totalEstimatedHours,
    data.totalActualHours,
    diffTotal,
  ]);

  sheetData.push([]);
  sheetData.push(['--- BLOCAGES ET DIFFICULTÉS RENCONTRÉES ---']);
  if (data.blockers.length > 0) {
    sheetData.push(['Source / Tâche', 'Détail du blocage', 'Heure']);
    data.blockers.forEach((b) => {
      sheetData.push([b.sourceTask, b.reason, b.time || '']);
    });
  } else {
    sheetData.push(['Aucun blocage signalé pour cette journée.']);
  }

  sheetData.push([]);
  sheetData.push(['--- POINTS À SIGNALER AU MANAGER ---']);
  if (data.managerPoints.length > 0) {
    sheetData.push(['Source', 'Point / Commentaire', 'Auteur']);
    data.managerPoints.forEach((p) => {
      sheetData.push([p.sourceTask || 'Général', p.content, p.author || '']);
    });
  } else {
    sheetData.push(['Aucun point particulier à signaler au manager pour cette journée.']);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 34 },
    { wch: 42 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Feuille de Temps');
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}
