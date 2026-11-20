import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractConfiguredHrEmailString,
  parseRecipientEmailList,
  resolveTaskSheetRecipients,
} from './taskSheetRecipientsHelper';

test('parseRecipientEmailList handles multiple separators, display names, and deduplication', () => {
  const result = parseRecipientEmailList(
    'Doleres.Kenne@citrine-mobilite.com, Direction <direction@citrine-mobilite.com>; invalid-email\ndoleres.kenne@citrine-mobilite.com\trh@citrine-mobilite.com'
  );
  assert.deepEqual(result, [
    'Doleres.Kenne@citrine-mobilite.com',
    'direction@citrine-mobilite.com',
    'rh@citrine-mobilite.com',
  ]);
});

test('extractConfiguredHrEmailString prioritizes main_config and supports nested raw_data', () => {
  const settings = [
    { id: 'other_doc', hrNotificationEmail: 'other@citrine-mobilite.com' },
    {
      doc_id: 'main_config',
      raw_data: { hrNotificationEmail: 'rh@citrine-mobilite.com, ceo@citrine-mobilite.com' },
    },
  ];
  assert.equal(
    extractConfiguredHrEmailString(settings),
    'rh@citrine-mobilite.com, ceo@citrine-mobilite.com'
  );
});

test('resolveTaskSheetRecipients prioritizes configured company_settings over admin users', () => {
  const result = resolveTaskSheetRecipients({
    companySettings: [
      { id: 'main_config', hrNotificationEmail: 'rh@citrine-mobilite.com, dir@citrine-mobilite.com' },
    ],
    users: [{ role_id: 1, role: 'administrateur', email: 'admin@citrine-mobilite.com' }],
    envHrEmail: 'env-hr@citrine-mobilite.com',
  });
  assert.deepEqual(result, ['rh@citrine-mobilite.com', 'dir@citrine-mobilite.com']);
});

test('resolveTaskSheetRecipients prioritizes explicit overrideRecipients first', () => {
  const result = resolveTaskSheetRecipients({
    overrideRecipients: ['custom@citrine-mobilite.com'],
    companySettings: [{ id: 'main_config', hrNotificationEmail: 'rh@citrine-mobilite.com' }],
    users: [{ role_id: 1, email: 'admin@citrine-mobilite.com' }],
  });
  assert.deepEqual(result, ['custom@citrine-mobilite.com']);
});

test('resolveTaskSheetRecipients falls back to env HR, then admin users, then SMTP_USER, then default', () => {
  assert.deepEqual(
    resolveTaskSheetRecipients({
      companySettings: [{ id: 'main_config', hrNotificationEmail: '' }],
      envHrEmail: 'env-hr@citrine-mobilite.com',
      users: [{ role_id: 1, email: 'admin@citrine-mobilite.com' }],
    }),
    ['env-hr@citrine-mobilite.com']
  );

  assert.deepEqual(
    resolveTaskSheetRecipients({
      companySettings: [],
      envHrEmail: '',
      users: [
        { role_id: 3, role: 'employé', email: 'emp@citrine-mobilite.com' },
        { role_id: 1, role: 'administrateur', email: 'admin@citrine-mobilite.com' },
      ],
    }),
    ['admin@citrine-mobilite.com']
  );

  assert.deepEqual(
    resolveTaskSheetRecipients({
      companySettings: [],
      envHrEmail: '',
      users: [],
      envSmtpUser: 'smtp@citrine-mobilite.com',
    }),
    ['smtp@citrine-mobilite.com']
  );

  assert.deepEqual(
    resolveTaskSheetRecipients({
      companySettings: [],
      envHrEmail: '',
      users: [],
      envSmtpUser: '',
    }),
    ['citrinemobilite@gmail.com']
  );
});
