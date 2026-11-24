import test from 'node:test';
import assert from 'node:assert/strict';
import { ANTIC_CHECKLIST_SEED } from '../data/anticChecklistSeed';
import {
  buildAnticCsvExport,
  computeComplianceMetrics,
  computeParentComplianceStatus,
  filterComplianceItems,
  formatSubItemCommentsText,
  getCombinedCommentsText,
  getComplianceStatusMeta,
  mergeSeedWithStoredItems,
  prepareComplianceReportRows,
  prepareComplianceSubItemReportRows,
  resolveEmployeeFunction,
  resolveSubItemStatus,
} from './complianceHelpers';
import type { ComplianceChecklistItem } from '../types/complianceTypes';

test('ANTIC seed contains all sections from General (0) through Technical Access (E)', () => {
  const axes = new Set(ANTIC_CHECKLIST_SEED.map((i) => i.axis));
  assert.deepEqual(Array.from(axes).sort(), ['access', 'general', 'org', 'phy', 'rh', 'tech']);
  assert.ok(ANTIC_CHECKLIST_SEED.length >= 40);
  for (const item of ANTIC_CHECKLIST_SEED) {
    assert.ok(item.subItems.length >= 2, `Item ${item.controlCode} should include atomic sub-items`);
  }
});

test('computeParentComplianceStatus automatically computes binary parent status from sub-items', () => {
  assert.equal(
    computeParentComplianceStatus([
      { id: '1', label: 'A', completed: true, status: 'conforme' },
      { id: '2', label: 'B', completed: false, status: 'partiellement_conforme' },
    ]),
    'non_conforme'
  );

  assert.equal(
    computeParentComplianceStatus([
      { id: '1', label: 'A', completed: true, status: 'conforme' },
      { id: '2', label: 'B', completed: false, status: 'non_applicable' },
    ]),
    'conforme'
  );

  assert.equal(
    computeParentComplianceStatus([
      { id: '1', label: 'A', completed: false, status: 'non_applicable' },
    ]),
    'conforme'
  );

  assert.equal(
    computeParentComplianceStatus([
      { id: '1', label: 'A', completed: true, status: 'conforme' },
      { id: '2', label: 'B', completed: false, status: 'a_verifier' },
    ]),
    'non_conforme'
  );

  assert.equal(resolveSubItemStatus({ id: 'x', label: 'Legacy', completed: true }), 'conforme');
  assert.equal(resolveSubItemStatus({ id: 'y', label: 'Legacy', completed: false }), 'a_preparer');
});

test('resolveEmployeeFunction automatically extracts collaborator job function and department', () => {
  assert.equal(
    resolveEmployeeFunction({ position: 'RSSI', department: 'Sécurité SI', role: 'Admin' }),
    'RSSI · Sécurité SI'
  );
  assert.equal(
    resolveEmployeeFunction({ position: 'Responsable IT', department: 'IT' }),
    'Responsable IT'
  );
  assert.equal(
    resolveEmployeeFunction({ role: 'Chef de Projet', roleType: 'Employé', department: 'Direction' }),
    'Chef de Projet · Direction'
  );
  assert.equal(resolveEmployeeFunction(null), '');
});

