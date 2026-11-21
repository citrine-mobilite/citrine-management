import test from 'node:test';
import assert from 'node:assert/strict';
import { ANTIC_CHECKLIST_SEED } from '../data/anticChecklistSeed';
import {
  buildAnticCsvExport,
  computeComplianceMetrics,
  filterComplianceItems,
  mergeSeedWithStoredItems,
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

test('mergeSeedWithStoredItems overlays saved DB state and keeps custom items without overwriting defaults', () => {
  const override: ComplianceChecklistItem = {
    ...ANTIC_CHECKLIST_SEED[0],
    status: 'conforme',
    ownerName: 'Directeur Technique',
    documentVersion: 'v2.1',
    documentDate: '2026-11-20',
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
    status: 'en_cours',
    subItems: [{ id: 'c_s1', label: 'Export CycloneDX', completed: false }],
    isCustom: true,
    orderIndex: 999,
  };

  const merged = mergeSeedWithStoredItems(ANTIC_CHECKLIST_SEED, [override, custom]);
  assert.equal(merged.length, ANTIC_CHECKLIST_SEED.length + 1);
  const first = merged.find((i) => i.id === ANTIC_CHECKLIST_SEED[0].id);
  assert.equal(first?.status, 'conforme');
  assert.equal(first?.ownerName, 'Directeur Technique');
  assert.equal(first?.subItems[0].completed, true);
  assert.ok(merged.some((i) => i.id === 'custom_antic_1'));
});

test('computeComplianceMetrics calculates maturity excluding non_applicable from denominator', () => {
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
      status: 'non_applicable',
      subItems: [{ id: 's4', label: 'D', completed: false }],
    },
  ];

  const metrics = computeComplianceMetrics(sample);
  assert.equal(metrics.totalItems, 3);
  assert.equal(metrics.totalApplicable, 2);
  assert.equal(metrics.conformeCount, 1);
  assert.equal(metrics.nonApplicableCount, 1);
  assert.equal(metrics.readinessPercent, 50);
  assert.equal(metrics.subItemsDone, 2);
  assert.equal(metrics.subItemsTotal, 3);
});

test('filterComplianceItems filters by axis, status, pending flag, and search across sub-items', () => {
  const items: ComplianceChecklistItem[] = ANTIC_CHECKLIST_SEED.map((i, idx) =>
    idx === 0 ? { ...i, status: 'conforme' } : i
  );

  const byAxis = filterComplianceItems(items, { axis: 'rh', status: 'all', search: '' });
  assert.ok(byAxis.every((i) => i.axis === 'rh'));
  assert.equal(byAxis.length, 4);

  const bySearch = filterComplianceItems(items, { axis: 'all', status: 'all', search: '2024/017' });
  assert.ok(bySearch.some((i) => i.controlCode === 'SEC_ORG_3.3'));
  assert.ok(bySearch.some((i) => i.controlCode === 'SEC_ORG_5.1'));

  const onlyPending = filterComplianceItems(items, {
    axis: 'general',
    status: 'all',
    search: '',
    onlyPending: true,
  });
  assert.equal(onlyPending.some((i) => i.id === ANTIC_CHECKLIST_SEED[0].id), false);
});

test('buildAnticCsvExport includes UTF-8 BOM and properly formatted rows', () => {
  const csv = buildAnticCsvExport(ANTIC_CHECKLIST_SEED.slice(0, 2));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('GEN-01'));
  assert.ok(csv.includes('GEN-02'));
  assert.ok(csv.includes('Confidentiel'));
});
