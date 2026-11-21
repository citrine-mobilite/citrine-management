import test from 'node:test';
import assert from 'node:assert/strict';
import { ANTIC_CHECKLIST_SEED } from '../data/anticChecklistSeed';
import {
  buildAnticCsvExport,
  computeComplianceMetrics,
  filterComplianceItems,
  getCombinedCommentsText,
  getComplianceStatusMeta,
  mergeSeedWithStoredItems,
  prepareComplianceReportRows,
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

test('mergeSeedWithStoredItems overlays saved DB state, comments, and keeps custom items', () => {
  const override: ComplianceChecklistItem = {
    ...ANTIC_CHECKLIST_SEED[0],
    status: 'conforme',
    ownerName: 'Directeur Technique',
    documentVersion: 'v2.1',
    documentDate: '2026-11-20',
    comments: [
      {
        id: 'cmt_1',
        author: 'RSSI',
        text: 'Validé en comité sécurité',
        createdAt: '2026-11-21T10:00:00.000Z',
      },
    ],
    subItems: ANTIC_CHECKLIST_SEED[0].subItems.map((s, idx) =>
      idx === 0 ? { ...s, completed: true } : s
    ),
  };
  const custom: ComplianceChecklistItem = {
    id: 'custom_antic_1',
    axis: 'tech',
    sectionCode: 'D.3',
    sectionTitle: 'D.3 Sécurité applicative',
    controlCode: 'CUSTOM-01',
    title: 'Rapport scan dépendances Mobile',
    status: 'non_conforme',
    subItems: [{ id: 'c_s1', label: 'Export CycloneDX', completed: false }],
    isCustom: true,
    orderIndex: 999,
  };

  const merged = mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, [override, custom]);
  assert.equal(merged.length, ANTIC_CHECKLIST_SEED.length + 1);
  const first = merged.find((i) => i.id === ANTIC_CHECKLIST_SEED[0].id);
  assert.equal(first?.status, 'conforme');
  assert.equal(first?.ownerName, 'Directeur Technique');
  assert.equal(first?.comments?.length, 1);
  assert.equal(first?.subItems[0].completed, true);
  assert.ok(merged.some((i) => i.id === 'custom_antic_1' && i.status === 'non_conforme'));
});

test('computeComplianceMetrics counts conforme, en_cours, non_conforme and excludes non_applicable', () => {
  const sample: ComplianceChecklistItem[] = [
    {
      ...ANTIC_CHECKLIST_SEED[0],
      status: 'conforme',
      subItems: [
        { id: 's1', label: 'A', completed: true },
        { id: 's2', label: 'B', completed: true },
      ],
    },
    {
      ...ANTIC_CHECKLIST_SEED[1],
      status: 'en_cours',
      subItems: [{ id: 's3', label: 'C', completed: false }],
    },
    {
      ...ANTIC_CHECKLIST_SEED[2],
      status: 'non_conforme',
      subItems: [{ id: 's4', label: 'D', completed: false }],
    },
    {
      ...ANTIC_CHECKLIST_SEED[3],
      status: 'non_applicable',
      subItems: [{ id: 's5', label: 'E', completed: false }],
    },
  ];

  const metrics = computeComplianceMetrics(sample);
  assert.equal(metrics.totalItems, 4);
  assert.equal(metrics.totalApplicable, 3);
  assert.equal(metrics.conformeCount, 1);
  assert.equal(metrics.enCoursCount, 1);
  assert.equal(metrics.nonConformeCount, 1);
  assert.equal(metrics.nonApplicableCount, 1);
  assert.equal(metrics.readinessPercent, 33);
  assert.equal(metrics.subItemsDone, 2);
  assert.equal(metrics.subItemsTotal, 4);
});

test('filterComplianceItems filters by axis, status, pending flag, and search across sub-items and comments', () => {
  const items: ComplianceChecklistItem[] = ANTIC_CHECKLIST_SEED.map((i, idx) =>
    idx === 0
      ? {
          ...i,
          status: 'conforme',
          comments: [
            {
              id: 'c1',
              author: 'Audit',
              text: 'Observation_Specifique_ANTIC',
              createdAt: '2026-11-21T08:00:00.000Z',
            },
          ],
        }
      : i
  );

  const byAxis = filterComplianceItems(items, { axis: 'rh', status: 'all', search: '' });
  assert.ok(byAxis.every((i) => i.axis === 'rh'));
  assert.equal(byAxis.length, 4);

  const byComment = filterComplianceItems(items, {
    axis: 'all',
    status: 'all',
    search: 'Observation_Specifique_ANTIC',
  });
  assert.equal(byComment.length, 1);
  assert.equal(byComment[0].controlCode, 'GEN-01');

  const onlyPending = filterComplianceItems(items, {
    axis: 'general',
    status: 'all',
    search: '',
    onlyPending: true,
  });
  assert.equal(onlyPending.some((i) => i.id === ANTIC_CHECKLIST_SEED[0].id), false);
});

test('status labels, combined comments, CSV and Excel/PDF report rows work consistently', () => {
  assert.equal(getComplianceStatusMeta('conforme').label, 'Conforme');
  assert.equal(getComplianceStatusMeta('en_cours').label, 'En cours de conformité');
  assert.equal(getComplianceStatusMeta('non_conforme').label, 'Non conforme');

  const sample: ComplianceChecklistItem = {
    ...ANTIC_CHECKLIST_SEED[0],
    status: 'non_conforme',
    auditorNotes: 'Politique manquante',
    comments: [
      {
        id: 'c2',
        author: 'Admin',
        text: 'Planifié pour vendredi',
        createdAt: '2026-11-21T09:00:00.000Z',
      },
    ],
  };

  const combined = getCombinedCommentsText(sample);
  assert.ok(combined.includes('Politique manquante'));
  assert.ok(combined.includes('[Admin · 2026-11-21] Planifié pour vendredi'));

  const rows = prepareComplianceReportRows([sample]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].statusLabel, 'Non conforme');
  assert.ok(rows[0].commentsText.includes('Planifié pour vendredi'));

  const csv = buildAnticCsvExport([sample, ANTIC_CHECKLIST_SEED[1]]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Non conforme'));
  assert.ok(csv.includes('Planifié pour vendredi'));
});