test('mergeSeedWithStoredItems overlays sub-item statuses/comments, derives parent status, and keeps custom items', () => {
  const override: ComplianceChecklistItem = {
    ...ANTIC_CHECKLIST_SEED[0],
    status: 'non_conforme',
    ownerName: 'Jean Dupont',
    ownerRole: 'Directeur Technique · DSI',
    documentVersion: 'v2.1',
    documentDate: '2026-11-20',
    subItems: ANTIC_CHECKLIST_SEED[0].subItems.map((s, idx) => ({
      ...s,
      completed: true,
      status: 'conforme',
      comments:
        idx === 0
          ? [
              {
                id: 'cmt_1',
                author: 'RSSI',
                text: 'Validé en comité sécurité',
                createdAt: '2026-11-21T10:00:00.000Z',
              },
            ]
          : [],
    })),
  };

  const custom: ComplianceChecklistItem = {
    id: 'custom_antic_1',
    axis: 'tech',
    sectionCode: 'D.3',
    sectionTitle: 'D.3 Sécurité applicative',
    controlCode: 'CUSTOM-01',
    title: 'Rapport scan dépendances Mobile',
    status: 'conforme', // will auto-recompute to non_conforme because sub-item is a_preparer
    subItems: [{ id: 'c_s1', label: 'Export CycloneDX', completed: false, status: 'a_preparer' }],
    isCustom: true,
    orderIndex: 999,
  };

  const merged = mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, [override, custom]);
  assert.equal(merged.length, ANTIC_CHECKLIST_SEED.length + 1);

  const first = merged.find((i) => i.id === ANTIC_CHECKLIST_SEED[0].id);
  assert.equal(first?.status, 'conforme'); // derived from all sub-items being conforme
  assert.equal(first?.ownerName, 'Jean Dupont');
  assert.equal(first?.ownerRole, 'Directeur Technique · DSI');
  assert.equal(first?.subItems[0].comments?.length, 1);
  assert.equal(first?.subItems[0].status, 'conforme');

  const mergedCustom = merged.find((i) => i.id === 'custom_antic_1');
  assert.equal(mergedCustom?.status, 'non_conforme');
});

test('computeComplianceMetrics counts binary parent statuses and granular sub-element statuses', () => {
  const sample: ComplianceChecklistItem[] = [
    {
      ...ANTIC_CHECKLIST_SEED[0],
      status: 'conforme',
      subItems: [
        { id: 's1', label: 'A', completed: true, status: 'conforme' },
        { id: 's2', label: 'B', completed: false, status: 'non_applicable' },
      ],
    },
    {
      ...ANTIC_CHECKLIST_SEED[1],
      status: 'non_conforme',
      subItems: [
        { id: 's3', label: 'C', completed: false, status: 'partiellement_conforme' },
        { id: 's4', label: 'D', completed: false, status: 'a_verifier' },
      ],
    },
    {
      ...ANTIC_CHECKLIST_SEED[2],
      status: 'non_conforme',
      subItems: [
        { id: 's5', label: 'E', completed: false, status: 'en_cours' },
        { id: 's6', label: 'F', completed: false, status: 'non_conforme' },
      ],
    },
    {
      ...ANTIC_CHECKLIST_SEED[3],
      status: 'non_conforme',
      subItems: [
        { id: 's7', label: 'G', completed: false, status: 'non_existant' },
        { id: 's8', label: 'H', completed: false, status: 'a_preparer' },
      ],
    },
  ];

  const metrics = computeComplianceMetrics(sample);
  assert.equal(metrics.totalItems, 4);
  assert.equal(metrics.conformeCount, 1);
  assert.equal(metrics.nonConformeCount, 3);
  assert.equal(metrics.readinessPercent, 25);

  assert.equal(metrics.subItemsTotal, 8);
  assert.equal(metrics.nonApplicableCount, 1);
  assert.equal(metrics.subItemsApplicable, 7);
  assert.equal(metrics.subItemsDone, 1);
  assert.equal(metrics.partiellementConformeCount, 1);
  assert.equal(metrics.aVerifierCount, 1);
  assert.equal(metrics.enCoursCount, 1);
  assert.equal(metrics.subNonConformeCount, 1);
  assert.equal(metrics.nonExistantCount, 1);
  assert.equal(metrics.aPreparerCount, 1);
});

