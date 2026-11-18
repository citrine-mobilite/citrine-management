import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getMariaDbPool } from '../../db/mariadb';
import { SmtpConfig } from './mailTypesAndParsing';

/**
 * Récupère la configuration SMTP effective avec priorité :
 * 1. customConfig passé en argument (ex: lors d'un test depuis le formulaire)
 * 2. Données persistées en base de données (table company_settings)
 * 3. Variables d'environnement (.env / secrets)
 */
export async function getEffectiveSmtpConfig(customConfig?: Partial<SmtpConfig>): Promise<SmtpConfig> {
  dotenv.config({ quiet: true });

  let dbSettings: any = null;
  try {
    const [rows] = await getMariaDbPool().execute<any[]>(
      "SELECT raw_data, setting_value FROM company_settings WHERE doc_id = 'main_config' OR setting_key = 'main_config' ORDER BY id DESC LIMIT 1"
    );
    if (rows[0]) {
      const raw = rows[0].raw_data && typeof rows[0].raw_data === 'object'
        ? rows[0].raw_data
        : (rows[0].setting_value && typeof rows[0].setting_value === 'object' ? rows[0].setting_value : {});
      dbSettings = raw;
    }
  } catch {
    // Fallback to private environment variables when MariaDB is not yet available.
  }

  const rawHost = customConfig?.host || dbSettings?.smtpHost || process.env.SMTP_HOST || '';
  const rawPort = customConfig?.port ?? (dbSettings?.smtpPort ? Number(dbSettings.smtpPort) : undefined) ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const rawSecure = customConfig?.secure ?? (dbSettings?.smtpSecure !== undefined ? Boolean(dbSettings.smtpSecure) : undefined) ?? (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1');
  const rawFrom = (customConfig?.from || dbSettings?.smtpFrom || process.env.SMTP_FROM || '').trim();
  const rawUser = (customConfig?.user || dbSettings?.smtpUser || process.env.SMTP_USER || rawFrom || '').trim();
  const rawPass = (customConfig?.pass || dbSettings?.smtpPass || process.env.SMTP_PASS || '').trim();
  const senderName = (customConfig?.senderName || dbSettings?.smtpSenderName || process.env.SMTP_SENDER_NAME || 'Citrine Mobilité RH').trim();
  const hrEmail = (customConfig?.hrEmail || dbSettings?.hrNotificationEmail || process.env.HR_NOTIFICATION_EMAIL || '').trim();

  const cleanFrom = rawFrom.includes('<') && rawFrom.includes('>') ? rawFrom.match(/<([^>]+)>/)?.[1].trim() : rawFrom;
  const cleanUser = rawUser.includes('<') && rawUser.includes('>') ? rawUser.match(/<([^>]+)>/)?.[1].trim() : rawUser;
  const user = cleanFrom || cleanUser;
  const pass = rawPass.replace(/\s+/g, '');

  let host = rawHost.trim();
  let port = Number(rawPort) || 587;
  let secure = Boolean(rawSecure);

  if ((!host || host === 'smtp.example.com' || host.includes('example.com')) && user) {
    if (user.endsWith('@gmail.com') || user.endsWith('@googlemail.com')) {
      host = 'smtp.gmail.com';
    } else if (user.endsWith('@outlook.com') || user.endsWith('@hotmail.com')) {
      host = 'smtp.office365.com';
    } else if (user.endsWith('@yahoo.com')) {
      host = 'smtp.mail.yahoo.com';
    }
  }

  if (host === 'smtp.gmail.com') {
    if (port === 465) secure = true;
    if (port === 587) secure = false;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: rawFrom || user,
    senderName,
    hrEmail,
  };
}

/**
 * Crée le transporteur Nodemailer à partir de la configuration effective
 */
export async function getTransporter(customConfig?: Partial<SmtpConfig>): Promise<any | null> {
  const config = await getEffectiveSmtpConfig(customConfig);

  if (!config.host || config.host === 'smtp.example.com' || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}
