import {
  ComplianceAxis,
  ComplianceAxisSummary,
  ComplianceChecklistItem,
  ComplianceMetrics,
  ComplianceParentStatus,
  ComplianceStatus,
  ComplianceSubItem,
  ComplianceSubItemStatus,
} from '../types/complianceTypes';
import { COMPLIANCE_AXES_META } from '../data/anticChecklistSeed';
import type { Employee } from '../types/employeeTypes';

export interface ComplianceStatusMeta {
  value: ComplianceSubItemStatus;
  label: string;
  shortLabel: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  dotClass: string;
  countsAsDone: boolean;
}

const STATUS_META_MAP: Record<ComplianceSubItemStatus, ComplianceStatusMeta> = {
  conforme: {
    value: 'conforme',
    label: 'Conforme',
    shortLabel: 'Conforme',
    textClass: 'text-[#16A34A]',
    surfaceClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-[#16A34A]',
    countsAsDone: true,
  },
  partiellement_conforme: {
    value: 'partiellement_conforme',
    label: 'Partiellement conforme',
    shortLabel: 'Partiel',
    textClass: 'text-[#0284C7]',
    surfaceClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    dotClass: 'bg-[#0284C7]',
    countsAsDone: false,
  },
  en_cours: {
    value: 'en_cours',
    label: 'En cours de conformité',
    shortLabel: 'En cours',
    textClass: 'text-[#D97706]',
    surfaceClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotClass: 'bg-[#D97706]',
    countsAsDone: false,
  },
  a_verifier: {
    value: 'a_verifier',
    label: 'À vérifier / Validation',
    shortLabel: 'À vérifier',
    textClass: 'text-[#4F46E5]',
    surfaceClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-[#4F46E5]',
    countsAsDone: false,
  },
  a_preparer: {
    value: 'a_preparer',
    label: 'À initier / À préparer',
    shortLabel: 'À initier',
    textClass: 'text-stone-600',
    surfaceClass: 'bg-stone-100',
    borderClass: 'border-stone-200',
    dotClass: 'bg-stone-400',
    countsAsDone: false,
  },
  non_conforme: {
    value: 'non_conforme',
    label: 'Non conforme',
    shortLabel: 'Non conforme',
    textClass: 'text-[#DC2626]',
    surfaceClass: 'bg-red-50',
    borderClass: 'border-red-200',
    dotClass: 'bg-[#DC2626]',
    countsAsDone: false,
  },
  non_existant: {
    value: 'non_existant',
    label: 'Non existant (à créer)',
    shortLabel: 'Non existant',
    textClass: 'text-[#991B1B]',
    surfaceClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    dotClass: 'bg-[#991B1B]',
    countsAsDone: false,
  },
  non_applicable: {
    value: 'non_applicable',
    label: 'Non applicable (N/A)',
    shortLabel: 'N/A',
    textClass: 'text-stone-500',
    surfaceClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    dotClass: 'bg-stone-300',
    countsAsDone: true,
  },
};

export const COMPLIANCE_STATUS_OPTIONS: ComplianceStatusMeta[] = [
  STATUS_META_MAP.a_preparer,
  STATUS_META_MAP.en_cours,
  STATUS_META_MAP.partiellement_conforme,
  STATUS_META_MAP.a_verifier,
  STATUS_META_MAP.conforme,
  STATUS_META_MAP.non_conforme,
  STATUS_META_MAP.non_existant,
  STATUS_META_MAP.non_applicable,
];

export const PARENT_STATUS_OPTIONS: Array<{ value: ComplianceParentStatus; label: string }> = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'non_conforme', label: 'Non conforme' },
];

export function getComplianceStatusMeta(status?: ComplianceStatus | ComplianceParentStatus): ComplianceStatusMeta {
  if (!status || !STATUS_META_MAP[status]) {
    return STATUS_META_MAP.a_preparer;
  }
  return STATUS_META_MAP[status];
}

