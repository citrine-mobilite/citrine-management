// src/services/serverMailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_URL = typeof process !== "undefined" && process.env?.SUPABASE_URL || typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL || "https://svvgziqcdahkgyugqlvk.supabase.co";
var SUPABASE_ANON_KEY = typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY || typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmd6aXFjZGFoa2d5dWdxbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTk5MzAsImV4cCI6MjEwNzM3NTkzMH0.p8YQDI_Px3wsaWDJAVxqI7x9luw51NTfYS3wX3x4fY4";
var SUPABASE_SERVICE_ROLE_KEY = typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmd6aXFjZGFoa2d5dWdxbHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTc5OTkzMCwiZXhwIjoyMTA3Mzc1OTMwfQ.lp1wXGSMHuWidi91_92ECvhj84hqQBcO4lbT56LqouE";
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
var supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// src/services/serverMailService.ts
dotenv.config({ quiet: true });
function parseEmailList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.flatMap((r) => parseEmailList(r))));
  }
  const tokens = String(raw).split(/[,;\n\r\t]+/).map((t) => t.trim()).filter(Boolean);
  const emails = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const token of tokens) {
    const match = token.match(/<([^>]+)>/);
    const candidate = (match ? match[1] : token).trim();
    if (emailRegex.test(candidate)) {
      const lower = candidate.toLowerCase();
      if (!emails.some((e) => e.toLowerCase() === lower)) {
        emails.push(candidate);
      }
    }
  }
  return emails;
}
function sanitizeThreadKey(name, id) {
  const cleanName = (name || "collab").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
  const cleanId = id ? String(id).replace(/[^a-z0-9]/gi, "") : "main";
  return `${cleanName}-${cleanId}`;
}
function generateOutlookThreadIndex(threadKey) {
  const buf = Buffer.alloc(22);
  buf.writeUInt32BE(31083264, 0);
  buf.writeUInt16BE(0, 4);
  let hash = 2166136261;
  for (let i = 0; i < threadKey.length; i++) {
    hash ^= threadKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = 6; i < 22; i++) {
    buf[i] = hash >> i % 4 * 8 & 255 ^ (threadKey.charCodeAt(i % threadKey.length) || 66);
  }
  return buf.toString("base64");
}
async function getEffectiveSmtpConfig(customConfig) {
  dotenv.config({ quiet: true });
  let dbSettings = null;
  try {
    const { data } = await Promise.race([
      supabaseAdmin.from("company_settings").select("*"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 3e3))
    ]);
    if (data && Array.isArray(data) && data.length > 0) {
      const match = data.find((s) => s.id === "main_config" || s.doc_id === "main_config") || data[0];
      const raw = match.raw_data && typeof match.raw_data === "object" ? match.raw_data : match.setting_value && typeof match.setting_value === "object" ? match.setting_value : match;
      dbSettings = { ...match, ...raw };
    }
  } catch (err) {
  }
  const rawHost = customConfig?.host || dbSettings?.smtpHost || process.env.SMTP_HOST || "";
  const rawPort = customConfig?.port ?? (dbSettings?.smtpPort ? Number(dbSettings.smtpPort) : void 0) ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const rawSecure = customConfig?.secure ?? (dbSettings?.smtpSecure !== void 0 ? Boolean(dbSettings.smtpSecure) : void 0) ?? (process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1");
  const rawFrom = (customConfig?.from || dbSettings?.smtpFrom || process.env.SMTP_FROM || "").trim();
  const rawUser = (customConfig?.user || dbSettings?.smtpUser || process.env.SMTP_USER || rawFrom || "").trim();
  const rawPass = (customConfig?.pass || dbSettings?.smtpPass || process.env.SMTP_PASS || "").trim();
  const senderName = (customConfig?.senderName || dbSettings?.smtpSenderName || process.env.SMTP_SENDER_NAME || "Citrine Mobilit\xE9 RH").trim();
  const hrEmail = (customConfig?.hrEmail || dbSettings?.hrNotificationEmail || process.env.HR_NOTIFICATION_EMAIL || "").trim();
  const cleanFrom = rawFrom.includes("<") && rawFrom.includes(">") ? rawFrom.match(/<([^>]+)>/)?.[1].trim() : rawFrom;
  const cleanUser = rawUser.includes("<") && rawUser.includes(">") ? rawUser.match(/<([^>]+)>/)?.[1].trim() : rawUser;
  const user = cleanFrom || cleanUser;
  const pass = rawPass.replace(/\s+/g, "");
  let host = rawHost.trim();
  let port = Number(rawPort) || 587;
  let secure = Boolean(rawSecure);
  if ((!host || host === "smtp.example.com" || host.includes("example.com")) && user) {
    if (user.endsWith("@gmail.com") || user.endsWith("@googlemail.com")) {
      host = "smtp.gmail.com";
    } else if (user.endsWith("@outlook.com") || user.endsWith("@hotmail.com")) {
      host = "smtp.office365.com";
    } else if (user.endsWith("@yahoo.com")) {
      host = "smtp.mail.yahoo.com";
    }
  }
  if (host === "smtp.gmail.com") {
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
    hrEmail
  };
}
async function getTransporter(customConfig) {
  const config = await getEffectiveSmtpConfig(customConfig);
  if (!config.host || config.host === "smtp.example.com" || !config.user || !config.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 1e4,
    // 10 secondes max pour connexion TCP
    greetingTimeout: 1e4,
    // 10 secondes max pour handshake SMTP
    socketTimeout: 15e3
    // 15 secondes max socket
  });
}
function buildThreadedEmailHtml(options) {
  const dateStr = options.dateStr || new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Douala",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(/* @__PURE__ */ new Date());
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          
          <!-- En-t\xEAte officiel Citrine Mobilit\xE9 -->
          <tr>
            <td style="background: linear-gradient(135deg, #1F625E 0%, #0F3E3B 100%); padding: 25px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                      CITRINE MOBILIT\xC9
                    </span>
                    <span style="display: block; font-size: 11px; color: #A7F3D0; font-weight: 500; margin-top: 2px;">
                      Direction des Ressources Humaines & Op\xE9rations
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25);">
                      Fil RH Collaborateur
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banni\xE8re Objet du Message dans le fil -->
          <tr>
            <td style="padding: 24px 30px 12px 30px; border-bottom: 1px solid #f5f5f4;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #1F625E; text-transform: uppercase; letter-spacing: 0.8px;">
                      Dossier : ${options.employeeName}
                    </span>
                    <h1 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; color: #0c0a09; line-height: 1.3;">
                      ${options.eventTitle}
                    </h1>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="font-size: 11px; color: #78716c; font-family: monospace;">
                      ${dateStr}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 24px 30px; font-size: 14px; line-height: 1.6; color: #292524;">
              ${options.bodyHtml}
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 30px; border-top: 1px solid #e7e5e4; text-align: center; font-size: 11px; color: #78716c;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #44403c;">
                Citrine Mobilit\xE9 \u2014 Douala, Cameroun
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                Syst\xE8me Automatis\xE9 de Gestion des Ressources Humaines & Pointage \xB7 Notification interne confidentielle
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
async function sendThreadedEmployeeEmail(options, customConfig) {
  const config = await getEffectiveSmtpConfig(customConfig);
  const transporter = await getTransporter(customConfig);
  const cleanCollabName = (options.employeeName || "Collaborateur").trim();
  const threadKey = sanitizeThreadKey(cleanCollabName, options.employeeId);
  let recipients = [];
  if (options.overrideRecipients && options.overrideRecipients.length > 0) {
    recipients = parseEmailList(options.overrideRecipients);
  } else if (options.recipientEmails && options.recipientEmails.length > 0) {
    recipients = parseEmailList(options.recipientEmails);
  } else {
    recipients = parseEmailList(config.hrEmail);
  }
  if (recipients.length === 0) {
    return {
      success: false,
      error: "Aucune adresse e-mail destinataire configur\xE9e dans HR_NOTIFICATION_EMAIL. Veuillez renseigner au moins une adresse valide dans les Param\xE8tres de l'entreprise (E-mail & SMTP) ou dans les variables d'environnement."
    };
  }
  if (!transporter) {
    return {
      success: false,
      error: "Configuration SMTP incompl\xE8te ou introuvable : h\xF4te, utilisateur ou mot de passe non configur\xE9. Veuillez v\xE9rifier les Param\xE8tres de l'entreprise > E-mail & SMTP."
    };
  }
  const effectiveSenderEmail = config.user || (config.from?.includes("<") ? config.from.match(/<([^>]+)>/)?.[1].trim() : config.from) || "citrinemobilite@gmail.com";
  const cleanFrom = config.from?.includes("<") && config.from?.includes(">") ? config.from.match(/<([^>]+)>/)?.[1].trim() || config.from : config.from || effectiveSenderEmail;
  const senderName = config.senderName || options.fromName || "Citrine Mobilit\xE9 RH";
  const fromAddress = `"${senderName.replace(/"/g, "")}" <${cleanFrom}>`;
  const isTimesheet = options.threadCategory === "timesheet" || /feuille|timesheet|fiche de temps|plan du jour/i.test(options.eventTitle);
  const themeKey = isTimesheet ? "timesheet" : options.threadCategory || "rh";
  const threadSubject = options.threadSubject || (isTimesheet ? `Feuille de temps - ${cleanCollabName}` : options.eventTitle ? `${options.eventTitle} - ${cleanCollabName}` : `Dossier RH - ${cleanCollabName}`);
  const domainMatch = cleanFrom.match(/@([^>]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : "citrinemobilite.com";
  const threadRootId = `<citrine-thread-${themeKey}-${threadKey}@${senderDomain}>`;
  const cleanMessageId = `<citrine-msg-${themeKey}-${threadKey}-${Date.now()}.${Math.random().toString(36).substring(2, 7)}@${senderDomain}>`;
  const isAlreadyFullHtml = options.htmlContent.includes("CITRINE") || options.htmlContent.includes("<table") || options.htmlContent.includes("<!DOCTYPE");
  const htmlBody = isAlreadyFullHtml ? `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${threadSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${options.htmlContent}
</body>
</html>` : buildThreadedEmailHtml({
    employeeName: cleanCollabName,
    eventTitle: options.eventTitle,
    bodyHtml: options.htmlContent
  });
  const plainText = [
    `CITRINE MOBILIT\xC9 \u2014 GESTION DES RESSOURCES HUMAINES`,
    `Dossier : ${cleanCollabName}`,
    `Fil de discussion : ${threadSubject}`,
    `Date : ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", dateStyle: "full", timeStyle: "short" }).format(/* @__PURE__ */ new Date())}`,
    `--------------------------------------------------`,
    `La feuille de temps officielle ainsi que le relev\xE9 d'activit\xE9 sont consultables dans le corps du message et via le fichier tableur joint (.xlsx).`,
    ``,
    `Direction des Ressources Humaines & Op\xE9rations`,
    `Citrine Mobilit\xE9 \u2014 Douala, Cameroun`
  ].join("\n");
  try {
    const attachments = (options.attachments || []).map((att) => {
      let contentType = att.contentType;
      if (!contentType) {
        if (att.filename?.endsWith(".xls")) {
          contentType = "application/vnd.ms-excel";
        } else if (att.filename?.endsWith(".xlsx")) {
          contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
          contentType = "application/octet-stream";
        }
      }
      if (typeof att.content === "string" && att.encoding === "base64") {
        return {
          filename: att.filename,
          content: Buffer.from(att.content, "base64"),
          contentType,
          contentDisposition: "attachment"
        };
      }
      return {
        ...att,
        contentType,
        contentDisposition: "attachment"
      };
    });
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(", "),
      replyTo: cleanFrom,
      subject: threadSubject,
      text: plainText,
      html: htmlBody,
      messageId: cleanMessageId,
      inReplyTo: threadRootId,
      references: [threadRootId],
      date: /* @__PURE__ */ new Date(),
      attachments,
      headers: {
        "In-Reply-To": threadRootId,
        "References": threadRootId,
        "Thread-Topic": threadSubject,
        "Thread-Index": generateOutlookThreadIndex(`${themeKey}-${threadKey}`),
        "X-Entity-Ref-ID": threadRootId,
        "X-Mailer": "Citrine RH Mail System 2.1",
        "X-Priority": "3",
        "Priority": "normal",
        "Importance": "Normal",
        "X-MSMail-Priority": "Normal",
        "MIME-Version": "1.0",
        "Organization": "Citrine Mobilit\xE9"
      }
    });
    console.log(`\u2705 [SMTP ENVOY\xC9 THREAD\xC9] ID: ${info.messageId} | Fil: "${threadSubject}" -> [${recipients.join(", ")}]`);
    return {
      success: true,
      messageId: info.messageId,
      recipients,
      simulated: false
    };
  } catch (err) {
    const rawError = err?.message || String(err);
    console.error(`\u274C [SMTP ERROR BRUTE] \xC9chec envoi email pour ${cleanCollabName}:`, {
      message: rawError,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
      stack: err?.stack
    });
    return {
      success: false,
      error: rawError,
      details: {
        code: err?.code,
        command: err?.command,
        response: err?.response,
        responseCode: err?.responseCode,
        stack: err?.stack
      }
    };
  }
}

