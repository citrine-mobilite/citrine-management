import {
  ComplianceAxis,
  ComplianceAxisSummary,
  ComplianceChecklistItem,
  ComplianceMetrics,
  ComplianceStatus,
} from '../types/complianceTypes';
import { COMPLIANCE_AXES_META } from '../data/anticChecklistSeed';

export interface ComplianceStatusMeta {
  value: ComplianceStatus;
  label: string;
  shortLabel: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  countsAsHandled: boolean;
}

const STATUS_META_MAP: Record<ComplianceStatus, ComplianceStatusMeta> = {
  conforme: {
    value: 'conforme',
    label: 'Document prêt / Conforme',
    shortLabel: 'Prêt',
    textClass: 'text-[#16A34A]',
    surfaceClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    countsAsHandled: true,
  },
  en_cours: {
    value: 'en_cours',
    label: 'En cours de rédaction',
    shortLabel: 'En cours',
    textClass: 'text-[#D97706]',
    surfaceClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    countsAsHandled: false,
  },
  a_preparer: {
    value: 'a_preparer',
    label: 'À préparer',
    shortLabel: 'À préparer',
    textClass: 'text-stone-600',
    surfaceClass: 'bg-stone-100',
    borderClass: 'border-stone-200',
    countsAsHandled: false,
  },
  non_existant: {
    value: 'non_existant',
    label: 'Non existant (à déclarer)',
    shortLabel: 'Non existant',
    textClass: 'text-[#DC2626]',
    surfaceClass: 'bg-red-50',
    borderClass: 'border-red-200',
    countsAsHandled: true,
  },
  non_applicable: {
    value: 'non_applicable',
    label: 'Non applicable (N/A)',
    shortLabel: 'N/A',
    textClass: 'text-stone-400',
    surfaceClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    countsAsHandled: true,
  },
};

export const COMPLIANCE_STATUS_OPTIONS: ComplianceStatusMeta[] = [
  STATUS_META_MAP.a_preparer,
  STATUS_META_MAP.en_cours,
  STATUS_META_MAP.conforme,
  STATUS_META_MAP.non_existant,
  STATUS_META_MAP.non_applicable,
];

export function getComplianceStatusMeta(status?: ComplianceStatus): ComplianceStatusMeta {
  if (!status || !STATUS_META_MAP[status]) {
    return STATUS_META_MAP.a_preparer;
  }
  return STATUS_META_MAP[status];
}

/**
 * Merges reference ANTIC seed items with persisted database overrides/custom items.
 * Stored items always take precedence by ID; missing seed items are preserved; custom items are appended.
 */
