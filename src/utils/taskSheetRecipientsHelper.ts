const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Splits and validates one or more e-mail addresses (separated by commas,
 * semicolons, tabs, or newlines; supports "Display Name <email@domain.com>"),
 * preserving order while removing case-insensitive duplicates.
 */
export function parseRecipientEmailList(raw?: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const merged: string[] = [];
    for (const item of raw) {
      for (const email of parseRecipientEmailList(item)) {
        if (!merged.some((existing) => existing.toLowerCase() === email.toLowerCase())) {
          merged.push(email);
        }
      }
    }
    return merged;
  }

  const tokens = String(raw)
    .split(/[,;\n\r\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const emails: string[] = [];
  for (const token of tokens) {
    const bracketMatch = token.match(/<([^>]+)>/);
    const candidate = (bracketMatch ? bracketMatch[1] : token).trim();
    if (EMAIL_REGEX.test(candidate)) {
      const lower = candidate.toLowerCase();
      if (!emails.some((existing) => existing.toLowerCase() === lower)) {
        emails.push(candidate);
      }
    }
  }

  return emails;
}

/**
 * Extracts the configured HR / TaskSheet recipients string from either
 * a company_settings collection array or a single settings record.
 */
export function extractConfiguredHrEmailString(companySettings?: any[] | any | null): string {
  if (!companySettings) return '';

  const record = Array.isArray(companySettings)
    ? companySettings.find(
        (s: any) => s?.id === 'main_config' || s?.docId === 'main_config' || s?.doc_id === 'main_config'
      ) || companySettings[0]
    : companySettings;

  if (!record || typeof record !== 'object') return '';

  const candidate =
    record.hrNotificationEmail ??
    record.raw_data?.hrNotificationEmail ??
    record.setting_value?.hrNotificationEmail ??
    '';

  return typeof candidate === 'string' ? candidate.trim() : '';
}

export interface ResolveTaskSheetRecipientsInput {
  overrideRecipients?: string[] | string | null;
  companySettings?: any[] | any | null;
  users?: any[];
  envHrEmail?: string | null;
  envSmtpUser?: string | null;
  fallbackEmail?: string;
}

/**
 * Resolves the effective recipient list for TaskSheet emails with clear priority:
 * 1. Explicit overrideRecipients (manual dispatch / API call override)
 * 2. Configured company_settings.hrNotificationEmail (Paramètres > E-mail & TaskSheets)
 * 3. Environment variable HR_NOTIFICATION_EMAIL
 * 4. Active administrator user emails
 * 5. Environment variable SMTP_USER
 * 6. Default fallback email
 */
export function resolveTaskSheetRecipients({
  overrideRecipients,
  companySettings,
  users = [],
  envHrEmail,
  envSmtpUser,
  fallbackEmail = 'citrinemobilite@gmail.com',
}: ResolveTaskSheetRecipientsInput): string[] {
  const overrideList = parseRecipientEmailList(overrideRecipients);
  if (overrideList.length > 0) {
    return overrideList;
  }

  const configuredFromDb = parseRecipientEmailList(extractConfiguredHrEmailString(companySettings));
  if (configuredFromDb.length > 0) {
    return configuredFromDb;
  }

  const configuredFromEnv = parseRecipientEmailList(envHrEmail);
  if (configuredFromEnv.length > 0) {
    return configuredFromEnv;
  }

  const adminUsers = (users || []).filter(
    (u: any) =>
      u?.role_id === 1 ||
      u?.role === 'administrateur' ||
      String(u?.raw_data?.role || '')
        .toLowerCase()
        .includes('admin')
  );
  const adminEmails = parseRecipientEmailList(adminUsers.map((a: any) => a?.email).filter(Boolean));
  if (adminEmails.length > 0) {
    return adminEmails;
  }

  const smtpUserEmails = parseRecipientEmailList(envSmtpUser);
  if (smtpUserEmails.length > 0) {
    return smtpUserEmails;
  }

  return parseRecipientEmailList(fallbackEmail);
}