// src/db/repository.ts
function mapCollectionToTable(collectionName) {
  switch (collectionName) {
    case "users":
      return "users";
    case "employees":
      return "employees";
    case "tasks":
      return "tasks";
    case "task_projects":
      return "task_projects";
    case "reminders":
      return "reminders";
    case "presences":
      return "presences";
    case "attendance_incidents":
      return "attendance_incidents";
    case "badge_codes_16":
      return "badge_codes_16";
    case "dynamic_qr_sessions":
      return "dynamic_qr_sessions";
    case "inventory_items":
    case "inventory":
      return "inventory";
    case "disciplinary_incidents":
      return "disciplinary_incidents";
    case "departments":
      return "departments";
    case "documents":
      return "documents";
    case "rh_document_templates":
      return "rh_document_templates";
    case "processflow_salary_debts":
      return "processflow_salary_debts";
    case "salary_payments":
      return "salary_payments";
    case "financial_transactions":
      return "financial_transactions";
    case "partners":
      return "partners";
    case "notifications":
      return "notifications";
    case "company_settings":
      return "company_settings";
    case "calls":
      return "calls";
    case "user_presences":
      return "user_presences";
    case "job_offers":
      return "job_offers";
    case "job_applications":
      return "job_applications";
    case "expense_claims":
      return "expense_claims";
    case "hse_incidents":
      return "hse_incidents";
    case "visitor_logs":
      return "visitor_logs";
    case "idea_suggestions":
      return "idea_suggestions";
    case "enterprise_surveys":
      return "enterprise_surveys";
    case "connection_logs":
      return "connection_logs";
    case "admin_audit_logs":
    case "citrine_admin_audit_operations_v1":
      return "admin_audit_logs";
    case "leave_requests":
      return "leave_requests";
    case "absences":
      return "absences";
    default:
      return "generic_collections";
  }
}
function isUuid(val) {
  if (typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}
async function getCollectionData(collectionName) {
  const table = mapCollectionToTable(collectionName);
  try {
    if (table === "generic_collections") {
      const { data: data2, error: error2 } = await supabaseAdmin.from("generic_collections").select("*").eq("collection", collectionName);
      if (error2) throw error2;
      return (data2 || []).map((row) => ({
        ...row.data || {},
        id: row.doc_id || row.id,
        _dbId: row.id
      }));
    }
    const { data, error } = await supabaseAdmin.from(table).select("*");
    if (error) {
      if (!error.message.includes("fetch failed")) {
        console.warn(`[SQL getCollectionData error for ${table}]:`, error.message);
      }
      return [];
    }
    return (data || []).map((row) => {
      const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
      if (table === "notifications") {
        const textMsg = row.message || raw.message || raw.content || raw.description || raw.title || "Notification syst\xE8me";
        return {
          ...raw,
          ...row,
          title: row.title || raw.title || "Notification",
          message: textMsg,
          content: raw.content || textMsg,
          id: row.doc_id || row.id || raw.id,
          _dbId: row.id
        };
      }
      if (table === "company_settings") {
        return {
          ...raw,
          id: row.doc_id || raw.id || "main_config",
          docId: row.doc_id || raw.docId || "main_config",
          companyName: raw.companyName || row.setting_value && typeof row.setting_value === "object" && row.setting_value.companyName || "Citrine SARL",
          workStartTime: raw.workStartTime || "08:00",
          plannedDepartureTime: raw.plannedDepartureTime || "16:30",
          _dbId: row.id
        };
      }
      if (table === "hse_incidents") {
        return {
          ...raw,
          ...row,
          id: row.doc_id || String(row.id),
          docId: row.doc_id || String(row.id),
          reference: raw.reference || `HSE-2026-${String(row.id).padStart(4, "0")}`,
          site: row.site_location || raw.site || "Base Japoma - Carrefour Matango",
          zonePrecise: row.zone_precise || raw.zonePrecise || "",
          type: row.type || raw.type || "presque_accident",
          severity: row.severity || raw.severity || "faible",
          date: row.date || raw.date || "",
          time: row.time || raw.time || "",
          title: row.title || raw.title || "",
          description: row.description || raw.description || "",
          reportedBy: row.reported_by || raw.reportedBy || "",
          victimName: row.victim_name || raw.victimName || "",
          daysLost: typeof row.days_lost === "number" ? row.days_lost : typeof raw.daysLost === "number" ? raw.daysLost : 0,
          status: row.status || raw.status || "signale",
          immediateActionTaken: raw.immediateActionTaken || "",
          rootCause: raw.rootCause || "",
          victimInjury: raw.victimInjury || "",
          correctiveActions: raw.correctiveActions || [],
          _dbId: row.id
        };
      }
      return {
        ...raw,
        ...row,
        id: row.doc_id || row.id || raw.id,
        _dbId: row.id
      };
    });
  } catch (error) {
    if (!error?.message?.includes("fetch failed")) {
      console.error(`Database query failed for collection ${collectionName}:`, error);
    }
    return [];
  }
}
async function resolveEmployeeDbId(client, empIdVal) {
  if (!empIdVal) return null;
  if (typeof empIdVal === "number" && Number.isInteger(empIdVal)) return empIdVal;
  const strId = String(empIdVal).trim();
  if (/^\d+$/.test(strId)) return Number(strId);
  try {
    const { data: byDoc } = await client.from("employees").select("id").eq("doc_id", strId).maybeSingle();
    if (byDoc?.id) return Number(byDoc.id);
    const { data: byEmail } = await client.from("employees").select("id").eq("email", strId.toLowerCase()).maybeSingle();
    if (byEmail?.id) return Number(byEmail.id);
  } catch {
  }
  return null;
}
async function resolveUserDbId(client, candidateUserIdVal, recipientEmailOrName) {
  if (!candidateUserIdVal && !recipientEmailOrName) return null;
  try {
    if (candidateUserIdVal) {
      if (typeof candidateUserIdVal === "number" && Number.isInteger(candidateUserIdVal)) {
        const { data: directUser } = await client.from("users").select("id").eq("id", candidateUserIdVal).maybeSingle();
        if (directUser?.id) return Number(directUser.id);
      }
      const strVal = String(candidateUserIdVal).trim();
      if (/^\d+$/.test(strVal)) {
        const num = Number(strVal);
        const { data: directUser } = await client.from("users").select("id").eq("id", num).maybeSingle();
        if (directUser?.id) return Number(directUser.id);
        const { data: empLinked } = await client.from("employees").select("user_id").eq("id", num).maybeSingle();
        if (empLinked?.user_id) {
          const { data: linkedUser } = await client.from("users").select("id").eq("id", empLinked.user_id).maybeSingle();
          if (linkedUser?.id) return Number(linkedUser.id);
        }
      }
      const { data: byDoc } = await client.from("employees").select("user_id").eq("doc_id", strVal).maybeSingle();
      if (byDoc?.user_id) {
        const { data: linkedUser } = await client.from("users").select("id").eq("id", byDoc.user_id).maybeSingle();
        if (linkedUser?.id) return Number(linkedUser.id);
      }
    }
    if (recipientEmailOrName && recipientEmailOrName.includes("@")) {
      const { data: byEmail } = await client.from("users").select("id").eq("email", recipientEmailOrName.trim().toLowerCase()).maybeSingle();
      if (byEmail?.id) return Number(byEmail.id);
    }
  } catch (e) {
    console.warn("[resolveUserDbId error]:", e);
  }
  return null;
}
async function saveDocumentData(collectionName, item) {
  const table = mapCollectionToTable(collectionName);
  const docId = String(item.id || item.docId || `doc_${Date.now()}`);
  const savedItem = { ...item, id: docId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  try {
    if (table === "generic_collections") {
      await supabaseAdmin.from("generic_collections").upsert({
        collection: collectionName,
        doc_id: docId,
        data: savedItem,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "collection,doc_id" });
      return savedItem;
    }
    const rowData = {
      doc_id: docId,
      raw_data: savedItem,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (table === "notifications") {
      rowData.title = item.title || "Notification";
      rowData.message = item.message || item.content || item.description || item.payload || item.title || "Notification syst\xE8me";
      rowData.type = item.type || "system";
      rowData.is_read = Boolean(item.isRead ?? item.read ?? false);
      const resolvedUserId = await resolveUserDbId(
        supabaseAdmin,
        item.targetUserId || item.target_user_id || item.recipient,
        item.recipient
      );
      rowData.target_user_id = resolvedUserId || null;
      if (item.targetUserIds && Array.isArray(item.targetUserIds)) {
        rowData.target_user_ids = item.targetUserIds;
      }
      if (item.targetEmployeeIds && Array.isArray(item.targetEmployeeIds)) {
        rowData.target_employee_ids = item.targetEmployeeIds;
      } else if (item.employeeId || item.targetEmployeeId) {
        const empDbId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.targetEmployeeId);
        if (empDbId) rowData.target_employee_ids = [empDbId];
      }
    } else if (table === "presences") {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.date = item.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.arrival_time = item.arrivalTime || null;
      rowData.departure_time = item.departureTime || null;
      rowData.status = item.status || "present";
      rowData.late_minutes = Number(item.lateMinutes || 0);
      rowData.pause_minutes = Number(item.pauseMinutes || 0);
      rowData.motif = item.motif || item.adminBadgeReason || null;
      rowData.signature = item.signature || null;
      rowData.gps_lat = typeof item.latitude === "number" ? item.latitude : typeof item.gpsLat === "number" ? item.gpsLat : null;
      rowData.gps_lng = typeof item.longitude === "number" ? item.longitude : typeof item.gpsLng === "number" ? item.gpsLng : null;
      rowData.method = item.clockingMethod || item.method || "kiosk";
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "attendance_incidents") {
      rowData.date = item.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.type = item.type || "retard";
      rowData.description = item.reason || item.description || item.origin || "Incident de pr\xE9sence";
      rowData.status = item.status || "en_attente";
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "badge_codes_16") {
      rowData.code = item.code || "";
      rowData.assigned_name = item.assignedName || item.employeeName || null;
      rowData.created_by = item.createdBy || item.generatedBy || "Responsable";
      rowData.expires_at = item.expiresAt || null;
      rowData.is_used = Boolean(item.isUsed);
      rowData.used_at = item.usedAt || null;
      if (item.employeeId || item.usedByEmployeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId || item.usedByEmployeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "dynamic_qr_sessions") {
      rowData.session_id = item.sessionId || item.id || `dyn_${Date.now()}`;
      rowData.created_by = item.createdBy || item.generatedBy || "Responsable";
      rowData.expires_at = item.expiresAt || null;
      rowData.is_active = item.isActive !== false;
    } else if (table === "tasks") {
      rowData.title = item.title || "T\xE2che";
      rowData.description = item.description || null;
      rowData.date = item.date || null;
      rowData.time = item.time || null;
      rowData.status = item.status || "todo";
      rowData.priority = item.priority || "medium";
      rowData.assigned_to = item.assignedTo || null;
      rowData.department = item.department || null;
      rowData.due_date = item.dueDate || null;
      rowData.is_milestone = Boolean(item.isMilestone);
      rowData.milestone_progress = Number(item.milestoneProgress || 0);
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
        else rowData.employee_id = null;
      } else {
        rowData.employee_id = null;
      }
      if (item.projectId && /^\d+$/.test(String(item.projectId))) {
        rowData.project_id = Number(item.projectId);
      } else {
        rowData.project_id = null;
      }
    } else if (table === "reminders") {
      rowData.title = item.title || "Rappel";
      rowData.note = item.note || item.description || null;
      rowData.date = item.date || null;
      rowData.time = item.time || null;
      rowData.location = item.location || null;
      rowData.all_employees = Boolean(item.allEmployees);
      rowData.trigger_before = item.triggerBefore || null;
      rowData.triggered = Boolean(item.triggered);
      rowData.stopped = Boolean(item.stopped);
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "departments") {
      rowData.name = item.name || "D\xE9partement";
      rowData.code = item.code || null;
      rowData.budget_xaf = Number(item.budgetXaf || item.budget || 0);
    } else if (table === "inventory") {
      rowData.name = item.name || item.designation || "Mat\xE9riel";
      rowData.category = item.category || null;
      rowData.serial_number = item.serialNumber || null;
      rowData.quantity = Number(item.quantity || 1);
      rowData.status = item.status || "disponible";
      rowData.unit_price_xaf = Number(item.unitPriceXaf || item.price || 0);
    } else if (table === "documents") {
      rowData.title = item.title || "Document";
      rowData.type = item.type || item.documentType || "general";
    } else if (table === "users") {
      rowData.name = item.name || item.email || "Utilisateur";
      if (item.email) rowData.email = String(item.email).trim();
      rowData.phone = item.phone || null;
      rowData.department = item.department || "Direction G\xE9n\xE9rale";
      rowData.avatar_url = item.avatarUrl || item.photoUrl || null;
      rowData.status = item.status !== false && item.status !== "inactif";
      if (item.roleId) rowData.role_id = Number(item.roleId);
    } else if (table === "employees") {
      rowData.name = item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Collaborateur";
      rowData.first_name = item.firstName || null;
      rowData.last_name = item.lastName || null;
      if (item.email) rowData.email = String(item.email).trim();
      rowData.phone = item.phone || null;
      rowData.department = item.department || "Direction G\xE9n\xE9rale";
      rowData.position = item.position || item.role || item.roleType || null;
      rowData.role_type = item.roleType || item.role || "Employ\xE9";
      rowData.status = item.status === true || item.status === "en_poste";
      rowData.hire_date = item.hireDate ? String(item.hireDate).split("T")[0] : null;
      rowData.salary = Number(item.salary || 0);
      rowData.photo_url = item.photoUrl || item.avatarUrl || null;
      rowData.emergency_contact = item.emergencyContact || null;
      rowData.work_location = item.workLocation || "Douala";
      rowData.badge_code = item.badgeCode || null;
      if (item.userId) {
        if (typeof item.userId === "number") rowData.user_id = item.userId;
        else if (typeof item.userId === "string" && /^\d+$/.test(item.userId)) rowData.user_id = Number(item.userId);
      }
      if (item.roleId) rowData.role_id = Number(item.roleId);
    } else if (table === "disciplinary_incidents") {
      rowData.employee_name = item.employeeName || null;
      rowData.date = item.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.severity = item.severity || "mineure";
      rowData.reason = item.reason || "Incident disciplinaire";
      rowData.action_taken = item.actionTaken || null;
      rowData.decision_by = item.decisionBy || null;
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "rh_document_templates") {
      rowData.name = String(item.name || item.title || "Mod\xE8le RH").trim() || "Mod\xE8le RH";
      rowData.code = String(item.code || docId || `code_${Date.now()}`).trim();
      rowData.type = String(item.type || item.documentType || "general").trim();
      rowData.content_template = String(item.contentTemplate || item.content || item.template || "Contenu du mod\xE8le").trim();
    } else if (table === "company_settings") {
      rowData.setting_key = "main_config";
    } else if (table === "visitor_logs") {
      rowData.visitor_name = item.visitorName || item.visitor_name || item.name || "Visiteur";
      rowData.visitor_company = item.visitorCompany || item.visitor_company || null;
      rowData.visitor_phone = item.visitorPhone || item.visitor_phone || "";
      rowData.id_card_number = item.idCardNumber || item.id_card_number || null;
      rowData.site_location = item.siteLocation || item.site_location || "Si\xE8ge Akwa";
      rowData.purpose = item.purpose || "rdv_commercial";
      rowData.host_employee_id = item.hostEmployeeId ? String(item.hostEmployeeId) : null;
      rowData.host_employee_name = item.hostEmployeeName || item.host_employee_name || null;
      rowData.badge_number = item.badgeNumber || item.badge_number || null;
      rowData.vehicle_plate = item.vehiclePlate || item.vehicle_plate || null;
      rowData.check_in_time = item.checkInTime || item.check_in_time || null;
      rowData.check_in_date = item.checkInDate || item.check_in_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.check_out_time = item.checkOutTime || item.check_out_time || null;
      rowData.status = item.status || "sur_site";
    } else if (table === "leave_requests") {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.type = item.type || "conge_annuel";
      rowData.start_date = item.startDate ? String(item.startDate).split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.end_date = item.endDate ? String(item.endDate).split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.days_count = Number(item.daysCount || 1);
      rowData.reason = item.reason || null;
      rowData.status = item.status || "pending";
      rowData.decided_by = item.decidedBy || null;
      rowData.decided_at = item.decidedAt || null;
      rowData.decision_reason = item.managerComment || item.decisionReason || null;
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "absences") {
      rowData.employee_name = item.employeeName || item.employee_name || null;
      rowData.date = item.date ? String(item.date).split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.type = item.type || "non_justifie";
      rowData.reason = item.reason || null;
      rowData.status = item.status || "en_attente";
      if (item.employeeId) {
        const resolvedId = await resolveEmployeeDbId(supabaseAdmin, item.employeeId);
        if (resolvedId) rowData.employee_id = resolvedId;
      }
    } else if (table === "hse_incidents") {
      rowData.title = item.title;
      rowData.site_location = item.site || item.siteLocation || "Base Japoma - Carrefour Matango";
      rowData.zone_precise = item.zonePrecise || null;
      rowData.type = item.type || "presque_accident";
      rowData.severity = item.severity || "faible";
      rowData.date = item.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      rowData.time = item.time || null;
      rowData.description = item.description || null;
      rowData.reported_by = item.reportedBy || null;
      rowData.victim_name = item.victimName || null;
      rowData.days_lost = Number(item.daysLost || 0);
      rowData.status = item.status || "signale";
    }
    let matchedId = null;
    if (table === "employees" || table === "users") {
      if (docId) {
        const { data: byDoc } = await supabaseAdmin.from(table).select("id").eq("doc_id", docId).maybeSingle();
        if (byDoc?.id) matchedId = byDoc.id;
      }
      if (!matchedId && rowData.id && typeof rowData.id === "number") {
        const { data: byNumId } = await supabaseAdmin.from(table).select("id").eq("id", rowData.id).maybeSingle();
        if (byNumId?.id) matchedId = byNumId.id;
      }
      if (!matchedId && rowData.email) {
        const { data: byEmail } = await supabaseAdmin.from(table).select("id").ilike("email", rowData.email).maybeSingle();
        if (byEmail?.id) matchedId = byEmail.id;
      }
    }
    if (matchedId) {
      const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq("id", matchedId);
      if (updateErr) {
        console.warn(`[repository] Update by id ${matchedId} failed on ${table}:`, updateErr.message);
        throw updateErr;
      }
    } else {
      const { error: saveErr } = await supabaseAdmin.from(table).upsert(rowData, { onConflict: "doc_id" });
      if (saveErr) {
        console.warn(`Database upsert error for table ${table}, trying fallback:`, saveErr.message);
        let existingId = null;
        const { data: existingRows } = await supabaseAdmin.from(table).select("id").eq("doc_id", docId).limit(1);
        if (existingRows && existingRows.length > 0) {
          existingId = existingRows[0].id;
        } else if (rowData.email) {
          const { data: existingByEmail } = await supabaseAdmin.from(table).select("id").ilike("email", rowData.email).limit(1);
          if (existingByEmail && existingByEmail.length > 0) {
            existingId = existingByEmail[0].id;
          }
        }
        if (existingId) {
          const { error: updateErr } = await supabaseAdmin.from(table).update(rowData).eq("id", existingId);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabaseAdmin.from(table).insert(rowData);
          if (insertErr) throw insertErr;
        }
      }
    }
  } catch (error) {
    console.error(`Database save failed for ${collectionName}/${docId}:`, error);
    throw error;
  }
  return savedItem;
}
async function deleteDocumentData(collectionName, id) {
  const table = mapCollectionToTable(collectionName);
  try {
    const strId = String(id).trim();
    if (table === "generic_collections") {
      await supabaseAdmin.from("generic_collections").delete().eq("collection", collectionName).eq("doc_id", strId);
      return true;
    }
    if (/^\d+$/.test(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq("id", Number(strId)),
        supabaseAdmin.from(table).delete().eq("doc_id", strId)
      ]);
    } else if (isUuid(strId)) {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq("uid", strId),
        supabaseAdmin.from(table).delete().eq("doc_id", strId)
      ]);
    } else {
      await Promise.allSettled([
        supabaseAdmin.from(table).delete().eq("doc_id", strId),
        supabaseAdmin.from(table).delete().match({ id: strId })
      ]);
    }
    return true;
  } catch (error) {
    console.error(`Database delete failed for ${collectionName}/${id}:`, error);
    return false;
  }
}
async function getOrCreateUserRecord(uid, email, name, role) {
  try {
    const { data: existing } = await supabaseAdmin.from("users").select("*").eq("uid", uid).limit(1);
    if (existing && existing.length > 0) {
      return existing[0];
    }
    const newUser = {
      uid,
      email,
      name: name || null,
      doc_id: uid,
      raw_data: { uid, email, name, role },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data: inserted, error } = await supabaseAdmin.from("users").upsert(newUser, { onConflict: "uid" }).select().single();
    if (error) throw error;
    return inserted;
  } catch (error) {
    console.error(`Error in getOrCreateUserRecord for ${uid}:`, error);
    return null;
  }
}
async function executeCollaboratorCreationTransaction(input) {
  const userEmail = input.email.trim();
  const empName = input.name.trim();
  const empDepartment = input.department?.trim() || "Direction G\xE9n\xE9rale";
  const initialPassword = input.userPassword?.trim() || "Collab@2026";
  const roleTypeLower = (input.roleType || input.userRole || "").toLowerCase();
  const computedRoleId = roleTypeLower.includes("admin") ? 1 : roleTypeLower.includes("responsable") ? 2 : 3;
  const resolvedRole = computedRoleId === 1 ? "administrateur" : computedRoleId === 2 ? "responsable" : "employ\xE9";
  const empDocId = `emp-${Date.now()}`;
  const userDocId = `user-${Date.now()}`;
  const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", userEmail).maybeSingle();
  if (existingUser) {
    throw new Error(`Un compte utilisateur avec l'email "${userEmail}" existe d\xE9j\xE0.`);
  }
  const { data: existingEmp } = await supabaseAdmin.from("employees").select("id").eq("email", userEmail).maybeSingle();
  if (existingEmp) {
    throw new Error(`Un collaborateur avec l'email "${userEmail}" existe d\xE9j\xE0.`);
  }
  let createdEmployeeDbId = null;
  let createdUserId = null;
  let createdNotifDbId = null;
  console.log(`\u{1F680} [TRANSACTION INITIALIS\xC9E] Cr\xE9ation collaborateur "${empName}" (${userEmail})`);
  try {
    console.log("\u{1F4CC} [TRANSACTION - \xC9TAPE 1/4] Cr\xE9ation du collaborateur initial dans la table employees...");
    const rawEmpData = {
      doc_id: empDocId,
      name: empName,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      email: userEmail,
      phone: input.phone || null,
      role_type: input.roleType || "Employ\xE9",
      department: empDepartment,
      position: input.position || input.roleType || "Employ\xE9",
      status: true,
      hire_date: input.hireDate ? String(input.hireDate).split("T")[0] : null,
      salary: Math.max(0, Number(input.salary) || 0),
      photo_url: input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(empName)}`,
      emergency_contact: null,
      work_location: "Douala",
      user_id: null,
      role_id: null,
      raw_data: {
        doc_id: empDocId,
        team: input.team || null,
        managerId: input.managerId || null,
        birthDate: input.birthDate || null,
        avatarUrl: input.avatarUrl || null,
        departureReason: input.departureReason || null,
        suspensionReason: input.suspensionReason || null
      }
    };
    const { data: empInserted, error: empInsertErr } = await supabaseAdmin.from("employees").insert(rawEmpData).select().single();
    if (empInsertErr || !empInserted) {
      throw new Error(`\xC9tape 1 \xE9chou\xE9e (Cr\xE9ation collaborateur): ${empInsertErr?.message || "Insertion nulle"}`);
    }
    createdEmployeeDbId = empInserted.id;
    console.log(`\u2705 [TRANSACTION - \xC9TAPE 1/4 VALID\xC9E] Collaborateur cr\xE9\xE9 avec succ\xE8s. ID: ${createdEmployeeDbId}, DocID: ${empDocId}`);
    console.log("\u{1F4CC} [TRANSACTION - \xC9TAPE 2/4] Cr\xE9ation automatique du compte utilisateur associ\xE9...");
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: initialPassword,
        email_confirm: true
      });
    } catch (authErr) {
      console.warn("[TRANSACTION] Notice Auth Supabase (utilisateur existant ou non-bloquant):", authErr?.message);
    }
    const { data: userInserted, error: userInsertErr } = await supabaseAdmin.from("users").insert({
      doc_id: userDocId,
      email: userEmail,
      name: empName,
      role_id: computedRoleId,
      status: true,
      department: empDepartment,
      phone: input.phone || null,
      avatar_url: input.avatarUrl || null,
      raw_data: {
        doc_id: userDocId,
        role: resolvedRole,
        roleId: computedRoleId,
        employeeId: empDocId,
        employeeDbId: createdEmployeeDbId,
        department: empDepartment,
        passwordHash: initialPassword,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }).select().single();
    if (userInsertErr || !userInserted) {
      throw new Error(`\xC9tape 2 \xE9chou\xE9e (Cr\xE9ation utilisateur): ${userInsertErr?.message || "Insertion utilisateur nulle"}`);
    }
    createdUserId = userInserted.id;
    console.log(`\u2705 [TRANSACTION - \xC9TAPE 2/4 VALID\xC9E] Utilisateur cr\xE9\xE9 avec succ\xE8s. ID: ${createdUserId}, Email: ${userEmail}`);
    console.log(`\u{1F4CC} [TRANSACTION - \xC9TAPE 3/4] Modification du collaborateur avec user_id: ${createdUserId} et role_id: ${computedRoleId}...`);
    const { data: empUpdated, error: empUpdateErr } = await supabaseAdmin.from("employees").update({
      user_id: createdUserId,
      role_id: computedRoleId,
      raw_data: {
        ...rawEmpData.raw_data,
        userId: createdUserId,
        roleId: computedRoleId
      },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", createdEmployeeDbId).select().single();
    if (empUpdateErr || !empUpdated) {
      throw new Error(`\xC9tape 3 \xE9chou\xE9e (Mise \xE0 jour collaborateur avec user_id/role_id): ${empUpdateErr?.message || "Mise \xE0 jour nulle"}`);
    }
    console.log(`\u2705 [TRANSACTION - \xC9TAPE 3/4 VALID\xC9E] Collaborateur mis \xE0 jour avec succ\xE8s avec user_id: ${createdUserId} et role_id: ${computedRoleId}`);
    console.log("\u{1F4CC} [TRANSACTION - \xC9TAPE 4/4] Cr\xE9ation et enregistrement de la notification...");
    const notifDocId = `notif-collab-${Date.now()}`;
    const notifPayload = {
      employeeId: empDocId,
      employeeDbId: createdEmployeeDbId,
      userId: createdUserId,
      userEmail,
      department: empDepartment,
      role: resolvedRole,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const notifObj = {
      id: notifDocId,
      doc_id: notifDocId,
      type: "system",
      title: "Nouveau collaborateur enregistr\xE9",
      message: `Le collaborateur ${empName} (${empDepartment}) a \xE9t\xE9 cr\xE9\xE9 et li\xE9 \xE0 son compte utilisateur (${userEmail}).`,
      content: `Le collaborateur ${empName} (${empDepartment}) a \xE9t\xE9 cr\xE9\xE9 et li\xE9 \xE0 son compte utilisateur (${userEmail}).`,
      recipient: "Administrateurs & RH",
      target_user_id: createdUserId,
      payload: JSON.stringify(notifPayload),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      read: false,
      is_read: false
    };
    const { data: notifInserted, error: notifInsertErr } = await supabaseAdmin.from("notifications").insert({
      doc_id: notifDocId,
      title: notifObj.title,
      message: notifObj.message,
      type: notifObj.type,
      target_user_id: createdUserId,
      is_read: false,
      raw_data: notifObj
    }).select().single();
    if (notifInsertErr || !notifInserted) {
      console.warn("[TRANSACTION - NOTIFICATION AVERTISSEMENT]:", notifInsertErr?.message);
    } else {
      createdNotifDbId = notifInserted.id;
      console.log("\u{1F514} [NOTIFICATION CR\xC9\xC9E ET ENREGISTR\xC9E AVEC SUCC\xC8S] :", notifObj);
      console.log("\u{1F4CB} [NOTIFICATION D\xC9TAILS] Titre:", notifObj.title, "| Message:", notifObj.message, "| User ID:", createdUserId);
    }
    console.log(`\u{1F389} [TRANSACTION TERMIN\xC9E & COMMITT\xC9E] Collaborateur, Utilisateur et Notification valid\xE9s \xE0 100%!`);
    return {
      success: true,
      employee: {
        ...empUpdated,
        doc_id: empUpdated.doc_id || empDocId,
        _dbId: empUpdated.id,
        id: empUpdated.doc_id || String(empUpdated.id),
        userId: String(createdUserId),
        roleId: computedRoleId
      },
      user: {
        ...userInserted,
        doc_id: userInserted.doc_id || userDocId,
        _dbId: userInserted.id,
        id: String(userInserted.id),
        role: resolvedRole,
        roleId: computedRoleId
      },
      notification: notifObj
    };
  } catch (error) {
    console.error(`\u{1F6A8} [TRANSACTION \xC9CHOU\xC9E - ROLLBACK D\xC9CLENCH\xC9] : ${error?.message || error}`);
    if (createdNotifDbId) {
      try {
        console.log(`\u23EA [ROLLBACK] Suppression de la notification (ID: ${createdNotifDbId})...`);
        await supabaseAdmin.from("notifications").delete().eq("id", createdNotifDbId);
        console.log(`\u2713 [ROLLBACK] Notification supprim\xE9e`);
      } catch (rbNotifErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression notification:`, rbNotifErr?.message);
      }
    }
    if (createdUserId) {
      try {
        console.log(`\u23EA [ROLLBACK] Suppression de l'utilisateur (ID: ${createdUserId})...`);
        await supabaseAdmin.from("users").delete().eq("id", createdUserId);
        console.log(`\u2713 [ROLLBACK] Utilisateur (ID: ${createdUserId}) supprim\xE9`);
      } catch (rbUserErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression utilisateur:`, rbUserErr?.message);
      }
    }
    if (createdEmployeeDbId) {
      try {
        console.log(`\u23EA [ROLLBACK] Suppression du collaborateur (ID: ${createdEmployeeDbId})...`);
        await supabaseAdmin.from("employees").delete().eq("id", createdEmployeeDbId);
        console.log(`\u2713 [ROLLBACK] Collaborateur (ID: ${createdEmployeeDbId}) supprim\xE9`);
      } catch (rbEmpErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression collaborateur:`, rbEmpErr?.message);
      }
    }
    throw new Error(`Transaction annul\xE9e (Rollback complet) : ${error?.message || "Erreur inconnue"}`);
  }
}
async function executeAtomicClockingTransaction(input) {
  const { presence, incident, notification } = input;
  if (!presence) {
    throw new Error("Donn\xE9es de pr\xE9sence obligatoires pour la transaction atomique.");
  }
  let presenceCreatedDbId = null;
  let incidentCreatedDbId = null;
  let notificationCreatedDbId = null;
  console.log(`\u{1F680} [TRANSACTION POINTAGE INITIALIS\xC9E] Collaborateur: ${presence.employeeName || presence.employeeId} - Date: ${presence.date}`);
  try {
    const empIdVal = presence.employeeId || presence.employee_id;
    const resolvedEmpDbId = await resolveEmployeeDbId(supabaseAdmin, empIdVal);
    const presDocId = String(presence.id || presence.docId || `pr-${Date.now()}`);
    const presenceRow = {
      doc_id: presDocId,
      employee_id: resolvedEmpDbId || null,
      employee_name: presence.employeeName || presence.employee_name || null,
      date: presence.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      arrival_time: presence.arrivalTime || null,
      departure_time: presence.departureTime || null,
      status: presence.status || "present",
      late_minutes: Number(presence.lateMinutes || 0),
      pause_minutes: Number(presence.pauseMinutes || 0),
      motif: presence.motif || presence.adminBadgeReason || null,
      signature: presence.signature || null,
      gps_lat: typeof presence.latitude === "number" ? presence.latitude : typeof presence.gpsLat === "number" ? presence.gpsLat : null,
      gps_lng: typeof presence.longitude === "number" ? presence.longitude : typeof presence.gpsLng === "number" ? presence.gpsLng : null,
      method: presence.clockingMethod || presence.method || "qr_code_door",
      raw_data: { ...presence, id: presDocId },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log(`\u{1F4CC} [TRANSACTION POINTAGE - \xC9TAPE 1/3] Enregistrement pr\xE9sence (${presenceRow.doc_id})...`);
    const { data: savedPresence, error: presErr } = await supabaseAdmin.from("presences").upsert(presenceRow, { onConflict: "doc_id" }).select().single();
    if (presErr) {
      console.error("[Atomic Clocking] Presence upsert error:", presErr.message);
      throw new Error(`\xC9chec de sauvegarde de la pr\xE9sence: ${presErr.message}`);
    }
    presenceCreatedDbId = savedPresence.id;
    console.log(`\u2713 [TRANSACTION POINTAGE - \xC9TAPE 1/3] Pr\xE9sence enregistr\xE9e (DB ID: ${presenceCreatedDbId})`);
    let savedIncident = null;
    if (incident) {
      console.log(`\u{1F4CC} [TRANSACTION POINTAGE - \xC9TAPE 2/3] Enregistrement incident (${incident.type})...`);
      const incDocId = String(incident.id || incident.docId || `inc-${Date.now()}`);
      const incEmpId = await resolveEmployeeDbId(supabaseAdmin, incident.employeeId || empIdVal);
      const incidentRow = {
        doc_id: incDocId,
        employee_id: incEmpId || resolvedEmpDbId || null,
        date: incident.date || presenceRow.date,
        type: incident.type || "retard",
        description: incident.reason || incident.description || incident.origin || "Incident de pr\xE9sence",
        status: incident.status || "automatique",
        raw_data: { ...incident, id: incDocId },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { data: incData, error: incErr } = await supabaseAdmin.from("attendance_incidents").upsert(incidentRow, { onConflict: "doc_id" }).select().single();
      if (incErr) {
        console.error("[Atomic Clocking] Incident upsert error:", incErr.message);
        throw new Error(`\xC9chec de sauvegarde de l'incident: ${incErr.message}`);
      }
      savedIncident = incData;
      incidentCreatedDbId = incData.id;
      console.log(`\u2713 [TRANSACTION POINTAGE - \xC9TAPE 2/3] Incident consign\xE9 (DB ID: ${incidentCreatedDbId})`);
    }
    let savedNotification = null;
    if (notification) {
      console.log(`\u{1F4CC} [TRANSACTION POINTAGE - \xC9TAPE 3/3] Enregistrement notification syst\xE8me...`);
      const notifDocId = String(notification.id || notification.docId || `notif-clock-${Date.now()}`);
      const resolvedUserId = await resolveUserDbId(
        supabaseAdmin,
        notification.targetUserId || notification.recipient || empIdVal,
        notification.recipient
      );
      const notifText = notification.message || notification.content || notification.description || notification.title || "Pointage valid\xE9";
      const notificationRow = {
        doc_id: notifDocId,
        title: notification.title || "Pointage enregistr\xE9",
        message: notifText,
        type: notification.type || "system",
        is_read: Boolean(notification.isRead ?? notification.read ?? false),
        target_user_id: resolvedUserId || null,
        target_employee_ids: resolvedEmpDbId ? [resolvedEmpDbId] : null,
        raw_data: { ...notification, id: notifDocId },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { data: notifData, error: notifErr } = await supabaseAdmin.from("notifications").upsert(notificationRow, { onConflict: "doc_id" }).select().single();
      if (notifErr) {
        console.error("[Atomic Clocking] Notification upsert error:", notifErr.message);
        throw new Error(`\xC9chec de sauvegarde de la notification: ${notifErr.message}`);
      }
      savedNotification = notifData;
      notificationCreatedDbId = notifData.id;
      console.log(`\u2713 [TRANSACTION POINTAGE - \xC9TAPE 3/3] Notification \xE9mise (DB ID: ${notificationCreatedDbId})`);
    }
    console.log(`\u{1F389} [TRANSACTION POINTAGE R\xC9USSIE] Pr\xE9sence, incident et notification valid\xE9s atomiquement !`);
    return {
      success: true,
      presence: { ...presence, id: presDocId, _dbId: presenceCreatedDbId },
      incident: savedIncident ? { ...incident, id: incidentRowDoc(savedIncident), _dbId: incidentCreatedDbId } : null,
      notification: savedNotification ? { ...notification, id: notifRowDoc(savedNotification), _dbId: notificationCreatedDbId } : null
    };
  } catch (error) {
    console.error(`\u{1F6A8} [TRANSACTION POINTAGE \xC9CHOU\xC9E - ROLLBACK INT\xC9GRAL] : ${error?.message || error}`);
    if (notificationCreatedDbId) {
      try {
        console.log(`\u23EA [ROLLBACK POINTAGE] Annulation notification (ID: ${notificationCreatedDbId})...`);
        await supabaseAdmin.from("notifications").delete().eq("id", notificationCreatedDbId);
      } catch (rbErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression notification:`, rbErr?.message);
      }
    }
    if (incidentCreatedDbId) {
      try {
        console.log(`\u23EA [ROLLBACK POINTAGE] Annulation incident (ID: ${incidentCreatedDbId})...`);
        await supabaseAdmin.from("attendance_incidents").delete().eq("id", incidentCreatedDbId);
      } catch (rbErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression incident:`, rbErr?.message);
      }
    }
    if (presenceCreatedDbId) {
      try {
        console.log(`\u23EA [ROLLBACK POINTAGE] Annulation pr\xE9sence (ID: ${presenceCreatedDbId})...`);
        await supabaseAdmin.from("presences").delete().eq("id", presenceCreatedDbId);
      } catch (rbErr) {
        console.error(`\u274C [ROLLBACK ERREUR] Suppression pr\xE9sence:`, rbErr?.message);
      }
    }
    throw new Error(`Transaction de pointage atomique annul\xE9e : ${error?.message || "Erreur inconnue"}`);
  }
}
function incidentRowDoc(row) {
  return row?.doc_id || row?.id || `inc-${Date.now()}`;
}
function notifRowDoc(row) {
  return row?.doc_id || row?.id || `notif-${Date.now()}`;
}

// src/server/apiHandler.ts
import { Resend } from "resend";
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  const rawUrl = req.url || "/";
  const urlPath = rawUrl.split("?")[0].replace(/^\/api/, "") || "/";
  const method = req.method?.toUpperCase() || "GET";
  console.log(`\u{1F310} [CITRINE API DISPATCHER] ${method} ${rawUrl} (Route: ${urlPath})`);
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
    }
  }
  body = body || {};
  try {
    if (urlPath === "/health" || urlPath === "/api/health") {
      return res.status(200).json({
        status: "ok",
        environment: "vercel-serverless",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        smtpHostConfigured: Boolean(process.env.SMTP_HOST),
        smtpUserConfigured: Boolean(process.env.SMTP_USER),
        hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
        supabaseConfigured: Boolean(process.env.SUPABASE_URL)
      });
    }
    if (urlPath === "/database/status" || urlPath === "/api/database/status") {
      const isSql = Boolean(process.env.SQL_HOST || process.env.DATABASE_URL || process.env.SUPABASE_URL);
      return res.status(200).json({
        success: true,
        isSqlConfigured: isSql,
        localPersistence: true,
        message: isSql ? "Base de donn\xE9es SQL / Supabase active" : "Persistance locale active"
      });
    }
    const dataMatch = urlPath.match(/^\/data\/([^\/]+)(?:\/([^\/]+))?$/);
    if (dataMatch) {
      const collection = decodeURIComponent(dataMatch[1]);
      const docId = dataMatch[2] ? decodeURIComponent(dataMatch[2]) : void 0;
      if (method === "GET") {
        try {
          const data = await getCollectionData(collection);
          return res.status(200).json({ success: true, data });
        } catch (error) {
          console.error(`[API /data/${collection} GET error]:`, error);
          return res.status(500).json({ success: false, error: error.message || "Failed to fetch data" });
        }
      }
      if (method === "POST") {
        try {
          const item = body;
          const saved = await saveDocumentData(collection, item);
          return res.status(200).json({ success: true, data: saved });
        } catch (error) {
          console.error(`[API /data/${collection} POST error]:`, error);
          return res.status(500).json({ success: false, error: error.message || "Failed to save data" });
        }
      }
      if (method === "DELETE") {
        try {
          if (!docId) {
            return res.status(400).json({ success: false, error: "Identifiant manquant pour la suppression." });
          }
          await deleteDocumentData(collection, docId);
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error(`[API /data/${collection}/${docId} DELETE error]:`, error);
          return res.status(500).json({ success: false, error: error.message || "Failed to delete data" });
        }
      }
    }
    if (urlPath === "/users/sync" && method === "POST") {
      try {
        const { uid, email, name, role } = body;
        if (!uid || !email) {
          return res.status(400).json({ success: false, error: "Missing uid or email" });
        }
        const user = await getOrCreateUserRecord(uid, email, name, role);
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        console.error("[API /users/sync Error]:", error);
        return res.status(500).json({ success: false, error: error.message || "Failed to sync user" });
      }
    }
    if (urlPath === "/collaborators/transactional" && method === "POST") {
      try {
        if (!body?.name || !body?.email) {
          return res.status(400).json({ success: false, error: "Nom et adresse email requis." });
        }
        const result = await executeCollaboratorCreationTransaction(body);
        return res.status(200).json(result);
      } catch (error) {
        console.error("[API /collaborators/transactional Error]:", error);
        return res.status(500).json({ success: false, error: error.message || "\xC9chec de la transaction." });
      }
    }
    if (urlPath === "/clocking/atomic" && method === "POST") {
      try {
        if (!body?.presence) {
          return res.status(400).json({ success: false, error: "Donn\xE9es de pr\xE9sence manquantes." });
        }
        const result = await executeAtomicClockingTransaction(body);
        return res.status(200).json(result);
      } catch (error) {
        console.error("[API /clocking/atomic Error]:", error);
        return res.status(500).json({ success: false, error: error.message || "\xC9chec du pointage atomique." });
      }
    }
    if (urlPath === "/realtime/broadcast" && method === "POST") {
      return res.status(200).json({ success: true, acknowledged: true });
    }
    if (urlPath === "/mail/config" && method === "GET") {
      const config = await getEffectiveSmtpConfig();
      return res.status(200).json({
        success: true,
        config: {
          smtpHost: config.host || "",
          smtpPort: config.port || 587,
          smtpSecure: Boolean(config.secure),
          smtpUser: config.user || "",
          smtpPass: config.pass || "",
          smtpFrom: config.from || "",
          smtpSenderName: config.senderName || "",
          hrNotificationEmail: config.hrEmail || ""
        }
      });
    }
    if (urlPath === "/mail/config" && method === "POST") {
      const {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpSenderName,
        hrNotificationEmail,
        enableEmailNotifications
      } = body;
      let existing = {};
      try {
        const { data } = await supabaseAdmin.from("company_settings").select("*");
        if (data && Array.isArray(data) && data.length > 0) {
          const found = data.find((s) => s.id === "main_config" || s.doc_id === "main_config") || data[0];
          const raw = found.raw_data && typeof found.raw_data === "object" ? found.raw_data : found.setting_value && typeof found.setting_value === "object" ? found.setting_value : found;
          existing = { ...found, ...raw };
        }
      } catch (e) {
        console.warn("\u26A0\uFE0F Impossible de lire les r\xE9glages existants:", e);
      }
      const updatedDoc = {
        ...existing,
        id: "main_config",
        doc_id: "main_config",
        enableEmailNotifications: enableEmailNotifications !== void 0 ? Boolean(enableEmailNotifications) : true,
        smtpHost: smtpHost !== void 0 ? String(smtpHost).trim() : existing.smtpHost,
        smtpPort: smtpPort !== void 0 ? Number(smtpPort) : existing.smtpPort,
        smtpSecure: smtpSecure !== void 0 ? Boolean(smtpSecure) : existing.smtpSecure,
        smtpUser: smtpUser !== void 0 ? String(smtpUser).trim() : existing.smtpUser,
        smtpPass: smtpPass !== void 0 ? String(smtpPass).trim() : existing.smtpPass,
        smtpFrom: smtpFrom !== void 0 ? String(smtpFrom).trim() : existing.smtpFrom,
        smtpSenderName: smtpSenderName !== void 0 ? String(smtpSenderName).trim() : existing.smtpSenderName,
        hrNotificationEmail: hrNotificationEmail !== void 0 ? String(hrNotificationEmail).trim() : existing.hrNotificationEmail,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await supabaseAdmin.from("company_settings").upsert({
        id: "main_config",
        doc_id: "main_config",
        raw_data: updatedDoc,
        setting_value: updatedDoc,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return res.status(200).json({
        success: true,
        message: "Configuration SMTP et RH enregistr\xE9e avec succ\xE8s.",
        config: updatedDoc
      });
    }
    if (urlPath === "/mail/send-threaded" && method === "POST") {
      const {
        employeeName,
        employeeId,
        employeeEmail,
        eventTitle,
        htmlContent,
        attachments,
        smtpConfig,
        threadCategory,
        threadSubject,
        overrideRecipients,
        recipientEmails
      } = body;
      if (!employeeName || !eventTitle || !htmlContent) {
        const missingFields = [
          !employeeName && "employeeName",
          !eventTitle && "eventTitle",
          !htmlContent && "htmlContent"
        ].filter(Boolean).join(", ");
        return res.status(400).json({
          success: false,
          error: `Param\xE8tres obligatoires manquants : ${missingFields}`
        });
      }
      const targetRecipients = overrideRecipients || recipientEmails;
      const result = await sendThreadedEmployeeEmail(
        {
          employeeName,
          employeeId,
          employeeEmail,
          eventTitle,
          threadCategory,
          threadSubject,
          htmlContent,
          attachments,
          overrideRecipients: targetRecipients,
          recipientEmails: targetRecipients
        },
        smtpConfig
      );
      return res.status(result.success ? 200 : 500).json(result);
    }
    if (urlPath === "/mail/test-connection" && method === "POST") {
      const { testRecipient, smtpConfig } = body;
      const effective = await getEffectiveSmtpConfig(smtpConfig);
      const targetRecipients = testRecipient && testRecipient.trim() ? parseEmailList(testRecipient) : parseEmailList(effective.hrEmail);
      if (targetRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun destinataire sp\xE9cifi\xE9 et la variable HR_NOTIFICATION_EMAIL n'est pas configur\xE9e."
        });
      }
      const result = await sendThreadedEmployeeEmail(
        {
          employeeName: "Test Connexion Citrine",
          employeeId: "citrine-test",
          eventTitle: "Test Connexion SMTP - Citrine Mobilit\xE9",
          htmlContent: `<p>Bonjour,</p><p>Ce message confirme que la configuration SMTP de votre application Citrine Mobilit\xE9 est <strong>100% op\xE9rationnelle</strong>.</p><p>Destinataire(s) RH configur\xE9(s) : <code>${targetRecipients.join(", ")}</code></p>`,
          overrideRecipients: targetRecipients,
          recipientEmails: targetRecipients
        },
        smtpConfig
      );
      return res.status(result.success ? 200 : 500).json(result);
    }
    if (urlPath === "/email/send" && method === "POST") {
      const { to, subject, html } = body;
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "RESEND_API_KEY environment variable is missing" });
      }
      const resend = new Resend(apiKey);
      const { data: resData, error: resError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Citrine Management <onboarding@resend.dev>",
        to: [to],
        subject: subject || "Notification Citrine Management",
        html
      });
      if (resError) {
        return res.status(400).json({ success: false, error: resError.message || JSON.stringify(resError) });
      }
      return res.status(200).json({ success: true, data: resData });
    }
    return res.status(404).json({
      success: false,
      error: `Route introuvable sur le dispatcher API : [${method}] ${rawUrl}`,
      receivedPath: urlPath,
      method
    });
  } catch (error) {
    const rawMessage = error?.message || String(error);
    console.error("\u{1F4A5} [CITRINE API DISPATCHER UNHANDLED ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: rawMessage,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack
    });
  }
}
export {
  handler as default
};