export function mergeSeedWithStoredItems(
  seedItems: ComplianceChecklistItem[],
  storedItems: ComplianceChecklistItem[]
): ComplianceChecklistItem[] {
  const byId = new Map<string, ComplianceChecklistItem>();

  for (const item of seedItems) {
    byId.set(item.id, {
      ...item,
      subItems: Array.isArray(item.subItems) ? item.subItems.map((s) => ({ ...s })) : [],
    });
  }

  for (const stored of storedItems || []) {
    if (!stored || !stored.id) continue;
    const base = byId.get(stored.id);
    if (base) {
      byId.set(stored.id, {
        ...base,
        ...stored,
        // Keep structural metadata if stored record omitted optional seed links
        citrineModuleHint: stored.citrineModuleHint || base.citrineModuleHint,
        subItems: Array.isArray(stored.subItems) && stored.subItems.length > 0
          ? stored.subItems
          : base.subItems,
        orderIndex: typeof stored.orderIndex === 'number' ? stored.orderIndex : base.orderIndex,
      });
    } else {
      byId.set(stored.id, {
        ...stored,
        subItems: Array.isArray(stored.subItems) ? stored.subItems : [],
        orderIndex: typeof stored.orderIndex === 'number' ? stored.orderIndex : 999,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Computes readiness and maturity metrics strictly from applicable checklist items.
 * Note: "conforme" gives 100% weight on item readiness; "non_applicable" is excluded from denominator.
 */
export function computeComplianceMetrics(items: ComplianceChecklistItem[]): ComplianceMetrics {
  const applicable = items.filter((i) => i.status !== 'non_applicable');
  const conformeCount = items.filter((i) => i.status === 'conforme').length;
  const enCoursCount = items.filter((i) => i.status === 'en_cours').length;
  const aPreparerCount = items.filter((i) => i.status === 'a_preparer').length;
  const nonExistantCount = items.filter((i) => i.status === 'non_existant').length;
  const nonApplicableCount = items.filter((i) => i.status === 'non_applicable').length;

  let subItemsDone = 0;
  let subItemsTotal = 0;
  for (const item of applicable) {
    const subs = item.subItems || [];
    subItemsTotal += subs.length;
    subItemsDone += subs.filter((s) => s.completed).length;
  }

  const readinessPercent =
    applicable.length > 0 ? Math.round((conformeCount / applicable.length) * 100) : 0;

  const byAxis: ComplianceAxisSummary[] = COMPLIANCE_AXES_META.map((meta) => {
    const axisItems = items.filter((i) => i.axis === meta.axis);
    const axisApplicable = axisItems.filter((i) => i.status !== 'non_applicable');
    const axisConforme = axisItems.filter((i) => i.status === 'conforme').length;
    let axisSubDone = 0;
    let axisSubTotal = 0;
    for (const item of axisApplicable) {
      const subs = item.subItems || [];
      axisSubTotal += subs.length;
      axisSubDone += subs.filter((s) => s.completed).length;
    }

    return {
      axis: meta.axis,
      shortCode: meta.shortCode,
      label: meta.label,
      totalApplicable: axisApplicable.length,
      conformeCount: axisConforme,
      enCoursCount: axisItems.filter((i) => i.status === 'en_cours').length,
      nonExistantCount: axisItems.filter((i) => i.status === 'non_existant').length,
      aPreparerCount: axisItems.filter((i) => i.status === 'a_preparer').length,
      nonApplicableCount: axisItems.filter((i) => i.status === 'non_applicable').length,
      subItemsDone: axisSubDone,
      subItemsTotal: axisSubTotal,
      readinessPercent:
        axisApplicable.length > 0 ? Math.round((axisConforme / axisApplicable.length) * 100) : 0,
    };
  });

  return {
    totalItems: items.length,
    totalApplicable: applicable.length,
    conformeCount,
    enCoursCount,
    aPreparerCount,
    nonExistantCount,
    nonApplicableCount,
    subItemsDone,
    subItemsTotal,
    readinessPercent,
    byAxis,
  };
}

export interface ComplianceFilterOptions {
  axis: 'all' | ComplianceAxis;
  status: 'all' | ComplianceStatus;
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
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    if (filters.onlyPending && (item.status === 'conforme' || item.status === 'non_applicable')) {
      return false;
    }
    if (q) {
      const subText = (item.subItems || []).map((s) => s.label).join(' ');
      const haystack = [
        item.controlCode,
        item.sectionCode,
        item.sectionTitle,
        item.title,
        item.description || '',
        item.ownerName || '',
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

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '').replace(/\r?\n/g, ' | ');
  if (raw.includes(';') || raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Generates an Excel-friendly UTF-8 BOM CSV with semicolon delimiter for the ANTIC audit dossier.
 */
export function buildAnticCsvExport(items: ComplianceChecklistItem[]): string {
  const headers = [
    'Code Contrôle',
    'Section ANTIC',
    'Exigence / Document demandé',
    'Statut',
    'Sous-éléments validés',
    'Responsable',
    'Version',
    'Date document',
    'Confidentialité',
    'Preuve / Lien',
    'Commentaire auditeur',
  ];

  const rows = items.map((item) => {
    const subs = item.subItems || [];
    const doneCount = subs.filter((s) => s.completed).length;
    const statusLabel = getComplianceStatusMeta(item.status).label;
    return [
      item.controlCode,
      item.sectionTitle,
      item.title,
      statusLabel,
      `${doneCount}/${subs.length}`,
      item.ownerName || '',
      item.documentVersion || '',
      item.documentDate || '',
      item.confidentiality || 'Confidentiel',
      item.evidenceUrl || '',
      item.auditorNotes || '',
    ]
      .map(escapeCsvCell)
      .join(';');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(';'), ...rows].join('\n');
}