export function resolveSubItemStatus(sub: ComplianceSubItem): ComplianceSubItemStatus {
  if (sub.status && STATUS_META_MAP[sub.status]) {
    return sub.status;
  }
  return sub.completed ? 'conforme' : 'a_preparer';
}

/**
 * Computes parent requirement status strictly as binary ('conforme' | 'non_conforme')
 * from its sub-elements:
 * - If sub-elements exist: 'conforme' iff every non-N/A sub-element is 'conforme'.
 * - If no sub-elements exist: 'conforme' iff fallbackStatus === 'conforme'.
 */
export function computeParentComplianceStatus(
  subItems: ComplianceSubItem[],
  fallbackStatus?: ComplianceStatus
): ComplianceParentStatus {
  if (!subItems || subItems.length === 0) {
    return fallbackStatus === 'conforme' ? 'conforme' : 'non_conforme';
  }
  const applicable = subItems.filter((s) => resolveSubItemStatus(s) !== 'non_applicable');
  if (applicable.length === 0) {
    return 'conforme';
  }
  return applicable.every((s) => resolveSubItemStatus(s) === 'conforme')
    ? 'conforme'
    : 'non_conforme';
}

/**
 * Automatically extracts a collaborator's job function / role label from Employee record.
 */
export function resolveEmployeeFunction(employee?: Partial<Employee> | null): string {
  if (!employee) return '';
  const primary = (employee.position || employee.role || '').trim();
  const roleType = (employee.roleType || '').trim();
  const dept = (employee.department || '').trim();

  const resolvedTitle =
    primary || (roleType && roleType.toLowerCase() !== 'employé' ? roleType : '') || roleType;

  if (resolvedTitle && dept && !resolvedTitle.toLowerCase().includes(dept.toLowerCase())) {
    return `${resolvedTitle} · ${dept}`;
  }
  return resolvedTitle || dept || '';
}

export function formatSubItemCommentsText(sub: ComplianceSubItem): string {
  const parts: string[] = [];
  if (sub.notes && sub.notes.trim()) {
    parts.push(sub.notes.trim());
  }
  const list = Array.isArray(sub.comments) ? sub.comments : [];
  for (const c of list) {
    if (!c || !c.text?.trim()) continue;
    const dateStr = c.createdAt ? c.createdAt.slice(0, 10) : '';
    const prefix = [c.author, dateStr].filter(Boolean).join(' · ');
    parts.push(prefix ? `[${prefix}] ${c.text.trim()}` : c.text.trim());
  }
  return parts.join(' | ');
}

export function getCombinedCommentsText(item: ComplianceChecklistItem): string {
  const parts: string[] = [];
  if (item.auditorNotes && item.auditorNotes.trim()) {
    parts.push(item.auditorNotes.trim());
  }
  for (const sub of item.subItems || []) {
    const subCmt = formatSubItemCommentsText(sub);
    if (subCmt) {
      parts.push(`${sub.label} : ${subCmt}`);
    }
  }
  return parts.join(' | ');
}

export function normalizeSubItem(sub: ComplianceSubItem): ComplianceSubItem {
  const status = resolveSubItemStatus(sub);
  return {
    ...sub,
    status,
    completed: status === 'conforme',
    comments: Array.isArray(sub.comments) ? sub.comments.map((c) => ({ ...c })) : [],
  };
}

/**
 * Merges reference ANTIC seed items with persisted database overrides/custom items.
 * Normalizes every sub-item status and automatically derives parent binary status ('conforme' | 'non_conforme').
 */