test('filterComplianceItems supports binary parent filters, sub_<status> filters, and search in sub-item comments & ownerRole', () => {
  const items: ComplianceChecklistItem[] = ANTIC_CHECKLIST_SEED.map((i, idx) => {
    if (idx === 0) {
      return {
        ...i,
        ownerRole: 'Responsable_Securite_Unique',
        subItems: i.subItems.map((s) => ({ ...s, completed: true, status: 'conforme' })),
      };
    }
    if (idx === 1) {
      return {
        ...i,
        subItems: i.subItems.map((s, sIdx) =>
          sIdx === 0
            ? {
                ...s,
                status: 'partiellement_conforme',
                comments: [
                  {
                    id: 'c1',
                    author: 'Audit',
                    text: 'Observation_Specifique_ANTIC',
                    createdAt: '2026-11-21T08:00:00.000Z',
                  },
                ],
              }
            : s
        ),
      };
    }
    return i;
  });

  const byParentConforme = filterComplianceItems(items, {
    axis: 'all',
    status: 'conforme',
    search: '',
  });
  assert.equal(byParentConforme.length, 1);
  assert.equal(byParentConforme[0].id, ANTIC_CHECKLIST_SEED[0].id);

  const bySubStatus = filterComplianceItems(items, {
    axis: 'all',
    status: 'sub_partiellement_conforme',
    search: '',
  });
  assert.equal(bySubStatus.length, 1);
  assert.equal(bySubStatus[0].id, ANTIC_CHECKLIST_SEED[1].id);

  const bySubComment = filterComplianceItems(items, {
    axis: 'all',
    status: 'all',
    search: 'Observation_Specifique_ANTIC',
  });
  assert.equal(bySubComment.length, 1);
  assert.equal(bySubComment[0].id, ANTIC_CHECKLIST_SEED[1].id);

  const byOwnerRole = filterComplianceItems(items, {
    axis: 'all',
    status: 'all',
    search: 'Responsable_Securite_Unique',
  });
  assert.equal(byOwnerRole.length, 1);
  assert.equal(byOwnerRole[0].id, ANTIC_CHECKLIST_SEED[0].id);
});

test('status labels, sub-item comments, CSV and Excel/PDF report rows work consistently', () => {
  assert.equal(getComplianceStatusMeta('conforme').label, 'Conforme');
  assert.equal(getComplianceStatusMeta('partiellement_conforme').label, 'Partiellement conforme');
  assert.equal(getComplianceStatusMeta('a_verifier').label, 'À vérifier / Validation');
  assert.equal(getComplianceStatusMeta('en_cours').label, 'En cours de conformité');
  assert.equal(getComplianceStatusMeta('non_conforme').label, 'Non conforme');

  const sample: ComplianceChecklistItem = {
    ...ANTIC_CHECKLIST_SEED[0],
    ownerName: 'Marie Curie',
    ownerRole: 'RSSI',
    status: 'non_conforme',
    subItems: [
      {
        id: 'sub_1',
        label: 'Document signé',
        completed: false,
        status: 'partiellement_conforme',
        comments: [
          {
            id: 'c2',
            author: 'Admin',
            text: 'Planifié pour vendredi',
            createdAt: '2026-11-21T09:00:00.000Z',
          },
        ],
      },
    ],
  };

  assert.equal(
    formatSubItemCommentsText(sample.subItems[0]),
    '[Admin · 2026-11-21] Planifié pour vendredi'
  );
  assert.ok(getCombinedCommentsText(sample).includes('Planifié pour vendredi'));

  const parentRows = prepareComplianceReportRows([sample]);
  assert.equal(parentRows.length, 1);
  assert.equal(parentRows[0].statusLabel, 'Non conforme');
  assert.equal(parentRows[0].ownerName, 'Marie Curie — RSSI');

  const subRows = prepareComplianceSubItemReportRows([sample]);
  assert.equal(subRows.length, 1);
  assert.equal(subRows[0].subStatusLabel, 'Partiellement conforme');
  assert.equal(subRows[0].parentStatusLabel, 'Non conforme');
  assert.ok(subRows[0].subCommentsText.includes('Planifié pour vendredi'));

  const csv = buildAnticCsvExport([sample]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Partiellement conforme'));
  assert.ok(csv.includes('Marie Curie — RSSI'));
  assert.ok(csv.includes('Planifié pour vendredi'));
});
