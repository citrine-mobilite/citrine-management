import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export interface EmailThreadingOptions {
  /** Nom complet du collaborateur (ex: "Éric MBIDA") */
  employeeName: string;
  /** Identifiant unique du collaborateur (ex: "12" ou "emp_123") */
  employeeId?: string | number;
  /** Titre ou objet de l'événement précis (ex: "Affectation en Mission Professionnelle") */
  eventTitle: string;
  /** Contenu HTML du message */
  htmlContent: string;
  /** Catégorie de fil pour regrouper tous les mails du même thème (ex: "tasksheet", "conges", "missions") */
  threadCategory?: string;
  /** Sujet optionnel forcé pour le fil (sinon canonique automatique) */
  threadSubject?: string;
  /** Nom de l'expéditeur */
  fromName?: string;
  /** Destinataires optionnels de surcharge pour les tests directs */
  overrideRecipients?: string[];
  /** Ignoré lors de l'envoi : la règle stricte Citrine n'envoie qu'aux adresses de HR_NOTIFICATION_EMAIL */
  employeeEmail?: string;
  recipientEmails?: string[];
  /** Destinataires en copie (CC) - par exemple tous les collaborateurs pour le récapitulatif hebdo */
  cc?: string[] | string;
  /** Pièces jointes éventuelles (ex: TaskSheet Excel .xlsx) */
  attachments?: Array<{
    filename: string;
    content: any;
    encoding?: string;
    contentType?: string;
    cid?: string;
  }>;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  senderName?: string;
  hrEmail?: string;
}

export interface ConsolidatedEmailOptions {
  subject: string;
  title: string;
  htmlContent: string;
  plainText?: string;
  recipientEmails?: string[];
  ccEmails?: string[];
  attachments?: Array<{
    filename: string;
    content: any;
    encoding?: string;
    contentType?: string;
  }>;
}

/**
 * Découpe et valide une chaîne contenant un ou plusieurs e-mails (séparateurs: virgule, point-virgule, espace, saut de ligne)
 */
export function parseEmailList(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.flatMap(r => parseEmailList(r))));
  }

  const tokens = String(raw).split(/[,;\n\r\t]+/).map(t => t.trim()).filter(Boolean);
  const emails: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const token of tokens) {
    const match = token.match(/<([^>]+)>/);
    const candidate = (match ? match[1] : token).trim();
    if (emailRegex.test(candidate)) {
      const lower = candidate.toLowerCase();
      if (!emails.some(e => e.toLowerCase() === lower)) {
        emails.push(candidate);
      }
    }
  }

  return emails;
}

/**
 * Nettoie et normalise une chaîne pour servir d'identifiant de message RFC 2822
 */
export function sanitizeThreadKey(name: string, id?: string | number): string {
  const cleanName = (name || 'collab')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-');
  const cleanId = id ? String(id).replace(/[^a-z0-9]/gi, '') : 'main';
  return `${cleanName}-${cleanId}`;
}

/**
 * Génère un en-tête Thread-Index standard compatible Microsoft Outlook / Exchange / M365 (RFC MS-OXOMSG).
 */
export function generateOutlookThreadIndex(threadKey: string): string {
  const buf = Buffer.alloc(22);
  buf.writeUInt32BE(0x01da4b00, 0);
  buf.writeUInt16BE(0x0000, 4);
  let hash = 0x811c9dc5;
  for (let i = 0; i < threadKey.length; i++) {
    hash ^= threadKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 6; i < 22; i++) {
    buf[i] = ((hash >> ((i % 4) * 8)) & 0xff) ^ (threadKey.charCodeAt(i % threadKey.length) || 0x42);
  }
  return buf.toString('base64');
}