export function mergeSeedWithStoredItems(
  seedItems: ComplianceChecklistItem[],
  storedItems: ComplianceChecklistItem[]
): ComplianceChecklistItem[] {
  const byId = new Map<string, ComplianceChecklistItem>();

  for (const item of seedItems) {
    const normSubs = (Array.isArray(item.subItems) ? item.subItems : []).map(normalizeSubItem);
    byId.set(item.id, {
      ...item,
      subItems: normSubs,
      status: computeParentComplianceStatus(normSubs, item.status),
    });
  }

  for (const stored of storedItems || []) {
    if (!stored || !stored.id) continue;
    const base = byId.get(stored.id);
    if (base) {
      const mergedSubs = (
        Array.isArray(stored.subItems) && stored.subItems.length > 0
          ? stored.subItems
          : base.subItems
      ).map(normalizeSubItem);

      byId.set(stored.id, {
        ...base,
        ...stored,
        citrineModuleHint: stored.citrineModuleHint || base.citrineModuleHint,
        subItems: mergedSubs,
        status: computeParentComplianceStatus(mergedSubs, stored.status),
        orderIndex: typeof stored.orderIndex === 'number' ? stored.orderIndex : base.orderIndex,
      });
    } else {
      const normSubs = (Array.isArray(stored.subItems) ? stored.subItems : []).map(normalizeSubItem);
      byId.set(stored.id, {
        ...stored,
        subItems: normSubs,
        status: computeParentComplianceStatus(normSubs, stored.status),
        orderIndex: typeof stored.orderIndex === 'number' ? stored.orderIndex : 999,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Computes readiness metrics across parent controls (strictly binary Conforme / Non conforme)
 * and granular sub-item statuses.
 */
export function computeComplianceMetrics(items: ComplianceChecklistItem[]): ComplianceMetrics {
  let conformeCount = 0;
  let nonConformeCount = 0;

  let subItemsDone = 0;
  let subItemsTotal = 0;
  let subItemsApplicable = 0;
  let enCoursCount = 0;
  let partiellementConformeCount = 0;
  let aVerifierCount = 0;
  let aPreparerCount = 0;
  let nonExistantCount = 0;
  let nonApplicableCount = 0;
  let subNonConformeCount = 0;

  for (const item of items) {
    const subs = item.subItems || [];
    const parentStatus = computeParentComplianceStatus(subs, item.status);
    if (parentStatus === 'conforme') conformeCount++;
    else nonConformeCount++;

    for (const s of subs) {
      subItemsTotal++;
      const st = resolveSubItemStatus(s);
      if (st === 'non_applicable') {
        nonApplicableCount++;
        continue;
      }
      subItemsApplicable++;
      if (st === 'conforme') subItemsDone++;
      else if (st === 'en_cours') enCoursCount++;
      else if (st === 'partiellement_conforme') partiellementConformeCount++;
      else if (st === 'a_verifier') aVerifierCount++;
      else if (st === 'non_existant') nonExistantCount++;
      else if (st === 'non_conforme') subNonConformeCount++;
      else aPreparerCount++;
    }
  }

  const readinessPercent =
    items.length > 0 ? Math.round((conformeCount / items.length) * 100) : 0;

  const byAxis: ComplianceAxisSummary[] = COMPLIANCE_AXES_META.map((meta) => {
    const axisItems = items.filter((i) => i.axis === meta.axis);
    let axisConforme = 0;
    let axisNonConforme = 0;
    let axisSubConforme = 0;
    let axisSubInProgress = 0;
    let axisSubNonConforme = 0;
    let axisSubPending = 0;
    let axisSubApplicable = 0;
    let axisSubTotal = 0;

    for (const item of axisItems) {
      const subs = item.subItems || [];
      if (computeParentComplianceStatus(subs, item.status) === 'conforme') {
        axisConforme++;
      } else {
        axisNonConforme++;
      }
      for (const s of subs) {
        axisSubTotal++;
        const st = resolveSubItemStatus(s);
        if (st === 'non_applicable') continue;
        axisSubApplicable++;
        if (st === 'conforme') axisSubConforme++;
        else if (st === 'en_cours' || st === 'partiellement_conforme' || st === 'a_verifier') {
          axisSubInProgress++;
        } else if (st === 'non_conforme' || st === 'non_existant') {
          axisSubNonConforme++;
        } else {
          axisSubPending++;
        }
      }
    }

    return {
      axis: meta.axis,
      shortCode: meta.shortCode,
      label: meta.label,
      totalItems: axisItems.length,
      conformeCount: axisConforme,
      nonConformeCount: axisNonConforme,
      subItemsConforme: axisSubConforme,
      subItemsInProgress: axisSubInProgress,
      subItemsNonConforme: axisSubNonConforme,
      subItemsPending: axisSubPending,
      subItemsApplicable: axisSubApplicable,
      subItemsDone: axisSubConforme,
      subItemsTotal: axisSubTotal,
      readinessPercent:
        axisItems.length > 0 ? Math.round((axisConforme / axisItems.length) * 100) : 0,
    };
  });

  return {
    totalItems: items.length,
    totalApplicable: items.length,
    conformeCount,
    nonConformeCount,
    enCoursCount,
    partiellementConformeCount,
    aVerifierCount,
    aPreparerCount,
    subNonConformeCount,
    nonExistantCount,
    nonApplicableCount,
    subItemsDone,
    subItemsTotal,
    subItemsApplicable,
    readinessPercent,
    byAxis,
  };
}

export interface ComplianceFilterOptions {
  axis: 'all' | ComplianceAxis;
  status: 'all' | ComplianceParentStatus | `sub_${ComplianceSubItemStatus}`;
  search: string;
  onlyPending?: boolean;
}

export function filterComplianceItems(
  items: ComplianceChecklistItem[],
  filters: ComplianceFilterOptions
): ComplianceChecklistItem[] {
  const q = (filters.search || '').trim().toLowerCase();

  return items.filter((item) => {
    if (filters.axis !== 'all' && item.axis !== filters.axis) {
      return false;
    }

    const parentStatus = computeParentComplianceStatus(item.subItems || [], item.status);

    if (filters.status !== 'all') {
      if (filters.status === 'conforme' || filters.status === 'non_conforme') {
        if (parentStatus !== filters.status) return false;
      } else if (filters.status.startsWith('sub_')) {
        const targetSubStatus = filters.status.slice(4) as ComplianceSubItemStatus;
        const hasMatch = (item.subItems || []).some(
          (s) => resolveSubItemStatus(s) === targetSubStatus
        );
        if (!hasMatch) return false;
      }
    }

    if (filters.onlyPending && parentStatus === 'conforme') {
      return false;
    }

    if (q) {
      const subText = (item.subItems || [])
        .map((s) => `${s.label} ${formatSubItemCommentsText(s)}`)
        .join(' ');
      const haystack = [
        item.controlCode,
        item.sectionCode,
        item.sectionTitle,
        item.title,
        item.description || '',
        item.ownerName || '',
        item.ownerRole || '',
        item.documentVersion || '',
        item.auditorNotes || '',
        subText,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export interface ComplianceSubItemReportRow {
  controlCode: string;
  axis: ComplianceAxis;
  sectionTitle: string;
  parentTitle: string;
  parentStatus: ComplianceParentStatus;
  parentStatusLabel: string;
  subLabel: string;
  subStatus: ComplianceSubItemStatus;
  subStatusLabel: string;
  ownerDisplay: string;
  documentVersion: string;
  documentDate: string;
  confidentiality: string;
  evidenceUrl: string;
  subCommentsText: string;
}

export interface ComplianceReportRow {
  controlCode: string;
  axis: ComplianceAxis;
  sectionTitle: string;
  title: string;
  status: ComplianceParentStatus;
  statusLabel: string;
  subItemsSummary: string;
  subItemsDetail: string;
  ownerName: string;
  ownerRole: string;
  documentVersion: string;
  documentDate: string;
  confidentiality: string;
  evidenceUrl: string;
  commentsText: string;
}

export function prepareComplianceReportRows(items: ComplianceChecklistItem[]): ComplianceReportRow[] {
  return items.map((item) => {
    const subs = item.subItems || [];
    const parentStatus = computeParentComplianceStatus(subs, item.status);
    const doneCount = subs.filter((s) => resolveSubItemStatus(s) === 'conforme').length;
    const subItemsDetail = subs
      .map((s) => {
        const stLabel = getComplianceStatusMeta(resolveSubItemStatus(s)).shortLabel;
        const cmt = formatSubItemCommentsText(s);
        return `[${stLabel}] ${s.label}${cmt ? ` — ${cmt}` : ''}`;
      })
      .join('\n');
    const ownerDisplay = [item.ownerName, item.ownerRole].filter(Boolean).join(' — ');
    return {
      controlCode: item.controlCode,
      axis: item.axis,
      sectionTitle: item.sectionTitle,
      title: item.title,
      status: parentStatus,
      statusLabel: getComplianceStatusMeta(parentStatus).label,
      subItemsSummary: `${doneCount}/${subs.length}`,
      subItemsDetail,
      ownerName: ownerDisplay,
      ownerRole: item.ownerRole || '',
      documentVersion: item.documentVersion || '',
      documentDate: item.documentDate || '',
      confidentiality: item.confidentiality || 'Confidentiel',
      evidenceUrl: item.evidenceUrl || '',
      commentsText: getCombinedCommentsText(item),
    };
  });
}

export function prepareComplianceSubItemReportRows(
  items: ComplianceChecklistItem[]
): ComplianceSubItemReportRow[] {
  const rows: ComplianceSubItemReportRow[] = [];
  for (const item of items) {
    const subs = item.subItems || [];
    const parentStatus = computeParentComplianceStatus(subs, item.status);
    const parentStatusLabel = getComplianceStatusMeta(parentStatus).label;
    const ownerDisplay = [item.ownerName, item.ownerRole].filter(Boolean).join(' — ');

    if (subs.length === 0) {
      rows.push({
        controlCode: item.controlCode,
        axis: item.axis,
        sectionTitle: item.sectionTitle,
        parentTitle: item.title,
        parentStatus,
        parentStatusLabel,
        subLabel: item.title,
        subStatus: parentStatus,
        subStatusLabel: parentStatusLabel,
        ownerDisplay,
        documentVersion: item.documentVersion || '',
        documentDate: item.documentDate || '',
        confidentiality: item.confidentiality || 'Confidentiel',
        evidenceUrl: item.evidenceUrl || '',
        subCommentsText: item.auditorNotes || '',
      });
      continue;
    }

    for (const sub of subs) {
      const subStatus = resolveSubItemStatus(sub);
      rows.push({
        controlCode: item.controlCode,
        axis: item.axis,
        sectionTitle: item.sectionTitle,
        parentTitle: item.title,
        parentStatus,
        parentStatusLabel,
        subLabel: sub.label,
        subStatus,
        subStatusLabel: getComplianceStatusMeta(subStatus).label,
        ownerDisplay,
        documentVersion: item.documentVersion || '',
        documentDate: item.documentDate || '',
        confidentiality: item.confidentiality || 'Confidentiel',
        evidenceUrl: item.evidenceUrl || '',
        subCommentsText: formatSubItemCommentsText(sub),
      });
    }
  }
  return rows;
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '').replace(/\r?\n/g, ' | ');
  if (raw.includes(';') || raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Generates an Excel-friendly UTF-8 BOM CSV with semicolon delimiter (one row per sub-element).
 */
export function buildAnticCsvExport(items: ComplianceChecklistItem[]): string {
  const headers = [
    'Code Contrôle',
    'Section ANTIC',
    'Exigence principale',
    'Statut Global',
    'Sous-élément',
    'Statut Sous-élément',
    'Responsable & Fonction',
    'Version',
    'Date document',
    'Confidentialité',
    'Preuve / Lien',
    'Commentaires sous-élément',
  ];

  const subRows = prepareComplianceSubItemReportRows(items);
  const rows = subRows.map((row) =>
    [
      row.controlCode,
      row.sectionTitle,
      row.parentTitle,
      row.parentStatusLabel,
      row.subLabel,
      row.subStatusLabel,
      row.ownerDisplay,
      row.documentVersion,
      row.documentDate,
      row.confidentiality,
      row.evidenceUrl,
      row.subCommentsText,
    ]
      .map(escapeCsvCell)
      .join(';')
  );

  return '\uFEFF' + [headers.map(escapeCsvCell).join(';'), ...rows].join('\n');
}
