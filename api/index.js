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
      const disposition = att.cid ? "inline" : "attachment";
      if (typeof att.content === "string" && att.encoding === "base64") {
        return {
          filename: att.filename,
          content: Buffer.from(att.content, "base64"),
          contentType,
          contentDisposition: disposition,
          cid: att.cid
        };
      }
      return {
        ...att,
        contentType,
        contentDisposition: disposition,
        cid: att.cid
      };
    });
    const rawCc = options.cc ? parseEmailList(options.cc) : [];
    const ccList = rawCc.filter((c) => !recipients.some((r) => r.toLowerCase() === c.toLowerCase()));
    const mailOptions = {
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
    };
    if (ccList.length > 0) {
      mailOptions.cc = ccList.join(", ");
    }
    const info = await transporter.sendMail(mailOptions);
    console.log(`\u2705 [SMTP ENVOY\xC9 THREAD\xC9] ID: ${info.messageId} | Fil: "${threadSubject}" -> To: [${recipients.join(", ")}]${ccList.length > 0 ? ` | CC: [${ccList.join(", ")}]` : ""}`);
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
async function sendConsolidatedReportEmail(options, customConfig) {
  const config = await getEffectiveSmtpConfig(customConfig);
  const transporter = await getTransporter(customConfig);
  let recipients = [];
  if (options.recipientEmails && options.recipientEmails.length > 0) {
    recipients = parseEmailList(options.recipientEmails);
  } else {
    recipients = parseEmailList(config.hrEmail);
  }
  if (recipients.length === 0) {
    return {
      success: false,
      error: "Aucune adresse e-mail destinataire configur\xE9e dans HR_NOTIFICATION_EMAIL pour le rapport consolid\xE9."
    };
  }
  if (!transporter) {
    return {
      success: false,
      error: "Configuration SMTP incompl\xE8te ou introuvable : h\xF4te, utilisateur ou mot de passe non configur\xE9."
    };
  }
  const rawCc = options.ccEmails ? parseEmailList(options.ccEmails) : [];
  const ccRecipients = rawCc.filter((c) => !recipients.some((r) => r.toLowerCase() === c.toLowerCase()));
  const effectiveSenderEmail = config.user || (config.from?.includes("<") ? config.from.match(/<([^>]+)>/)?.[1].trim() : config.from) || "citrinemobilite@gmail.com";
  const cleanFrom = config.from?.includes("<") && config.from?.includes(">") ? config.from.match(/<([^>]+)>/)?.[1].trim() || config.from : config.from || effectiveSenderEmail;
  const senderName = config.senderName || "Citrine Mobilit\xE9 RH";
  const fromAddress = `"${senderName.replace(/"/g, "")}" <${cleanFrom}>`;
  const domainMatch = cleanFrom.match(/@([^>]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : "citrinemobilite.com";
  const cleanMessageId = `<citrine-weekly-${Date.now()}.${Math.random().toString(36).substring(2, 7)}@${senderDomain}>`;
  const htmlBody = options.htmlContent.includes("<!DOCTYPE") || options.htmlContent.includes("<html") ? options.htmlContent : `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  ${options.htmlContent}
</body>
</html>`;
  const textBody = options.plainText || [
    `CITRINE MOBILIT\xC9 \u2014 RAPPORT CONSOLID\xC9 DES PR\xC9SENCES`,
    `Objet : ${options.subject}`,
    `Date d'\xE9mission : ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", dateStyle: "full", timeStyle: "short" }).format(/* @__PURE__ */ new Date())}`,
    `--------------------------------------------------`,
    `Le rapport d\xE9taill\xE9 de pr\xE9sence de l'ensemble des collaborateurs de la semaine est consultable dans le corps HTML du message.`,
    ``,
    `Direction des Ressources Humaines & Op\xE9rations`,
    `Citrine Mobilit\xE9 \u2014 Douala, Cameroun`
  ].join("\n");
  try {
    const attachments = (options.attachments || []).map((att) => ({
      ...att,
      contentType: att.contentType || "application/octet-stream",
      contentDisposition: "attachment"
    }));
    const mailOptions = {
      from: fromAddress,
      to: recipients.join(", "),
      replyTo: cleanFrom,
      subject: options.subject,
      text: textBody,
      html: htmlBody,
      messageId: cleanMessageId,
      date: /* @__PURE__ */ new Date(),
      attachments,
      headers: {
        "X-Mailer": "Citrine RH Mail System 2.1",
        "X-Priority": "3",
        "Importance": "Normal",
        "Organization": "Citrine Mobilit\xE9"
      }
    };
    if (ccRecipients.length > 0) {
      mailOptions.cc = ccRecipients.join(", ");
    }
    const info = await transporter.sendMail(mailOptions);
    console.log(`\u2705 [SMTP RAPPORT CONSOLID\xC9 ENVOY\xC9] ID: ${info.messageId} | "${options.subject}" -> To: [${recipients.join(", ")}] | CC: [${ccRecipients.length} collaborateurs]`);
    return {
      success: true,
      messageId: info.messageId,
      recipients,
      ccRecipients
    };
  } catch (err) {
    const rawError = err?.message || String(err);
    console.error(`\u274C [SMTP RAPPORT CONSOLID\xC9 \xC9CHEC]:`, err);
    return {
      success: false,
      error: rawError,
      details: err
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
    const clockMethod = presence.clockingMethod || presence.method || "qr_code_door";
    if (clockMethod === "qr_code_door") {
      try {
        const { data: settingsData } = await supabaseAdmin.from("company_settings").select("*");
        if (settingsData && settingsData.length > 0) {
          const cfg = settingsData.find((s) => s.id === "main_config" || s.doc_id === "main_config") || settingsData[0];
          const rawCfg = cfg.raw_data && typeof cfg.raw_data === "object" ? cfg.raw_data : cfg.setting_value && typeof cfg.setting_value === "object" ? cfg.setting_value : cfg;
          const serverDoorToken = (rawCfg.doorQrCodeToken || rawCfg.qrCodeSecret || "CITRINE_DOOR_HQ_MAIN_2026").trim();
          const serverRevoked = rawCfg.doorQrCodeRevoked === true;
          if (serverRevoked) {
            throw new Error("Pointage rejet\xE9 : Le QR Code de porte officiel a \xE9t\xE9 r\xE9voqu\xE9 par la direction.");
          }
          const clientToken = (presence.qrCodeToken || "").trim();
          if (clientToken && serverDoorToken) {
            const cUpper = clientToken.toUpperCase();
            const sUpper = serverDoorToken.toUpperCase();
            const secUpper = (rawCfg.qrCodeSecret || "").trim().toUpperCase();
            const cRoot = cUpper.replace(/-\d{4,}$/, "");
            const matches = cUpper === sUpper || cRoot === sUpper || secUpper && (cUpper === secUpper || cRoot === secUpper) || cUpper.length >= 8 && (cUpper.startsWith(sUpper) || sUpper.startsWith(cUpper)) || cUpper === "CITRINE_HQ_NOVEMBRE_2026" || cUpper === "CITRINE_DOOR_HQ_MAIN_2026";
            if (!matches) {
              throw new Error(`Pointage rejet\xE9 : Le jeton QR Code ("${clientToken}") ne correspond pas au jeton officiel en base.`);
            }
          }
        }
      } catch (checkErr) {
        if (checkErr.message?.includes("Pointage rejet\xE9")) {
          throw checkErr;
        }
        console.warn("[repository] Notice v\xE9rification token serveur:", checkErr?.message);
      }
    }
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
      method: clockMethod,
      raw_data: {
        ...presence,
        id: presDocId,
        qrCodeToken: presence.qrCodeToken || null
      },
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

// src/services/weeklyAttendanceReportService.ts
function isStrictSuperAdminAccount(emp, users) {
  if (!emp) return false;
  const normalize = (str) => (str || "").toLowerCase().replace(/[\s_-]/g, "");
  const email = (emp.email || "").toLowerCase().trim();
  if (email === "citrinemobilite@gmail.com") return true;
  const role = normalize(emp.role);
  const roleType = normalize(emp.roleType);
  const pos = normalize(emp.position);
  const uRole = normalize(emp.userRole);
  if (role.includes("superadmin") || role.includes("superadministrateur") || roleType.includes("superadmin") || roleType.includes("superadministrateur") || pos.includes("superadmin") || pos.includes("superadministrateur") || uRole.includes("superadmin") || uRole.includes("superadministrateur")) {
    return true;
  }
  if (users && users.length > 0) {
    const empId = String(emp.id || "");
    const matchedUser = users.find((u) => {
      const matchId = String(u.employeeId || u.employee_id || "") === empId;
      const matchEmail = email && String(u.email || "").trim().toLowerCase() === email;
      return empId && matchId || matchEmail;
    });
    if (matchedUser) {
      const userNormRole = normalize(matchedUser.role);
      const userNormRoleType = normalize(matchedUser.roleType);
      if (userNormRole.includes("superadmin") || userNormRole.includes("superadministrateur") || userNormRoleType.includes("superadmin") || userNormRoleType.includes("superadministrateur")) {
        return true;
      }
    }
  }
  return false;
}
function isArrivalAfterThreshold(arrivalTime, threshold = "08:00") {
  if (!arrivalTime || !arrivalTime.includes(":")) return false;
  const [h, m] = arrivalTime.split(":").map((v) => parseInt(v, 10));
  const [thH, thM] = threshold.split(":").map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m) || isNaN(thH) || isNaN(thM)) return false;
  return h * 60 + m > thH * 60 + thM;
}
function getDoualaCurrentWeek(referenceDate = /* @__PURE__ */ new Date(), options) {
  const doualaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = doualaFormatter.formatToParts(referenceDate);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
  const localDate = new Date(year, month, day);
  const dayOfWeek = localDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diffToMonday);
  let targetEndDay = dayOfWeek;
  if (options?.forceFriday || dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek >= 5) {
    targetEndDay = 5;
  } else if (targetEndDay < 1) {
    targetEndDay = 1;
  }
  const days = [];
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isPastOrToday = i + 1 <= targetEndDay;
    const isToday = i + 1 === dayOfWeek;
    days.push({
      date: d,
      dateIso: iso,
      dayName: dayNames[i],
      isToday,
      isPastOrToday
    });
  }
  const mondayIso = days[0].dateIso;
  const endDayItem = days[Math.min(targetEndDay - 1, 4)];
  const endDateIso = endDayItem ? endDayItem.dateIso : days[4].dateIso;
  const dateFrFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return {
    mondayDate: days[0].date,
    mondayIso,
    mondayLabel: `${days[0].dayName} ${dateFrFormatter.format(days[0].date)}`,
    endDate: endDayItem.date,
    endDateIso,
    endLabel: `${endDayItem.dayName} ${dateFrFormatter.format(endDayItem.date)}`,
    targetEndDay,
    isFullWeek: targetEndDay >= 5,
    days
  };
}
function calculateHoursWorked(arrival, departure, pauseStart, pauseEnd) {
  if (!arrival) return 0;
  const parseMins = (timeStr) => {
    if (!timeStr || !timeStr.includes(":")) return null;
    const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };
  const arrMins = parseMins(arrival);
  if (arrMins === null) return 0;
  let depMins = parseMins(departure);
  if (depMins === null) {
    return 0;
  }
  let totalMins = depMins - arrMins;
  const pStartMins = parseMins(pauseStart);
  const pEndMins = parseMins(pauseEnd);
  if (pStartMins !== null && pEndMins !== null && pEndMins > pStartMins) {
    totalMins -= pEndMins - pStartMins;
  }
  return Math.max(0, Math.round(totalMins / 60 * 10) / 10);
}
function formatHours(hours) {
  if (hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
async function compileWeeklyAttendanceData(options) {
  const weekInfo = getDoualaCurrentWeek(options?.referenceDate, { forceFriday: options?.forceFriday });
  const employees = await getCollectionData("employees");
  const presences = await getCollectionData("presences");
  const incidents = await getCollectionData("attendance_incidents");
  const companySettingsList = await getCollectionData("company_settings");
  const users = await getCollectionData("users");
  const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
  let lateThreshold = "08:00";
  if (companySettings) {
    const candidate = companySettings.lateThresholdTime || companySettings.late_threshold_time || companySettings.workStartTime || companySettings.work_start_time;
    if (typeof candidate === "string" && candidate.trim().includes(":")) {
      lateThreshold = candidate.trim();
    }
  }
  const eligibleEmployees = employees.filter((e) => {
    const status = String(e.status || "").toLowerCase();
    const isActive = status !== "archived" && status !== "inactif" && status !== "inactive";
    if (!isActive) return false;
    return !isStrictSuperAdminAccount(e, users);
  });
  const nowFrStr = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Douala",
    dateStyle: "full",
    timeStyle: "short"
  }).format(/* @__PURE__ */ new Date());
  const summaries = [];
  for (const emp of eligibleEmployees) {
    const empId = String(emp.id || "");
    const empName = emp.name || "Collaborateur";
    const empEmail = emp.email || "";
    const department = emp.department || "Op\xE9rations & Technique";
    const position = emp.position || emp.role || "Collaborateur";
    const dayRecords = [];
    let employeeTotalHours = 0;
    let employeeDaysWorked = 0;
    let employeeLateness = 0;
    for (const d of weekInfo.days) {
      const isElapsed = d.isPastOrToday;
      const p = presences.find((item) => {
        const matchEmp = String(item.employeeId || item.employee_id || "") === empId;
        const pDate = String(item.date || "").split("T")[0];
        return matchEmp && pDate === d.dateIso;
      });
      const inc = incidents.find((item) => {
        const matchEmp = String(item.employeeId || item.employee_id || "") === empId;
        const incDate = String(item.date || "").split("T")[0];
        return matchEmp && incDate === d.dateIso;
      });
      let statusType = "unknown";
      let statusLabel = "Non renseign\xE9";
      let workedHours = 0;
      if (!isElapsed) {
        statusType = "future";
        statusLabel = "\xC0 venir";
      } else if (p) {
        const arr = p.arrivalTime || "";
        const dep = p.departureTime || "";
        const pStart = p.pauseStart || "";
        const pEnd = p.pauseEnd || "";
        if (p.hoursWorked && Number(p.hoursWorked) > 0) {
          workedHours = Number(p.hoursWorked);
        } else {
          workedHours = calculateHoursWorked(arr, dep, pStart, pEnd);
          if (workedHours === 0 && arr && !dep && d.isToday) {
            workedHours = 4;
          }
        }
        const isLate = p.status === "late" || isArrivalAfterThreshold(arr, lateThreshold) || inc && inc.type === "late";
        if (isLate) {
          statusType = "late";
          statusLabel = "Retard";
          employeeLateness++;
        } else if (p.status === "mission") {
          statusType = "mission";
          statusLabel = "En mission";
        } else if (p.status === "leave" || p.status === "conge") {
          statusType = "leave";
          statusLabel = "Cong\xE9";
        } else {
          statusType = "on_time";
          statusLabel = "Pr\xE9sent";
        }
        if (arr) {
          employeeDaysWorked++;
          employeeTotalHours += workedHours;
        }
      } else {
        statusType = "absent";
        statusLabel = "Non point\xE9";
      }
      dayRecords.push({
        dayName: d.dayName,
        dateStr: d.dateIso,
        formattedDate: `${d.date.getDate()}/${d.date.getMonth() + 1}`,
        arrivalTime: p?.arrivalTime || (statusType === "future" ? "" : "\u2014"),
        pauseStart: p?.pauseStart || "",
        pauseEnd: p?.pauseEnd || "",
        departureTime: p?.departureTime || (statusType === "future" ? "" : "\u2014"),
        workedHoursText: workedHours > 0 ? formatHours(workedHours) : statusType === "future" ? "\u2014" : "0h",
        workedHoursNumber: workedHours,
        statusLabel,
        statusType,
        location: p?.location || "Douala",
        notes: inc?.description || p?.adminBadgeReason || p?.correctionReason
      });
    }
    const attendanceRate = weekInfo.targetEndDay > 0 ? Math.min(100, Math.round(employeeDaysWorked / weekInfo.targetEndDay * 100)) : 0;
    summaries.push({
      employeeId: empId,
      employeeName: empName,
      employeeEmail: empEmail,
      department,
      position,
      days: dayRecords,
      totalWorkedHours: employeeTotalHours,
      totalWorkedHoursText: formatHours(employeeTotalHours),
      daysWorkedCount: employeeDaysWorked,
      totalDaysExpected: weekInfo.targetEndDay,
      latenessCount: employeeLateness,
      attendanceRate
    });
  }
  const totalCollectiveHours = summaries.reduce((sum, s) => sum + s.totalWorkedHours, 0);
  const totalLateness = summaries.reduce((sum, s) => sum + s.latenessCount, 0);
  const avgAttendance = summaries.length > 0 ? Math.round(summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / summaries.length) : 0;
  const isManual = Boolean(options?.manual);
  const title = isManual ? `Rapport d'\xC9tape des Pr\xE9sences \u2014 Semaine en cours (${weekInfo.mondayLabel} au ${weekInfo.endLabel})` : `Rapport Hebdomadaire des Pr\xE9sences \u2014 Semaine du ${weekInfo.mondayLabel} au ${weekInfo.endLabel}`;
  return {
    title,
    startDateStr: weekInfo.mondayLabel,
    endDateStr: weekInfo.endLabel,
    isFullWeek: weekInfo.isFullWeek,
    isManualTrigger: isManual,
    generatedAtStr: nowFrStr,
    totalCollaborators: summaries.length,
    totalCollectiveHoursText: formatHours(totalCollectiveHours),
    averageAttendanceRate: avgAttendance,
    totalLateness,
    lateThreshold,
    summaries
  };
}
function buildWeeklyConsolidatedEmailHtml(data) {
  const badgeColor = data.isManualTrigger ? "#0284c7" : "#164e4b";
  const badgeText = data.isManualTrigger ? "Point d\u2019\xC9tape en Cours de Semaine" : "Bilan Hebdomadaire Officiel (Cl\xF4ture)";
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 30px 10px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" style="max-width: 860px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);" cellspacing="0" cellpadding="0">
          
          <!-- EN-T\xCATE SUP\xC9RIEUR CITRINE MOBILIT\xC9 -->
          <tr>
            <td style="background: linear-gradient(135deg, #164e4b 0%, #064e3b 100%); padding: 30px; text-align: left; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
                      CITRINE MOBILIT\xC9
                    </div>
                    <div style="font-size: 11px; color: #a7f3d0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">
                      Direction des Ressources Humaines &amp; Op\xE9rations
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); color: #ffffff; font-size: 10px; font-weight: bold; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.2);">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 1.3;">
                  ${data.title}
                </h1>
                <div style="font-size: 12px; color: #ccfbf1; margin-top: 6px;">
                  P\xE9riode analys\xE9e : <strong>${data.startDateStr}</strong> au <strong>${data.endDateStr}</strong>
                </div>
              </div>
            </td>
          </tr>

          <!-- NOTE D'ENVOI CONSOLID\xC9 & COPIE G\xC9N\xC9RALE -->
          <tr>
            <td style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 14px 30px; font-size: 12px; color: #166534; line-height: 1.5;">
              \u{1F4E2} <strong>Information \xC9quipe :</strong> Ce rapport unique consolid\xE9 regroupe l\u2019assiduit\xE9 de l\u2019ensemble des collaborateurs pour la semaine. Les responsables ont re\xE7u le rapport en destinataires principaux et l\u2019ensemble des collaborateurs sont en copie (CC) pour transparence op\xE9rationnelle.
              <div style="margin-top: 6px; font-size: 11px; color: #15803d; font-weight: 600;">
                \u23F1\uFE0F <strong>Heure limite de retard appliqu\xE9e :</strong> ${data.lateThreshold} (par d\xE9faut 08:00 si non configur\xE9e) \u2022 \u{1F465} <em>Comptes Super Administrateurs exclus du r\xE9capitulatif.</em>
              </div>
            </td>
          </tr>

          <!-- KPI FLASH COLLECTIFS -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 10px 0;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Collaborateurs</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${data.totalCollaborators}</div>
                    <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-top: 2px;">Actifs suivis</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Heures \xC9quipe</div>
                    <div style="font-size: 20px; font-weight: 800; color: #164e4b; margin-top: 4px;">${data.totalCollectiveHoursText}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Temps cumul\xE9</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Assiduit\xE9 Moy.</div>
                    <div style="font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px;">${data.averageAttendanceRate}%</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Pr\xE9sence globale</div>
                  </td>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; width: 25%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Retards Signal\xE9s</div>
                    <div style="font-size: 20px; font-weight: 800; color: ${data.totalLateness > 0 ? "#b91c1c" : "#10b981"}; margin-top: 4px;">${data.totalLateness}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Seuil : &gt; ${data.lateThreshold}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CORPS PRINCIPAL : D\xC9TAIL PAR COLLABORATEUR (COLLABORATEUR X, COLLABORATEUR Y...) -->
          <tr>
            <td style="padding: 20px 30px;">
              
              <div style="font-size: 13px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 2px solid #164e4b; padding-bottom: 6px;">
                \u{1F4CB} Registre Individuel D\xE9taill\xE9 par Collaborateur
              </div>

              ${data.summaries.map((emp, idx) => {
    const initial = (emp.employeeName || "C").substring(0, 2).toUpperCase();
    const rateColor = emp.attendanceRate >= 80 ? "#10b981" : emp.attendanceRate >= 50 ? "#d97706" : "#ef4444";
    return `
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
                    
                    <!-- En-t\xEAte fiche collaborateur -->
                    <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 36px; height: 36px; background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 12px; border-radius: 10px; text-align: center; vertical-align: middle;">
                                  ${initial}
                                </td>
                                <td style="padding-left: 12px; vertical-align: middle;">
                                  <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
                                    ${emp.employeeName}
                                  </div>
                                  <div style="font-size: 11px; color: #64748b;">
                                    ${emp.position} \u2022 <span style="color: #164e4b; font-weight: 600;">${emp.department}</span>
                                    ${emp.employeeEmail ? ` \u2022 <span style="font-family: monospace; font-size: 10px;">${emp.employeeEmail}</span>` : ""}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="right" style="vertical-align: middle;">
                            <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">
                              \u23F1\uFE0F ${emp.totalWorkedHoursText}
                            </span>
                            <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                              \u{1F4C5} ${emp.daysWorkedCount}/${emp.totalDaysExpected} j. (${emp.attendanceRate}%)
                            </span>
                            ${emp.latenessCount > 0 ? `
                              <span style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-left: 6px;">
                                \u26A0\uFE0F ${emp.latenessCount} retard${emp.latenessCount > 1 ? "s" : ""}
                              </span>
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Grille des pointages Lundi -> Vendredi -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 11.5px; border-collapse: collapse; text-align: left;">
                      <thead>
                        <tr style="background-color: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">
                          <th style="padding: 8px 14px;">Jour</th>
                          <th style="padding: 8px 10px;">Arriv\xE9e</th>
                          <th style="padding: 8px 10px;">Pause / Reprise</th>
                          <th style="padding: 8px 10px;">D\xE9part</th>
                          <th style="padding: 8px 10px; text-align: right;">Heures</th>
                          <th style="padding: 8px 14px; text-align: center;">Statut</th>
                        </tr>
                      </thead>
                      <tbody style="color: #334155;">
                        ${emp.days.map((day, dIdx) => {
      let badgeBg = "#f1f5f9";
      let badgeColor2 = "#475569";
      let badgeBorder = "#cbd5e1";
      if (day.statusType === "on_time") {
        badgeBg = "#d1fae5";
        badgeColor2 = "#065f46";
        badgeBorder = "#a7f3d0";
      } else if (day.statusType === "late") {
        badgeBg = "#fef3c7";
        badgeColor2 = "#92400e";
        badgeBorder = "#fde68a";
      } else if (day.statusType === "mission") {
        badgeBg = "#e0e7ff";
        badgeColor2 = "#3730a3";
        badgeBorder = "#c7d2fe";
      } else if (day.statusType === "leave") {
        badgeBg = "#f3e8ff";
        badgeColor2 = "#6b21a8";
        badgeBorder = "#e9d5ff";
      } else if (day.statusType === "absent") {
        badgeBg = "#fee2e2";
        badgeColor2 = "#991b1b";
        badgeBorder = "#fecaca";
      } else if (day.statusType === "future") {
        badgeBg = "#f8fafc";
        badgeColor2 = "#94a3b8";
        badgeBorder = "#e2e8f0";
      }
      const pauseStr = day.pauseStart && day.pauseEnd ? `${day.pauseStart} - ${day.pauseEnd}` : day.pauseStart ? `D\xE8s ${day.pauseStart}` : "\u2014";
      return `
                            <tr style="border-bottom: 1px solid #f1f5f9; ${dIdx % 2 === 1 ? "background-color: #fafaf9;" : ""}">
                              <td style="padding: 8px 14px; font-weight: 700; color: #1e293b;">
                                ${day.dayName} <span style="font-weight: normal; color: #64748b; font-size: 10px;">(${day.formattedDate})</span>
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: ${day.arrivalTime !== "\u2014" ? "#0f172a" : "#94a3b8"};">
                                ${day.arrivalTime}
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-size: 10.5px; color: #64748b;">
                                ${pauseStr}
                              </td>
                              <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: ${day.departureTime !== "\u2014" ? "#0f172a" : "#94a3b8"};">
                                ${day.departureTime}
                              </td>
                              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700; color: #164e4b;">
                                ${day.workedHoursText}
                              </td>
                              <td style="padding: 8px 14px; text-align: center;">
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9.5px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor2}; border: 1px solid ${badgeBorder};">
                                  ${day.statusLabel}
                                </span>
                              </td>
                            </tr>
                          `;
    }).join("")}
                      </tbody>
                    </table>

                  </div>
                `;
  }).join("")}

            </td>
          </tr>

          <!-- PIED DE PAGE OFFICIEL -->
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #e4e4e7; padding: 24px 30px; text-align: center; font-size: 11px; color: #71717a;">
              <div style="font-weight: 700; color: #3f3f46; font-size: 12px; margin-bottom: 4px;">
                Citrine Mobilit\xE9 \u2014 Douala, Cameroun
              </div>
              <div>
                G\xE9n\xE9r\xE9 automatiquement par le Syst\xE8me Int\xE9gr\xE9 RH &amp; Pointage le ${data.generatedAtStr}
              </div>
              <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px;">
                Notification interne confidentielle \u2022 Strictement r\xE9serv\xE9e aux collaborateurs et \xE0 la direction
              </div>
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
async function sendWeeklyConsolidatedReport(options) {
  try {
    const reportData = await compileWeeklyAttendanceData(options);
    const htmlContent = buildWeeklyConsolidatedEmailHtml(reportData);
    const config = await getEffectiveSmtpConfig();
    const employees = await getCollectionData("employees");
    const users = await getCollectionData("users");
    let recipients = [];
    if (options?.testRecipient) {
      recipients = parseEmailList(options.testRecipient);
    } else {
      const admins = users.filter((u) => u.role_id === 1 || u.role === "administrateur" || String(u.raw_data?.role).toLowerCase().includes("admin"));
      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      recipients = Array.from(/* @__PURE__ */ new Set([...adminEmails, ...parseEmailList(config.hrEmail)]));
    }
    if (recipients.length === 0) {
      if (process.env.SMTP_USER) recipients.push(process.env.SMTP_USER);
      else recipients.push("citrinemobilite@gmail.com");
    }
    const activeEmployees = employees.filter((e) => {
      const status = String(e.status || "").toLowerCase();
      const isActive = status !== "archived" && status !== "inactif" && status !== "inactive" && Boolean(e.email);
      return isActive && !isStrictSuperAdminAccount(e, users);
    });
    const ccEmails = activeEmployees.map((e) => (e.email || "").trim()).filter((mail) => mail && mail.includes("@"));
    console.log(`\u{1F4E7} [RAPPORT HEBDO PR\xC9SENCES] Pr\xE9paration envoi : To: ${recipients.join(", ")} | CC: ${ccEmails.length} collaborateurs.`);
    const sendRes = await sendConsolidatedReportEmail({
      subject: reportData.title,
      title: reportData.title,
      htmlContent,
      recipientEmails: recipients,
      ccEmails
    });
    if (!sendRes.success) {
      return {
        success: false,
        message: sendRes.error || "\xC9chec de l'envoi de l'e-mail du rapport hebdomadaire.",
        error: sendRes.error,
        details: sendRes.details
      };
    }
    return {
      success: true,
      message: `Rapport hebdomadaire des pr\xE9sences envoy\xE9 avec succ\xE8s aux responsables, et mis en copie \xE0 ${ccEmails.length} collaborateurs.`,
      recipients: sendRes.recipients,
      ccCount: ccEmails.length,
      ccRecipients: sendRes.ccRecipients,
      reportData
    };
  } catch (err) {
    const rawError = err?.message || String(err);
    console.error(`\u{1F4A5} [sendWeeklyConsolidatedReport EXCEPTION]:`, err);
    return {
      success: false,
      message: `Erreur inattendue lors de la g\xE9n\xE9ration du rapport : ${rawError}`,
      error: rawError,
      details: err
    };
  }
}

// src/services/timesheetReportService.ts
import * as XLSX from "xlsx";
function getDoualaDateInfo(date = /* @__PURE__ */ new Date()) {
  const fullFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Douala",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const dateOnlyFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Douala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const timeOnlyFormatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Douala",
    hour: "2-digit",
    minute: "2-digit"
  });
  const parts = fullFormatter.format(date);
  const dateOnly = dateOnlyFormatter.format(date);
  const timeOnly = timeOnlyFormatter.format(date);
  const isoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const dayIso = isoFormatter.format(date);
  return {
    dateOnly,
    timeOnly,
    fullDateStr: `${parts} (Heure locale Douala, Cameroun)`,
    dayIso
  };
}
function preparePlanDuJourData(data) {
  const dept = (data.department || "Direction G\xE9n\xE9rale").toUpperCase();
  const dateText = data.dateStr || (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR");
  const locationText = data.location || "Douala";
  const dayText = data.dayName || dateText;
  let topPriorities = data.topPriorities || [];
  if (topPriorities.length === 0) {
    const uniqueParents = [];
    data.items.forEach((item) => {
      const p = item.taskTitle || item.subTitle;
      if (p && !uniqueParents.includes(p)) {
        uniqueParents.push(p);
      }
    });
    topPriorities = uniqueParents.slice(0, 3).map((p, idx) => ({
      id: `prio-${idx + 1}`,
      title: p,
      priority: idx === 0 ? "P1" : idx === 1 ? "P2" : "P3",
      status: data.items.filter((i) => i.taskTitle === p).every((i) => i.status === "completed") ? "Fait" : "En cours",
      isMilestone: false
    }));
    if (topPriorities.length === 0) {
      topPriorities = [
        { title: "Prise de contact & coordination op\xE9rationnelle", priority: "P1", status: "Fait" },
        { title: "Traitement des sous-t\xE2ches prioritaires", priority: "P2", status: "En cours" },
        { title: "Cl\xF4ture, bilan et transmission de la feuille de temps", priority: "P3", status: "En cours" }
      ];
    }
  }
  const tasks = data.items.map((item, idx) => {
    const isDone = item.status === "completed" || item.status === "fait" || item.status === "done" || item.completed === true || item.statusLabel?.includes("TERM");
    const isInProgress = item.status === "in_progress" || item.status === "en_cours" || item.statusLabel?.includes("COURS");
    const isBlocked = item.status === "blocked" || item.isBlocked;
    const statusText = isDone ? "Fait" : isBlocked ? "Bloqu\xE9" : isInProgress ? "En cours" : "\xC0 faire";
    let prioLabel = "P2";
    if (idx === 0) prioLabel = "P1";
    else if (idx >= 3) prioLabel = "P3";
    return {
      title: item.subTitle || item.taskTitle,
      parentTaskTitle: item.taskTitle || item.subTitle || "Mission Op\xE9rationnelle",
      domain: item.taskTitle || "G\xE9n\xE9ral",
      priorityLabel: prioLabel,
      estimatedMinutes: Math.round((item.estimatedHours || 1.5) * 60),
      dueDate: dateText,
      status: statusText,
      isDone,
      isBlocked
    };
  });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isDone).length;
  const inProgressTasks = tasks.filter((t) => t.status === "En cours").length;
  const todoTasks = tasks.filter((t) => t.status === "\xC0 faire").length;
  const blockedTasks = tasks.filter((t) => t.isBlocked).length;
  const ratePercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const taskInProgressRate = totalTasks > 0 ? Math.round(inProgressTasks / totalTasks * 100) : 0;
  const taskTodoRate = totalTasks > 0 ? Math.round(todoTasks / totalTasks * 100) : 0;
  const taskBlockedRate = totalTasks > 0 ? Math.round(blockedTasks / totalTasks * 100) : 0;
  const postponedCount = Math.max(0, totalTasks - completedTasks);
  const prioritiesTotal = topPriorities.length;
  const prioritiesCompleted = topPriorities.filter((p) => p.status === "Fait" || p.status === "completed").length;
  const prioritiesInProgress = topPriorities.filter((p) => p.status === "En cours" || p.status === "in_progress").length;
  const prioritiesRate = prioritiesTotal > 0 ? Math.round(prioritiesCompleted / prioritiesTotal * 100) : 0;
  const prioritiesEngagementRate = prioritiesTotal > 0 ? Math.round((prioritiesCompleted + prioritiesInProgress) / prioritiesTotal * 100) : 0;
  const officialDailyNetHours = 8;
  const plannedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const activeMilestone = topPriorities.find((p) => p.isMilestone);
  const hasMilestone = Boolean(activeMilestone);
  const maxRecommendedSubtasks = hasMilestone ? 5 : 8;
  const parsedHoursWorked = data.dailyAttendance?.hoursWorkedText ? parseFloat(data.dailyAttendance.hoursWorkedText.replace("h", ".")) : data.totalActualHours > 0 ? data.totalActualHours : Math.round(plannedMinutes / 60 * 10) / 10;
  const hoursWorkedNumber = isNaN(parsedHoursWorked) ? 8 : parsedHoursWorked;
  const hoursRate = Math.min(100, Math.round(hoursWorkedNumber / officialDailyNetHours * 100));
  let capacityStatus = "optimal";
  let capacityAdvice = "";
  if (plannedMinutes > 600) {
    capacityStatus = "overloaded";
    capacityAdvice = `\u26A0\uFE0F Surcharge d\xE9tect\xE9e : ${Math.round(plannedMinutes / 60)}h planifi\xE9es sur les sous-t\xE2ches (d\xE9passement du seuil de 10h/jour, capacit\xE9 max 12h). Risque d'inach\xE8vement : priorisez ou reportez certaines sous-t\xE2ches.`;
  } else if (plannedMinutes >= 420) {
    capacityStatus = "optimal";
    capacityAdvice = `\u2705 Charge nominale et r\xE9aliste : ${Math.round(plannedMinutes / 60)}h estim\xE9es sur les sous-t\xE2ches (dans la plage recommand\xE9e de 7h \xE0 10h, max 12h/jour).`;
  } else {
    capacityStatus = "available";
    capacityAdvice = `\u{1F4A1} Capacit\xE9 disponible : ${Math.round(plannedMinutes / 60)}h planifi\xE9es sur les sous-t\xE2ches (capacit\xE9 max : 12h). Vous pouvez traiter des sous-t\xE2ches suppl\xE9mentaires.`;
  }
  let scheduleSlots = data.scheduleSlots || [];
  if (scheduleSlots.length === 0 || scheduleSlots.some((s) => s.timeRange.includes("13:00 \u2013 14:00"))) {
    const s1 = tasks[0]?.title || topPriorities[0]?.title || "Prise de contact, cadrage & d\xE9marrage";
    const s2 = tasks[1]?.title || topPriorities[1]?.title || "Ex\xE9cution des livrables op\xE9rationnels P1";
    const s3 = tasks[2]?.title || "Reprise & finalisation active des dossiers";
    const s4 = tasks[3]?.title || "Cl\xF4ture op\xE9rationnelle de journ\xE9e, bilan & transmission feuille de temps";
    scheduleSlots = [
      { timeRange: "08:00 \u2013 10:00", activity: s1, resolutionNote: tasks[0]?.isDone ? "Sous-t\xE2che finalis\xE9e avec succ\xE8s" : "Traitement en cours" },
      { timeRange: "10:00 \u2013 12:00", activity: s2, resolutionNote: tasks[1]?.isDone ? "Livrables produits et v\xE9rifi\xE9s" : "Avancement nominal" },
      { timeRange: "12:00 \u2013 13:00", activity: "Pause D\xE9jeuner (12h00 \u2013 13h00)", isBreak: true, isBuffer: false, resolutionNote: "Pause obligatoire 12h\u201313h respect\xE9e" },
      { timeRange: "13:00 \u2013 15:30", activity: s3, resolutionNote: tasks[2]?.isDone ? "Termin\xE9" : "En cours d\u2019ach\xE8vement" },
      { timeRange: "15:30 \u2013 17:00", activity: s4, isBreak: false, isBuffer: false, resolutionNote: "Revue des engagements, cl\xF4ture & envoi feuille de temps" }
    ];
  }
  scheduleSlots = scheduleSlots.map((s) => {
    const isLunchBreak = s.timeRange.startsWith("12:00") && s.timeRange.includes("13:00") || s.isBreak && s.timeRange.includes("12:00");
    if (isLunchBreak) {
      return { ...s, timeRange: "12:00 \u2013 13:00", activity: "Pause D\xE9jeuner (12h00 \u2013 13h00)", isBreak: true, isBuffer: false };
    }
    let cleanActivity = s.activity;
    if (cleanActivity.toLowerCase().includes("tampon") || cleanActivity.toLowerCase().includes("pause")) {
      cleanActivity = cleanActivity.replace(/⚡?\s*tampon\s*imprévus?\s*\/?\s*(pause\s*\(?12h[–-]13h\)?)?/gi, "").replace(/pause.*?\//gi, "").replace(/⚡\s*tampon.*/gi, "").trim();
      if (!cleanActivity) {
        cleanActivity = s.timeRange.includes("15:30") ? "Cl\xF4ture op\xE9rationnelle de journ\xE9e, bilan & transmission feuille de temps" : "Traitement des sous-t\xE2ches prioritaires";
      }
    }
    return { ...s, activity: cleanActivity, isBreak: false, isBuffer: false };
  });
  const presenceIncidents = [];
  if (Array.isArray(data.presenceIncidents)) {
    presenceIncidents.push(...data.presenceIncidents);
  }
  if (Array.isArray(data.dailyAttendance?.incidents)) {
    data.dailyAttendance.incidents.forEach((inc) => {
      if (!presenceIncidents.some((p) => p.time === inc.time && p.description === inc.description)) {
        presenceIncidents.push(inc);
      }
    });
  }
  if (data.dailyAttendance?.statusType === "late") {
    const alreadyHasRetard = presenceIncidents.some((p) => p.type === "retard");
    if (!alreadyHasRetard) {
      presenceIncidents.push({
        time: data.dailyAttendance.arrivalTime || "Matin",
        type: "retard",
        label: "Retard \xE0 l'arriv\xE9e",
        description: `Arriv\xE9e constat\xE9e \xE0 ${data.dailyAttendance.arrivalTime || "retard"} (au lieu de 08h00)${data.dailyAttendance.incidentNote ? ` \u2014 ${data.dailyAttendance.incidentNote}` : ""}`,
        isJustified: false
      });
    }
  }
  if (data.dailyAttendance?.incidentNote) {
    const note = data.dailyAttendance.incidentNote;
    const alreadyConsigned = presenceIncidents.some((p) => p.description.includes(note));
    if (!alreadyConsigned) {
      presenceIncidents.push({
        time: data.dailyAttendance.arrivalTime || "Journ\xE9e",
        type: "autre",
        label: "Incident de pr\xE9sence",
        description: note,
        isJustified: false
      });
    }
  }
  const unforeseenEvents = data.blockers.map((b) => ({
    time: b.time || "Journ\xE9e",
    subject: b.reason,
    sourceTask: b.sourceTask || "",
    status: b.status || "Bloqu\xE9",
    lostMinutes: 30
  }));
  const totalLostMinutes = unforeseenEvents.reduce((acc, u) => acc + (u.lostMinutes || 0), 0);
  const availabilityRate = Math.max(0, Math.min(100, Math.round((480 - totalLostMinutes) / 480 * 100)));
  const isLateToday = data.dailyAttendance?.statusType === "late" || presenceIncidents.some((p) => p.type === "retard");
  const punctualityRate = isLateToday ? 75 : data.dailyAttendance?.arrivalTime ? 100 : 0;
  let postponedTasks = data.postponedTasks || [];
  if (postponedTasks.length === 0) {
    postponedTasks = tasks.filter((t) => !t.isDone).map((t) => t.title);
  }
  const managerAlertPoint = data.managerPoints.length > 0 ? data.managerPoints.map((p) => p.content).join(" ; ") : "Aucun point \xE0 signaler ni bloquage aujourd\u2019hui.";
  return {
    dept,
    dateText,
    locationText,
    dayText,
    topPriorities,
    prioritiesTotal,
    prioritiesCompleted,
    prioritiesInProgress,
    prioritiesRate,
    prioritiesEngagementRate,
    tasks,
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    blockedTasks,
    ratePercentage,
    taskInProgressRate,
    taskTodoRate,
    taskBlockedRate,
    postponedCount,
    officialDailyNetHours,
    hoursWorkedNumber,
    hoursRate,
    plannedMinutes,
    hasMilestone,
    milestoneTitle: activeMilestone?.title,
    maxRecommendedSubtasks,
    capacityStatus,
    capacityAdvice,
    scheduleSlots,
    presenceIncidents,
    unforeseenEvents,
    totalLostMinutes,
    availabilityRate,
    punctualityRate,
    isLateToday,
    postponedTasks,
    managerAlertPoint,
    managerPoints: data.managerPoints
  };
}
function buildTimesheetHtmlReport(data) {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || "Collaborateur";
  const capacityBg = p.capacityStatus === "overloaded" ? "#fff1f2" : p.capacityStatus === "optimal" ? "#ecfdf5" : "#f0fdfa";
  const capacityBorder = p.capacityStatus === "overloaded" ? "#fecdd3" : p.capacityStatus === "optimal" ? "#a7f3d0" : "#99f6e4";
  const capacityColor = p.capacityStatus === "overloaded" ? "#9f1239" : p.capacityStatus === "optimal" ? "#064e3b" : "#115e59";
  return `
    <div style="font-family: Calibri, 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f5f5f4; padding: 20px 10px; color: #1c1917;">
      <div style="max-width: 780px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #d6d3d1; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); font-size: 12px; color: #1c1917;">
        
        <!-- EN-T\xCATE CITRINE PLAN DU JOUR (IDENTIQUE AU MODAL STATISTIQUES) -->
        <div style="border-bottom: 2px solid #164e4b; padding-bottom: 12px; margin-bottom: 16px;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top;">
                <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; font-style: italic; color: #164e4b; letter-spacing: 0.5px; line-height: 1;">
                  CITRINE
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #164e4b; margin-top: 4px; text-transform: uppercase;">
                  PLAN DU JOUR \u2014 ${p.dept}
                </div>
              </td>
              <td align="right" style="vertical-align: top; font-size: 11px; color: #44403c; line-height: 1.5; font-family: monospace;">
                <div><strong>Collaborateur :</strong> ${employeeName}</div>
                <div><strong>Lieu :</strong> Douala \u2022 <strong>D\xE9partement :</strong> ${p.dept}</div>
                <div><strong>Date :</strong> ${p.dateText} (${p.dayText})</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- \u{1F4CA} TABLEAU DE BORD STATISTIQUE & POURCENTAGES DE PERFORMANCE DU JOUR -->
        <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="font-size: 12px; font-weight: 800; color: #164e4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            \u{1F4CA} STATISTIQUES &amp; POURCENTAGES DE PERFORMANCE DU JOUR
          </div>

          <!-- 4 Cartouches KPI avec pourcentages en gros -->
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 8px 0; margin-bottom: 12px;">
            <tr>
              <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Avancement T\xE2ches</div>
                <div style="font-size: 24px; font-weight: 900; color: #164e4b; margin: 4px 0 2px 0;">${p.ratePercentage}%</div>
                <div style="font-size: 10px; color: #10b981; font-weight: 700;">${p.completedTasks}/${p.totalTasks} sous-t\xE2che(s) faites</div>
              </td>
              <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Priorit\xE9s P1-P3</div>
                <div style="font-size: 24px; font-weight: 900; color: #1d4ed8; margin: 4px 0 2px 0;">${p.prioritiesRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.prioritiesCompleted}/${p.prioritiesTotal} finalis\xE9es (${p.prioritiesEngagementRate}% trait\xE9es)</div>
              </td>
              <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Cadence (08h\u201317h)</div>
                <div style="font-size: 24px; font-weight: 900; color: #0f766e; margin: 4px 0 2px 0;">${p.hoursRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.hoursWorkedNumber}h / 8h nettes contractuelles</div>
              </td>
              <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; width: 25%;">
                <div style="font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase;">Disponibilit\xE9 Nette</div>
                <div style="font-size: 24px; font-weight: 900; color: ${p.totalLostMinutes > 0 ? "#b45309" : "#059669"}; margin: 4px 0 2px 0;">${p.availabilityRate}%</div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">${p.totalLostMinutes > 0 ? `${p.totalLostMinutes} min impr\xE9vus` : "Z\xE9ro blocage"}</div>
              </td>
            </tr>
          </table>

          <!-- Barre de progression visuelle multi-segments -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 6px;">
              <span>R\xE9partition de l'effort op\xE9rationnel : </span>
              <strong style="color: #065f46;">${p.ratePercentage}% Fait</strong> \u2022 
              <strong style="color: #92400e;">${p.taskInProgressRate}% En cours</strong> \u2022 
              <strong style="color: #64748b;">${p.taskTodoRate}% \xC0 faire</strong>
              ${p.taskBlockedRate > 0 ? ` \u2022 <strong style="color: #b91c1c;">${p.taskBlockedRate}% Bloqu\xE9</strong>` : ""}
            </div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; height: 10px; border-radius: 5px; overflow: hidden; background-color: #e2e8f0;">
              <tr>
                ${p.ratePercentage > 0 ? `<td style="width: ${p.ratePercentage}%; background-color: #10b981; height: 10px;"></td>` : ""}
                ${p.taskInProgressRate > 0 ? `<td style="width: ${p.taskInProgressRate}%; background-color: #f59e0b; height: 10px;"></td>` : ""}
                ${p.taskBlockedRate > 0 ? `<td style="width: ${p.taskBlockedRate}%; background-color: #ef4444; height: 10px;"></td>` : ""}
                ${p.taskTodoRate > 0 ? `<td style="width: ${p.taskTodoRate}%; background-color: #cbd5e1; height: 10px;"></td>` : ""}
              </tr>
            </table>
          </div>
        </div>

        <!-- \u{1F3AF} BANNI\xC8RE DE CAPACIT\xC9 JOURNALI\xC8RE CALCUL\xC9E (AVEC JALON OU SANS JALON) -->
        <div style="padding: 12px 14px; border-radius: 12px; border: 1px solid ${capacityBorder}; background-color: ${capacityBg}; margin-bottom: 16px;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <div style="margin-bottom: 4px;">
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background-color: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #1e293b;">
                    Capacit\xE9 Op\xE9rationnelle du Jour
                  </span>
                  ${p.hasMilestone ? `<span style="display: inline-block; margin-left: 6px; font-size: 10px; font-weight: 700; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; border: 1px solid #fde68a;">\u{1F3C6} Jalon Cl\xE9 D\xE9tect\xE9 : ${p.milestoneTitle}</span>` : ""}
                </div>
                <div style="font-size: 12px; font-weight: 700; color: ${capacityColor}; line-height: 1.4;">
                  ${p.capacityAdvice}
                </div>
              </td>
              <td align="right" style="vertical-align: middle; width: 220px; font-size: 11px; background-color: #ffffff; padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; line-height: 1.4; font-family: monospace;">
                <div><strong>Horaires officiels :</strong> 08h00 \u2013 17h00</div>
                <div style="color: ${p.capacityStatus === "overloaded" ? "#dc2626" : "#64748b"}; font-weight: ${p.capacityStatus === "overloaded" ? "800" : "normal"};">
                  Pause obligatoire : 12h00 \u2013 13h00
                </div>
                <div style="font-weight: 800; color: #2A7B76;">${p.totalTasks} sous-t\xE2che(s) (${Math.round(p.plannedMinutes / 60)}h)</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- \u{1F552} R\xC9CAPITULATIF DE PR\xC9SENCE & POINTAGE DU JOUR (DEMAND\xC9 PAR L'UTILISATEUR) -->
        <div style="border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>\u23F1\uFE0F R\xC9CAPITULATIF DE PR\xC9SENCE &amp; POINTAGE DU JOUR (08h00 \u2013 17h00)</td>
                <td align="right" style="font-size: 11px; color: #a7f3d0; font-weight: 600;">
                  Registre Officiel Citrine Pointage
                </td>
              </tr>
            </table>
          </div>
          <div style="padding: 12px 14px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
                  <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Statut du Jour</div>
                  <div style="margin-top: 3px;">
                    ${(() => {
    const st = data.dailyAttendance?.statusType;
    const label = data.dailyAttendance?.statusLabel || (data.dailyAttendance?.arrivalTime ? "Pr\xE9sent" : "Non point\xE9");
    const bg = st === "late" ? "#fef3c7" : st === "mission" ? "#e0e7ff" : st === "leave" ? "#f3e8ff" : data.dailyAttendance?.arrivalTime ? "#d1fae5" : "#fee2e2";
    const col = st === "late" ? "#92400e" : st === "mission" ? "#3730a3" : st === "leave" ? "#6b21a8" : data.dailyAttendance?.arrivalTime ? "#065f46" : "#991b1b";
    const bor = st === "late" ? "#fde68a" : st === "mission" ? "#c7d2fe" : st === "leave" ? "#e9d5ff" : data.dailyAttendance?.arrivalTime ? "#a7f3d0" : "#fecaca";
    return `<span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 800; background-color: ${bg}; color: ${col}; border: 1px solid ${bor};">${label}</span>`;
  })()}
                  </div>
                </td>
                <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
                  <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Arriv\xE9e sur site</div>
                  <div style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 2px;">
                    ${data.dailyAttendance?.arrivalTime || "\u2014"}
                  </div>
                  <div style="font-size: 9.5px; color: #94a3b8; margin-top: 1px;">
                    ${data.dailyAttendance?.location || "Douala"} (D\xE8s 08h00)
                  </div>
                </td>
                <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
                  <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Pause D\xE9jeuner (12h\u201313h)</div>
                  <div style="font-size: 12px; font-weight: 700; color: #475569; font-family: monospace; margin-top: 2px;">
                    ${data.dailyAttendance?.pauseStart && data.dailyAttendance?.pauseEnd ? `${data.dailyAttendance.pauseStart} \u2013 ${data.dailyAttendance.pauseEnd}` : data.dailyAttendance?.pauseStart ? `D\xE8s ${data.dailyAttendance.pauseStart}` : "12:00 \u2013 13:00"}
                  </div>
                  <div style="font-size: 9.5px; color: #166534; margin-top: 1px;">
                    ${data.dailyAttendance?.pauseStart ? "Effectu\xE9e" : "Pause officielle (12h\u201313h)"}
                  </div>
                </td>
                <td style="width: 25%; padding: 4px 6px; vertical-align: top;">
                  <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">D\xE9part / Fin de Journ\xE9e</div>
                  <div style="font-size: 14px; font-weight: 800; color: #164e4b; font-family: monospace; margin-top: 2px;">
                    ${data.dailyAttendance?.departureTime || "En poste (fin 17:00)"}
                  </div>
                  <div style="font-size: 10px; font-weight: 700; color: #0284c7; margin-top: 1px;">
                    \u23F1\uFE0F ${data.dailyAttendance?.hoursWorkedText || `${p.hoursWorkedNumber}h nettes`}
                  </div>
                </td>
              </tr>
            </table>

            ${data.dailyAttendance?.incidentNote ? `
              <div style="margin-top: 10px; padding: 10px 14px; background-color: #fef2f2; border: 1px solid #fca5a5; border-left: 4px solid #dc2626; border-radius: 8px; font-size: 11px; color: #991b1b; font-weight: 700;">
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="width: 22px; font-size: 14px; vertical-align: top;">\u{1F6A8}</td>
                    <td style="vertical-align: middle;">
                      <span style="text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; background-color: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 900; margin-right: 6px;">INCIDENT / ANOMALIE CONSTAT\xC9(E)</span>
                      <span style="color: #7f1d1d; font-weight: 800;">${data.dailyAttendance.incidentNote}</span>
                    </td>
                  </tr>
                </table>
              </div>
            ` : ""}
          </div>
        </div>

        <!-- \u{1F6A8} SIGNALEMENT DES INCIDENTS & ANOMALIES DE PR\xC9SENCE (RETARD, SORTIE, D\xC9PART ANTICIP\xC9...) -->
        <div style="border-radius: 12px; border: 1.5px solid ${p.presenceIncidents.length > 0 ? "#ea580c" : "#86efac"}; overflow: hidden; margin-bottom: 16px; background-color: #ffffff;">
          <div style="background-color: ${p.presenceIncidents.length > 0 ? "#c2410c" : "#15803d"}; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>
                  ${p.presenceIncidents.length > 0 ? "\u26A0\uFE0F" : "\u2705"} SIGNALEMENT DES INCIDENTS DE PR\xC9SENCE &amp; HORAIRES (${p.presenceIncidents.length})
                </td>
                <td align="right" style="font-size: 10px; color: ${p.presenceIncidents.length > 0 ? "#ffedd5" : "#bbf7d0"}; font-weight: 700;">
                  ${p.presenceIncidents.length > 0 ? "Retards, sorties ou \xE9carts constat\xE9s" : "Ponctualit\xE9 et assiduit\xE9 conformes"}
                </td>
              </tr>
            </table>
          </div>
          <div style="padding: 10px 14px; background-color: ${p.presenceIncidents.length > 0 ? "#fff7ed" : "#f0fdf4"};">
            ${p.presenceIncidents.length > 0 ? `
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
                <thead>
                  <tr style="background-color: #fdba74; color: #7c2d12; font-size: 10.5px;">
                    <th style="padding: 6px 10px; text-align: left; width: 85px; font-weight: 800;">Heure</th>
                    <th style="padding: 6px 10px; text-align: left; width: 160px; font-weight: 800;">Type d'incident</th>
                    <th style="padding: 6px 10px; text-align: left; font-weight: 800;">D\xE9tail &amp; Motif constat\xE9</th>
                    <th style="padding: 6px 10px; text-align: center; width: 110px; font-weight: 800;">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${p.presenceIncidents.map((inc) => `
                    <tr style="border-bottom: 1px solid #fed7aa; background-color: #ffffff;">
                      <td style="padding: 8px 10px; font-family: monospace; font-weight: 800; color: #9a3412;">
                        ${inc.time || "Pointage"}
                      </td>
                      <td style="padding: 8px 10px;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: #ffedd5; color: #c2410c; border: 1px solid #f97316;">
                          ${inc.label}
                        </span>
                      </td>
                      <td style="padding: 8px 10px; font-weight: 700; color: #431407;">
                        ${inc.description}
                      </td>
                      <td style="padding: 8px 10px; text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9.5px; font-weight: 800; ${inc.isJustified ? "background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;" : "background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;"}">
                          ${inc.isJustified ? "\u2713 Justifi\xE9" : "\u26A0\uFE0F Non r\xE9gularis\xE9"}
                        </span>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : `
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td style="width: 24px; font-size: 15px; vertical-align: middle;">\u2705</td>
                  <td style="vertical-align: middle; color: #166534; font-weight: 700; font-size: 11.5px;">
                    Aucun incident de pr\xE9sence \xE0 signaler sur cette journ\xE9e : ponctualit\xE9 respect\xE9e (d\xE8s 08h00), pause 12h\u201313h conforme, aucune sortie non justifi\xE9e.
                  </td>
                </tr>
              </table>
            `}
          </div>
        </div>

        <!-- 1. LES 3 PRIORIT\xC9S DU JOUR (LES GRANDES T\xC2CHES / JOB DESCRIPTION) -->
        <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>\u{1F3AF} LES 3 PRIORIT\xC9S DU JOUR \u2014 si je ne fais que \xE7a, la journ\xE9e est r\xE9ussie</td>
                <td align="right" style="font-size: 10px; color: #a7f3d0; font-weight: 600;">Piliers majeurs de la journ\xE9e</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #ffffff;">
            ${p.topPriorities.map((item, idx) => `
              <div style="padding: 10px 12px; ${idx < p.topPriorities.length - 1 ? "border-bottom: 1px solid #e2e8f0;" : ""}">
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="width: 28px; vertical-align: middle; font-weight: 800; color: #a8a29e;">
                      ${idx + 1}.
                    </td>
                    <td style="vertical-align: middle; padding-left: 4px;">
                      <span style="font-weight: 700; font-size: 12.5px; color: #1e40af;">
                        ${item.title}
                      </span>
                      ${item.isMilestone ? '<span style="margin-left: 8px; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a;">\u{1F3C6} Jalon Cl\xE9</span>' : ""}
                    </td>
                    <td align="right" style="vertical-align: middle; width: 140px;">
                      <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-right: 8px; font-family: monospace;">
                        ${item.priority || "P2"}
                      </span>
                      <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; ${item.status === "Fait" ? "background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;" : "background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;"}">
                        ${item.status}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            `).join("")}
            ${p.topPriorities.length === 0 ? `
              <div style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">
                Aucune mission prioritaire d\xE9finie pour aujourd'hui.
              </div>
            ` : ""}
          </div>
        </div>

        <!-- 2. T\xC2CHES DU JOUR (LES SOUS-T\xC2CHES CONCR\xC8TES TRAIT\xC9ES) -->
        <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>\u{1F4CB} T\xC2CHES DU JOUR (Sous-t\xE2ches concr\xE8tes trait\xE9es)</td>
                <td align="right" style="font-size: 11px; color: #a7f3d0; font-weight: 700; font-family: monospace;">
                  ${p.completedTasks}/${p.totalTasks} termin\xE9es (${p.ratePercentage}%)
                </td>
              </tr>
            </table>
          </div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
            <thead>
              <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Sous-T\xE2che</th>
                <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Mission Parente (Job Description)</th>
                <th style="padding: 7px 6px; text-align: center; font-weight: 700; width: 45px;">Prio</th>
                <th style="padding: 7px 8px; text-align: right; font-weight: 700; width: 85px;">Estim\xE9 (min)</th>
                <th style="padding: 7px 8px; text-align: center; font-weight: 700; width: 85px;">\xC9ch\xE9ance</th>
                <th style="padding: 7px 8px; text-align: center; font-weight: 700; width: 85px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${p.tasks.map((t, index) => {
    const prioColor = t.priorityLabel === "P1" ? "#dc2626" : t.priorityLabel === "P2" ? "#2563eb" : "#d97706";
    const statusBadge = t.status === "Fait" ? '<span style="background-color: #d1fae5; color: #065f46; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">Fait</span>' : t.status === "Bloqu\xE9" ? '<span style="background-color: #fee2e2; color: #991b1b; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #fecaca;">Bloqu\xE9</span>' : t.status === "En cours" ? '<span style="background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">En cours</span>' : '<span style="background-color: #f1f5f9; color: #475569; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">\xC0 faire</span>';
    const rowBg = index % 2 === 0 ? "#ffffff" : "#fcfbf9";
    return `
                  <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e7e5e4;">
                    <td style="padding: 8px 10px; color: #1e40af; font-weight: 700;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #3b82f6; margin-right: 6px; vertical-align: middle;"></span>
                      <span style="vertical-align: middle;">${t.title}</span>
                    </td>
                    <td style="padding: 8px 10px; color: #57534e;">
                      ${t.parentTaskTitle}
                    </td>
                    <td style="padding: 8px 6px; text-align: center; font-weight: 800; font-size: 11px; color: ${prioColor};">
                      ${t.priorityLabel}
                    </td>
                    <td style="padding: 8px 8px; text-align: right; color: #1c1917; font-family: monospace; font-weight: 600;">
                      ${t.estimatedMinutes} min
                    </td>
                    <td style="padding: 8px 8px; text-align: center; color: #78716c; font-family: monospace; font-size: 11px;">
                      ${t.dueDate}
                    </td>
                    <td style="padding: 8px 8px; text-align: center;">
                      ${statusBadge}
                    </td>
                  </tr>
                `;
  }).join("")}
              ${p.tasks.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 16px; text-align: center; color: #a8a29e; font-style: italic;">
                    Aucune sous-t\xE2che planifi\xE9e aujourd'hui.
                  </td>
                </tr>
              ` : ""}
            </tbody>
            <tfoot>
              <tr style="background-color: #164e4b; color: #ffffff; font-weight: 800; font-size: 11.5px;">
                <td colspan="2" style="padding: 8px 10px;">Total sous-t\xE2ches / r\xE9alis\xE9es / avancement</td>
                <td style="text-align: center; padding: 8px 6px;">${p.totalTasks}</td>
                <td style="text-align: right; padding: 8px 8px; font-family: monospace;">${p.completedTasks} fait</td>
                <td style="text-align: center; padding: 8px 8px; font-family: monospace;">${p.ratePercentage}%</td>
                <td style="text-align: center; padding: 8px 8px; color: #fde68a; font-family: monospace;">${p.postponedCount} \xE0 suivre</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 3. PLAN HORAIRE DYNAMIQUE (HORAIRES 08H00 \u2013 17H00, PAUSE STRICTE 12H\u201313H) -->
        <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>\u{1F552} PLAN HORAIRE (08h00 \u2013 17h00) \u2014 Pause d\xE9jeuner obligatoire 12h00 \u2013 13h00</td>
                <td align="right">
                  <span style="display: inline-block; background-color: rgba(254, 240, 138, 0.4); color: #854d0e; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(254, 240, 138, 0.7); font-family: monospace;">
                    12:00 \u2013 13:00 : Pause D\xE9jeuner
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
            <thead>
              <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                <th style="padding: 7px 10px; text-align: left; width: 140px; font-weight: 700;">Heure</th>
                <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Ce que je fais sur ce cr\xE9neau</th>
              </tr>
            </thead>
            <tbody>
              ${p.scheduleSlots.map((s) => {
    const isLunchBreak = s.isBreak || s.timeRange.startsWith("12:00") && s.timeRange.includes("13:00");
    const rowBg = isLunchBreak ? "#fef9c3" : "#ffffff";
    const timeColor = isLunchBreak ? "#854d0e" : "#1c1917";
    const actColor = isLunchBreak ? "#854d0e" : "#1d4ed8";
    return `
                  <tr style="background-color: ${rowBg}; border-bottom: 1px solid ${isLunchBreak ? "#fde047" : "#e7e5e4"};">
                    <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: ${timeColor}; width: 140px;">
                      ${s.timeRange}
                    </td>
                    <td style="padding: 8px 10px; font-weight: 700; color: ${actColor};">
                      ${isLunchBreak ? "\u{1F37D}\uFE0F Pause D\xE9jeuner Officielle (12h00 \u2013 13h00)" : s.activity}
                    </td>
                  </tr>
                `;
  }).join("")}
            </tbody>
          </table>
        </div>

        <!-- 4. IMPR\xC9VUS SURVENUS AUJOURD'HUI (BLOCAGES OP\xC9RATIONNELS SIGNAL\xC9S) -->
        <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td>\u26A1 IMPR\xC9VUS SURVENUS AUJOURD'HUI (${p.unforeseenEvents.length})</td>
                <td align="right" style="font-size: 10px; color: #a7f3d0; font-weight: 600;">
                  \u2014 issus des blocages signal\xE9s par ${employeeName}
                </td>
              </tr>
            </table>
          </div>
          ${p.unforeseenEvents.length > 0 ? `
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 11.5px;">
              <thead>
                <tr style="background-color: #2A7B76; color: #ffffff; font-size: 11px;">
                  <th style="padding: 7px 10px; text-align: left; width: 90px; font-weight: 700;">Heure</th>
                  <th style="padding: 7px 10px; text-align: left; font-weight: 700;">Origine &amp; Sujet de l'impr\xE9vu (Blocage op\xE9rationnel)</th>
                  <th style="padding: 7px 10px; text-align: center; width: 90px; font-weight: 700;">Statut</th>
                  <th style="padding: 7px 10px; text-align: right; width: 100px; font-weight: 700;">Temps impact</th>
                </tr>
              </thead>
              <tbody>
                ${p.unforeseenEvents.map((u, idx) => `
                  <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fffbeb"}; border-bottom: 1px solid #fde68a;">
                    <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #78716c;">
                      ${u.time}
                    </td>
                    <td style="padding: 8px 10px; color: #1c1917;">
                      <div style="font-weight: 700; color: #1c1917;">${u.subject}</div>
                      ${u.sourceTask ? `<div style="font-size: 10.5px; color: #78716c; margin-top: 2px;">T\xE2che source : <strong style="color: #44403c;">${u.sourceTask}</strong></div>` : ""}
                    </td>
                    <td style="padding: 8px 10px; text-align: center;">
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; ${u.status === "R\xE9solu" ? "background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;" : "background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;"}">
                        ${u.status || "Bloqu\xE9"}
                      </span>
                    </td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 800; color: #dc2626;">
                      ${u.lostMinutes} min
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : `
            <div style="background-color: #ecfdf5; padding: 12px 16px; color: #065f46; font-size: 11.5px; font-weight: 600;">
              \u2713 Aucun blocage ni impr\xE9vu op\xE9rationnel signal\xE9 par le collaborateur sur cette journ\xE9e.
            </div>
          `}
        </div>

        <!-- 5. BILAN FIN DE JOURN\xC9E (2 MIN) -->
        <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #164e4b; color: #ffffff; padding: 8px 12px; font-weight: 800; font-size: 12px;">
            \u2611\uFE0F BILAN FIN DE JOURN\xC9E (2 min)
          </div>
          <div style="background-color: #ffffff; padding: 14px 16px;">
            
            <!-- \xC0 reporter \xE0 demain -->
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 800; font-size: 11.5px; color: #44403c; margin-bottom: 4px;">
                \xC0 reporter \xE0 demain :
              </div>
              <div style="font-size: 11.5px;">
                ${p.postponedTasks.length > 0 ? `
                  <ul style="margin: 0; padding-left: 18px; color: #1e40af; font-weight: 600; line-height: 1.5;">
                    ${p.postponedTasks.map((t) => `<li>${t}</li>`).join("")}
                  </ul>
                ` : `
                  <span style="color: #059669; font-weight: 700;">
                    \u2713 Toutes les sous-t\xE2ches du jour ont \xE9t\xE9 cl\xF4tur\xE9es avec succ\xE8s !
                  </span>
                `}
              </div>
            </div>

            <!-- Points \xE0 signaler au manager & direction -->
            <div style="border-top: 1px solid #e7e5e4; padding-top: 10px;">
              <div style="font-weight: 800; font-size: 11.5px; color: #1e293b; margin-bottom: 4px;">
                \u{1F6A9} Points \xE0 Signaler au Manager &amp; Direction :
              </div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #334155; line-height: 1.5;">
                ${p.managerAlertPoint}
              </div>
            </div>

          </div>
        </div>

        <!-- PI\xC8CE JOINTE MENTION -->
        <div style="text-align: center; margin-top: 14px; font-size: 10.5px; color: #78716c;">
          \u{1F4CE} <em>Le classeur officiel Microsoft Excel (.xlsx) complet est joint \xE0 ce fil de discussion pour exploitation tabulaire.</em>
        </div>

      </div>
    </div>
  `;
}
function buildTimesheetXlsxWorkbook(data) {
  const p = preparePlanDuJourData(data);
  const employeeName = data.employeeName || "Collaborateur";
  const rowsFeuil1 = [
    // Ligne 1 & 2 : En-tête Citrine
    ["CITRINE"],
    [`PLAN DU JOUR \u2014 ${p.dept}`],
    [],
    // Statistiques & pourcentages clés du jour
    ["\u{1F4CA} STATISTIQUES DU JOUR", `Avancement : ${p.ratePercentage}%`, `Priorit\xE9s P1-P3 : ${p.prioritiesRate}%`, `Cadence (08h\u201317h) : ${p.hoursRate}%`, `Disponibilit\xE9 : ${p.availabilityRate}%`],
    [],
    // Ligne 5 : Date & Lieu (Col A, B, C, F)
    [`Date : ${p.dateText}`, p.locationText || "Douala", `Jour : ${p.dayText}`, "", "", p.dateText],
    [],
    // Ligne 7 : Les 3 priorités du jour
    ["\u{1F3AF} LES 3 PRIORIT\xC9S DU JOUR \u2014 si je ne fais que \xE7a, la journ\xE9e est r\xE9ussie"],
    ["1.", p.topPriorities[0]?.title || "Prise de contact & revue des priorit\xE9s"],
    ["2.", p.topPriorities[1]?.title || "Ex\xE9cution des actions op\xE9rationnelles majeures"],
    ["3.", p.topPriorities[2]?.title || "Finalisation des livrables et synchronisation"],
    // Ligne 11 : Tâches du jour (sous-tâches concrètes)
    ["\u{1F4CB} T\xC2CHES DU JOUR"],
    ["T\xE2che", "Domaine", "Prio", "Estim\xE9 (min)", "\xC9ch\xE9ance", "Statut"],
    [],
    // Lignes de sous-tâches
    ...p.tasks.map((t) => [
      t.title,
      t.parentTaskTitle || "Autre",
      t.priorityLabel || "P2",
      t.estimatedMinutes,
      t.dueDate || p.dateText,
      t.status
    ]),
    // Ligne de récapitulatif
    ["Total / r\xE9alis\xE9es / taux", "", p.totalTasks, p.completedTasks, `${p.ratePercentage}%`, `${p.postponedCount} report.`],
    [],
    // Plan horaire dynamique (08h00 – 17h00) avec pause officielle 12h–13h
    ["\u{1F552} PLAN HORAIRE (08:00 \u2013 17:00) \u2014 Pause d\xE9jeuner officielle 12h00 \u2013 13h00"],
    ["Heure", "Ce que je fais sur ce cr\xE9neau"],
    ...p.scheduleSlots.map((s) => {
      const isLunchBreak = s.isBreak || s.timeRange.startsWith("12:00") && s.timeRange.includes("13:00");
      return [
        s.timeRange,
        isLunchBreak ? "\u{1F37D}\uFE0F Pause D\xE9jeuner Officielle (12h00 \u2013 13h00)" : s.activity
      ];
    }),
    [],
    // Signalement des incidents de présence (Retards, Sorties...)
    ["\u{1F6A8} INCIDENTS & ANOMALIES DE PR\xC9SENCE DU JOUR (Retards, Sorties...)"],
    ["Heure", "Type incident", "D\xE9tails & Motif constat\xE9", "Statut r\xE9gularisation"],
    ...p.presenceIncidents.length > 0 ? p.presenceIncidents.map((inc) => [
      inc.time || "Pointage",
      inc.label,
      inc.description,
      inc.isJustified ? "Justifi\xE9" : "Non r\xE9gularis\xE9"
    ]) : [["Journ\xE9e", "Aucun incident", "Ponctualit\xE9 respect\xE9e d\xE8s 08h00, pause 12h\u201313h conforme, aucune sortie non justifi\xE9e", "Normal"]],
    [],
    // Imprévus survenus aujourd'hui
    ["\u26A1 BLOCAGES & IMPR\xC9VUS OP\xC9RATIONNELS SIGNAL\xC9S"],
    ["Heure", "Quoi ? (qui / quel sujet)", "Temps perdu (min)"],
    ...p.unforeseenEvents.length > 0 ? p.unforeseenEvents.map((u) => [u.time, u.subject, `${u.lostMinutes} min`]) : [["Journ\xE9e", "Aucun impr\xE9vu signal\xE9 aujourd'hui.", "0 min"]],
    [],
    // Bilan fin de journée (2 min)
    ["\u2611\uFE0F BILAN FIN DE JOURN\xC9E (2 min)"],
    ["\xC0 reporter \xE0 demain :", p.postponedTasks[0] || (p.postponedTasks.length === 0 ? "\u2713 Toutes les sous-t\xE2ches du jour ont \xE9t\xE9 cl\xF4tur\xE9es !" : "")],
    ...p.postponedTasks.slice(1).map((t) => ["", t]),
    [],
    ["Point \xE0 signaler au manager :", p.managerAlertPoint || "Aucun blocage particulier \xE0 signaler."]
  ];
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(rowsFeuil1);
  ws1["!cols"] = [
    { wch: 34 },
    // Col A (Tâche / 1. / Heure / Titres)
    { wch: 38 },
    // Col B (Domaine / Ce que je fais sur ce créneau)
    { wch: 12 },
    // Col C (Prio / Total)
    { wch: 16 },
    // Col D (Estimé min / Réalisées)
    { wch: 16 },
    // Col E (Échéance / Taux %)
    { wch: 18 }
    // Col F (Statut / 0 report.)
  ];
  const rowsManager = [
    ["CITRINE MOBILIT\xC9 \u2014 SUIVI MANAGER & PILOTAGE OP\xC9RATIONNEL"],
    [`Collaborateur : ${employeeName}`, `D\xE9partement : ${p.dept}`, `Lieu : Douala`, `Date : ${p.dateText} (${p.dayText})`],
    [],
    ["\u{1F4CA} DIAGNOSTIC DE CHARGE & SURCHARGE (CALCUL\xC9 SUR LES SOUS-T\xC2CHES)"],
    ["Temps planifi\xE9 sur les sous-t\xE2ches :", `${Math.round(p.plannedMinutes / 60)}h (${p.plannedMinutes} min)`],
    ["Capacit\xE9 journali\xE8re maximale :", "12h max / jour"],
    ["Seuil d'alerte de surcharge :", "> 10h / jour (600 min)"],
    [
      "Statut capacitaire :",
      p.capacityStatus === "overloaded" ? "\u26A0\uFE0F SURCHARGE D\xC9TECT\xC9E (> 10h/jour)" : p.capacityStatus === "optimal" ? "\u2705 CHARGE NOMINALE & R\xC9ALISTE (7h \xE0 10h)" : "\u{1F4A1} CAPACIT\xC9 DISPONIBLE (< 7h)"
    ],
    ["Conseil op\xE9rationnel :", p.capacityAdvice],
    [],
    ["\u{1F6A9} POINTS \xC0 SIGNALER AU MANAGER & REMONT\xC9ES"],
    ["Synth\xE8se :", p.managerAlertPoint || "Aucun blocage particulier \xE0 signaler."],
    [],
    [`\u26A1 BLOCAGES & DIFFICULT\xC9S SIGNAL\xC9S (${p.unforeseenEvents.length})`],
    ["Heure", "Sujet du blocage", "T\xE2che source", "Statut", "Impact"],
    ...p.unforeseenEvents.length > 0 ? p.unforeseenEvents.map((u) => [u.time, u.subject, u.sourceTask || "G\xE9n\xE9ral", u.status || "Bloqu\xE9", `${u.lostMinutes} min`]) : [["Journ\xE9e", "Aucun blocage op\xE9rationnel actif.", "-", "Nominal", "0 min"]]
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(rowsManager);
  ws2["!cols"] = [
    { wch: 36 },
    { wch: 42 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Feuil1");
  XLSX.utils.book_append_sheet(wb, ws2, "Suivi manager");
  return wb;
}
function buildTimesheetExcelBuffer(data) {
  const wb = buildTimesheetXlsxWorkbook(data);
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
}

// src/utils/timesheetTaskEligibility.ts
function getCompletionDate(item, fallbackParentDate) {
  const isDone = item.status === "completed" || item.completed === true || item.status === "fait";
  if (!isDone) return null;
  if (item.completedAt && typeof item.completedAt === "string") {
    const d = item.completedAt.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  const lastUpdated = item.lastUpdatedTime || item.updatedAt || item.updated_at;
  if (lastUpdated && typeof lastUpdated === "string") {
    const d = lastUpdated.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  const itemCreatedAt = item.createdAt;
  if (itemCreatedAt && typeof itemCreatedAt === "string") {
    const d = itemCreatedAt.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  if (item.date && typeof item.date === "string") {
    const d = item.date.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  if (fallbackParentDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackParentDate)) {
    return fallbackParentDate;
  }
  return null;
}
function isTaskEligibleForDayTimesheet(item, targetDate, fallbackParentDate) {
  if (!item || !targetDate) return false;
  const isDone = item.status === "completed" || item.completed === true || item.status === "fait";
  const isInProgress = item.status === "in_progress" || item.status === "en_cours";
  const isBlocked = item.status === "blocked" || item.isBlocked === true;
  if (isDone) {
    const completionDate = getCompletionDate(item, fallbackParentDate);
    if (completionDate && completionDate < targetDate) {
      return false;
    }
    if (completionDate && completionDate === targetDate) {
      return true;
    }
    if (item.date === targetDate || fallbackParentDate === targetDate) {
      return true;
    }
    return false;
  }
  if (isInProgress) {
    const start = item.startDate || item.date || item.createdAt?.split("T")[0];
    if (start && start > targetDate) {
      return false;
    }
    return true;
  }
  if (isBlocked) {
    return true;
  }
  const itemDate = item.date || item.startDate || item.dueDate;
  if (itemDate === targetDate) {
    return true;
  }
  return false;
}
function getItemTimesheetStatus(item, targetDate, fallbackParentDate) {
  if (!isTaskEligibleForDayTimesheet(item, targetDate, fallbackParentDate)) {
    return null;
  }
  const isDone = item.status === "completed" || item.completed === true || item.status === "fait";
  if (isDone) return "Fait";
  if (item.status === "in_progress" || item.status === "en_cours") return "En cours";
  if (item.status === "blocked" || item.isBlocked === true) return "Bloqu\xE9";
  return "\xC0 faire";
}

// src/services/dailyTimesheetCronService.ts
async function executeDailyTimesheetDispatch(options) {
  const sentEmployees = [];
  const errors = [];
  const doualaTime = getDoualaDateInfo();
  const now = /* @__PURE__ */ new Date();
  const weekdayName = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Douala", weekday: "long" }).format(now).toLowerCase();
  const isWeekend = weekdayName === "saturday" || weekdayName === "sunday";
  if (isWeekend && !options?.forceWeekday) {
    const msg = `\u23F8\uFE0F [CRON FEUILLES DE TEMPS] Ignor\xE9 aujourd'hui (${weekdayName}) : les feuilles de temps sont strictement programm\xE9es du lundi au vendredi.`;
    console.log(msg);
    return {
      success: true,
      message: msg,
      processedCount: 0,
      sentEmployees: [],
      errors: [],
      timestamp: doualaTime.fullDateStr
    };
  }
  console.log(`\u23F0 [CRON FEUILLES DE TEMPS 19:30] D\xE9but d'ex\xE9cution (${doualaTime.fullDateStr})...`);
  try {
    const employees = await getCollectionData("employees");
    const users = await getCollectionData("users");
    const tasks = await getCollectionData("tasks");
    const presences = await getCollectionData("presences");
    const incidents = await getCollectionData("attendance_incidents");
    const companySettingsList = await getCollectionData("company_settings");
    const companySettings = companySettingsList && companySettingsList.length > 0 ? companySettingsList[0] : null;
    let lateThreshold = "08:00";
    if (companySettings) {
      const rawVal = companySettings.lateThresholdTime || companySettings.late_threshold_time || companySettings.workStartTime || companySettings.work_start_time;
      if (typeof rawVal === "string" && rawVal.trim().includes(":")) {
        lateThreshold = rawVal.trim();
      }
    }
    const admins = users.filter((u) => u.role_id === 1 || u.role === "administrateur" || String(u.raw_data?.role).toLowerCase().includes("admin"));
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      if (process.env.HR_NOTIFICATION_EMAIL) adminEmails.push(process.env.HR_NOTIFICATION_EMAIL);
      else if (process.env.SMTP_USER) adminEmails.push(process.env.SMTP_USER);
      else adminEmails.push("citrinemobilite@gmail.com");
    }
    const activeEmployees = employees.filter((emp) => {
      const empName = (emp.name || "").toLowerCase();
      const empEmail = (emp.email || "").toLowerCase();
      const empId = String(emp.id || "");
      const status = String(emp.status || "").toLowerCase();
      if (status === "archived" || status === "inactif" || status === "inactive") return false;
      if (isStrictSuperAdminAccount(emp, users)) return false;
      const hasTasks = tasks.some((t) => {
        const assigned = (t.assignedTo || "").toLowerCase();
        return assigned.includes(empName) || assigned.includes(empEmail) || String(t.employeeId || "") === empId;
      });
      const hasPresence = presences.some((p) => {
        const matchEmp = String(p.employeeId || p.employee_id || "") === empId;
        const pDate = String(p.date || "").split("T")[0];
        return matchEmp && pDate === doualaTime.dayIso;
      });
      return hasTasks || hasPresence;
    });
    console.log(`\u{1F4CB} [CRON 19:30] ${activeEmployees.length} collaborateurs \xE9ligibles identifi\xE9s pour la transmission.`);
    for (const emp of activeEmployees) {
      const empName = emp.name || "Collaborateur";
      const empEmail = emp.email || "";
      const empId = emp.id;
      try {
        const empTasks = tasks.filter((t) => {
          const assigned = (t.assignedTo || "").toLowerCase();
          return assigned.includes(empName.toLowerCase()) || assigned.includes(empEmail.toLowerCase()) || String(t.employeeId || "") === String(empId);
        });
        let itemIndex = 1;
        const items = [];
        const blockers = [];
        const managerPoints = [];
        empTasks.forEach((t) => {
          if (t.incidents && Array.isArray(t.incidents) && t.incidents.length > 0) {
            t.incidents.forEach((inc) => {
              blockers.push({
                sourceTask: t.title,
                reason: inc.title || inc.description || "Incident signal\xE9",
                status: inc.resolved ? "R\xE9solu" : "Bloqu\xE9"
              });
            });
          } else if (t.status === "blocked") {
            blockers.push({
              sourceTask: t.title,
              reason: "T\xE2che d\xE9clar\xE9e bloqu\xE9e",
              status: "Bloqu\xE9"
            });
          }
          if (t.comment && typeof t.comment === "string" && t.comment.trim()) {
            managerPoints.push({
              sourceTask: t.title,
              content: t.comment.trim(),
              author: empName
            });
          }
          if (Array.isArray(t.comments) && t.comments.length > 0) {
            t.comments.forEach((c) => {
              managerPoints.push({
                sourceTask: t.title,
                content: c.text || c.content || "",
                author: c.author || empName,
                time: c.timestamp || ""
              });
            });
          }
          if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
            t.subtasks.forEach((sub) => {
              const statusLabel = getItemTimesheetStatus(sub, doualaTime.dayIso, t.date);
              if (!statusLabel) return;
              const isBlocked = sub.status === "blocked" || sub.isBlocked || Boolean(sub.blockerReason);
              items.push({
                index: itemIndex++,
                taskTitle: t.title,
                subTitle: sub.title,
                status: statusLabel === "Fait" ? "completed" : statusLabel === "En cours" ? "in_progress" : statusLabel === "Bloqu\xE9" ? "blocked" : "todo",
                statusLabel,
                estimatedHours: Number(sub.estimatedHours) || 0,
                actualHours: Number(sub.actualHours) || 0,
                blockerReason: sub.blockerReason,
                isBlocked
              });
              if (isBlocked) {
                blockers.push({
                  sourceTask: `${sub.title} (sur "${t.title}")`,
                  reason: sub.blockerReason || "Difficult\xE9 op\xE9rationnelle signal\xE9e",
                  status: "Bloqu\xE9"
                });
              }
              if (Array.isArray(sub.comments)) {
                sub.comments.forEach((c) => {
                  managerPoints.push({
                    sourceTask: `${sub.title} (sur "${t.title}")`,
                    content: c.text || c.content || "",
                    author: c.author || empName,
                    time: c.timestamp || ""
                  });
                });
              }
            });
          } else {
            const statusLabel = getItemTimesheetStatus(t, doualaTime.dayIso);
            if (statusLabel) {
              const isBlocked = t.status === "blocked";
              items.push({
                index: itemIndex++,
                taskTitle: t.title,
                subTitle: t.title,
                status: statusLabel === "Fait" ? "completed" : statusLabel === "En cours" ? "in_progress" : statusLabel === "Bloqu\xE9" ? "blocked" : "todo",
                statusLabel,
                estimatedHours: Number(t.estimatedHours) || 1,
                actualHours: Number(t.actualHours) || 0,
                blockerReason: isBlocked ? "T\xE2che bloqu\xE9e" : void 0,
                isBlocked
              });
            }
          }
        });
        const totalEstimated = items.reduce((sum, i) => sum + i.estimatedHours, 0);
        const totalActual = items.reduce((sum, i) => sum + i.actualHours, 0);
        const topPriorities = empTasks.slice(0, 3).map((t, idx) => ({
          id: t.id,
          title: t.title,
          priority: idx === 0 ? "P1" : idx === 1 ? "P2" : "P3",
          status: t.status === "completed" ? "Fait" : t.status === "in_progress" ? "En cours" : "\xC0 faire",
          isMilestone: !!t.isMilestone
        }));
        const postponedTasks = empTasks.filter((t) => t.status !== "completed").map((t) => t.title);
        const userPres = presences.find((p) => {
          const matchEmp = String(p.employeeId || p.employee_id || "") === String(empId);
          const pDate = String(p.date || "").split("T")[0];
          return matchEmp && pDate === doualaTime.dayIso;
        });
        const userIncs = incidents.filter((inc) => {
          const matchEmp = String(inc.employeeId || inc.employee_id || "") === String(empId);
          const incDate = String(inc.date || "").split("T")[0];
          return matchEmp && incDate === doualaTime.dayIso;
        });
        const presenceIncidents = [];
        userIncs.forEach((inc) => {
          let label = "Incident de pr\xE9sence";
          if (inc.type === "retard") label = "Retard \xE0 l'arriv\xE9e";
          else if (inc.type === "sortie_professionnelle" || inc.type === "sortie_prematuree") label = "Sortie en cours de journ\xE9e";
          else if (inc.type === "depart_anticipe") label = "D\xE9part anticip\xE9";
          else if (inc.type === "permission") label = "Permission d'absence";
          else if (inc.type === "pause_anticipee" || inc.type === "rallonge_pause") label = "Anomalie pause";
          else if (inc.type === "absence_injustifiee") label = "Absence non justifi\xE9e";
          presenceIncidents.push({
            time: inc.timeString || "Pointage",
            type: inc.type || "autre",
            label,
            description: inc.reason || inc.description || "Anomalie signal\xE9e",
            isJustified: inc.isJustified || inc.status === "justifie"
          });
        });
        let dailyAttendance = void 0;
        if (userPres) {
          const isLate = userPres.status === "late" || isArrivalAfterThreshold(userPres.arrivalTime, lateThreshold);
          const workedH = userPres.hoursWorked ? `${userPres.hoursWorked}h` : void 0;
          if (isLate && !presenceIncidents.some((p) => p.type === "retard")) {
            presenceIncidents.push({
              time: userPres.arrivalTime || "Matin",
              type: "retard",
              label: "Retard \xE0 l'arriv\xE9e",
              description: `Arriv\xE9e constat\xE9e \xE0 ${userPres.arrivalTime || "retard"} (au lieu de ${lateThreshold})${userPres.correctionReason ? ` \u2014 Motif : ${userPres.correctionReason}` : ""}`,
              isJustified: Boolean(userPres.correctionReason && userPres.correctionReasonStatus === "approved")
            });
          }
          if (userPres.sortieProStart && !presenceIncidents.some((p) => p.type.includes("sortie"))) {
            presenceIncidents.push({
              time: userPres.sortieProStart,
              type: "sortie",
              label: "Sortie temporaire",
              description: `Sortie de ${userPres.sortieProStart} \xE0 ${userPres.sortieProEnd || "en cours"}${userPres.sortieProReason ? ` \u2014 Motif : ${userPres.sortieProReason}` : ""}`,
              isJustified: true
            });
          }
          if (userPres.departureTime && userPres.departureTime < "17:00" && userPres.departureReason && !presenceIncidents.some((p) => p.type.includes("depart"))) {
            presenceIncidents.push({
              time: userPres.departureTime,
              type: "depart_anticipe",
              label: "D\xE9part anticip\xE9",
              description: `D\xE9part enregistr\xE9 \xE0 ${userPres.departureTime} (avant 17h00) \u2014 Motif : ${userPres.departureReason}`,
              isJustified: userPres.departureReasonStatus === "approved"
            });
          }
          dailyAttendance = {
            statusLabel: isLate ? "Retard" : userPres.status === "mission" ? "En mission" : "Pr\xE9sent",
            statusType: isLate ? "late" : userPres.status || "present",
            arrivalTime: userPres.arrivalTime,
            pauseStart: userPres.pauseStart || "12:00",
            pauseEnd: userPres.pauseEnd || "13:00",
            departureTime: userPres.departureTime || "17:00",
            hoursWorkedText: workedH,
            location: userPres.location || "Douala",
            incidentNote: userPres.correctionReason || userPres.adminBadgeReason,
            incidents: presenceIncidents
          };
        } else {
          dailyAttendance = {
            statusLabel: "Non point\xE9",
            statusType: "absent",
            pauseStart: "12:00",
            pauseEnd: "13:00",
            location: "Douala",
            incidents: presenceIncidents
          };
        }
        const timesheetData = {
          employeeName: empName,
          employeeEmail: empEmail,
          employeeId: empId,
          department: emp.department || "Direction G\xE9n\xE9rale",
          dateStr: doualaTime.dateOnly,
          timeStr: doualaTime.timeOnly,
          dailyAttendance,
          presenceIncidents,
          items,
          blockers,
          managerPoints,
          totalEstimatedHours: totalEstimated,
          totalActualHours: totalActual,
          topPriorities,
          postponedTasks
        };
        const htmlContent = buildTimesheetHtmlReport(timesheetData);
        const excelBuffer = buildTimesheetExcelBuffer(timesheetData);
        const safeCollabName = empName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const safeDate = doualaTime.dayIso.replace(/-/g, "_");
        const excelFilename = `feuille_de_temps_${safeCollabName}_${safeDate}.xlsx`;
        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: `Feuille de temps`,
          threadCategory: "timesheet",
          threadSubject: `Feuille de temps - ${empName}`,
          htmlContent,
          recipientEmails: adminEmails,
          attachments: [
            {
              filename: excelFilename,
              content: excelBuffer,
              contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
          ]
        });
        sentEmployees.push(empName);
        console.log(`\u2705 [CRON 19:30] Feuille de temps envoy\xE9e pour ${empName} (${empEmail}).`);
      } catch (empErr) {
        const msg = `Erreur envoi feuille pour ${empName}: ${empErr?.message || String(empErr)}`;
        console.error(`\u274C [CRON 19:30 Error]:`, msg);
        errors.push(msg);
      }
    }
    return {
      success: errors.length === 0,
      message: `Feuilles de temps transmises avec succ\xE8s pour ${sentEmployees.length} collaborateur(s).`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors,
      timestamp: doualaTime.fullDateStr
    };
  } catch (error) {
    const rawError = error?.message || String(error);
    console.error(`\u{1F4A5} [executeDailyTimesheetDispatch Critical Error]:`, error);
    return {
      success: false,
      message: `Erreur critique lors de l'ex\xE9cution du cron : ${rawError}`,
      processedCount: sentEmployees.length,
      sentEmployees,
      errors: [rawError, ...errors],
      timestamp: doualaTime.fullDateStr
    };
  }
}

// src/services/mondayGreetingMailService.ts
import fs from "fs";
import path from "path";
var COOL_MONDAY_QUOTES = [
  "\xAB Nouveau lundi, nouvelles opportunit\xE9s ! On laisse les excuses au week-end et on d\xE9marre en beaut\xE9. \u{1F60E} \xBB",
  "\xAB Le lundi n'est pas ton ennemi, c'est juste le bouton RESET de tes ambitions. Bonne semaine ! \u{1F680} \xBB",
  "\xAB Pas besoin d'\xEAtre parfait d\xE8s lundi. Juste d'\xEAtre pr\xEAt \xE0 donner le meilleur de soi. \u{1F4AA} \xBB",
  "\xAB Un lundi avec le sourire, une \xE9quipe au top et des objectifs en ligne de mire\u2026 \xC7a sent la belle semaine ! \u{1F525} \xBB",
  "\xAB Les grandes choses commencent souvent par un simple lundi. Alors, autant bien commencer ! \u{1F609} \xBB",
  "\xAB Ton caf\xE9 est pr\xEAt, tes id\xE9es aussi ? Alors, il ne manque plus que toi pour faire de cette semaine une r\xE9ussite ! \u2615 \xBB",
  "\xAB On ne cherche pas \xE0 faire des miracles en une journ\xE9e. On avance, on apprend et on fait mieux chaque jour ! \u{1F331} \xBB",
  "\xAB La bonne humeur est contagieuse. Aujourd'hui, soyons tous des porteurs de bonnes nouvelles ! \u{1F601} \xBB",
  "\xAB Nouvelle semaine, m\xEAme \xE9quipe, encore plus d'id\xE9es et toujours cette envie de faire la diff\xE9rence ! \u2728 \xBB",
  "\xAB Petit rappel du lundi : tu es capable de plus que tu ne le penses. Alors, montre \xE0 cette semaine de quoi tu es capable ! \u{1F4A5} \xBB",
  "\xAB Les objectifs ne vont pas s'atteindre tout seuls\u2026 Mais avec une bonne \xE9quipe, \xE7a devient tout de suite plus sympa ! \u{1F91D} \xBB",
  "\xAB On ne contr\xF4le pas toujours le programme de la semaine, mais on peut toujours choisir son \xE9tat d'esprit. \u{1F609} \xBB",
  "\xAB Que cette semaine soit remplie de bonnes id\xE9es, de petites victoires et de grandes raisons de sourire ! \u{1F31F} \xBB",
  "\xAB Pas de pression inutile : on respire, on s'organise et on avance. Chaque chose en son temps ! \u{1F60C} \xBB",
  "\xAB Le meilleur moment pour faire bouger les choses ? Ce lundi. La meilleure \xE9quipe pour le faire ? La n\xF4tre ! \u{1F680} \xBB",
  "\xAB Le lundi est arriv\xE9\u2026 On fait comme si on l'attendait avec impatience ! \u{1F602} \xBB",
  "\xAB Les batteries sont charg\xE9es ? Les objectifs sont pr\xEAts ? Alors, que la semaine commence ! \u26A1 \xBB",
  "\xAB On ne demande pas une semaine parfaite, juste une \xE9quipe qui se serre les coudes et qui avance ensemble. \u2764\uFE0F \xBB",
  "\xAB Objectif de la semaine : faire du bon travail, garder le sourire et ne pas oublier de respirer ! \u{1F605} \xBB",
  "\xAB Une nouvelle semaine, c'est 5 nouvelles occasions de faire la diff\xE9rence. \xC0 nous de jouer ! \u{1F3AF} \xBB"
];
function getWeeklyCoolQuote() {
  const totalQuotes = COOL_MONDAY_QUOTES.length;
  if (totalQuotes === 0) {
    return { quote: "", index: 0 };
  }
  const quoteIndex = Math.floor(Math.random() * totalQuotes);
  return {
    quote: COOL_MONDAY_QUOTES[quoteIndex],
    index: quoteIndex + 1
  };
}
function extractFirstName(fullName) {
  if (!fullName) return "l'\xE9quipe";
  const clean = fullName.trim();
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    return parts.slice(1).join(" ");
  }
  return parts[0] || "l'\xE9quipe";
}
function getHumaansImageAttachment() {
  try {
    const candidatePaths = [
      path.join(process.cwd(), "public", "assets", "humaans_monday.jpg"),
      path.join(process.cwd(), "src", "assets", "humaans_monday.jpg"),
      path.join(process.cwd(), "dist", "assets", "humaans_monday.jpg")
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        return {
          filename: "humaans_monday.jpg",
          content: fileBuf,
          contentType: "image/jpeg",
          cid: "humaans_monday"
        };
      }
    }
  } catch (err) {
    console.warn("[Monday Greeting] Impossible de charger l'image Humaans locale:", err);
  }
  return null;
}
function buildMondayGreetingHtml(options) {
  const firstName = extractFirstName(options.employeeName);
  const doualaTime = getDoualaDateInfo();
  const dateDisplay = options.dateStr || doualaTime.dateOnly;
  const quote = options.quote || getWeeklyCoolQuote().quote;
  const appUrl = options.appUrl || "https://citrine-management.vercel.app";
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon d\xE9but de semaine \u2014 Citrine Mobilit\xE9</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 14px;">
    <tr>
      <td align="center">
        
        <!-- Conteneur Carte Material Design 3 -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- En-t\xEAte Sup\xE9rieur Material You (Gradient Teal & Emerald) -->
          <tr>
            <td style="background: linear-gradient(135deg, #004D40 0%, #00695C 60%, #00897B 100%); padding: 32px 36px 24px 36px; text-align: left; position: relative;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Pill Badge Material 3 -->
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.28); color: #E0F2F1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px;">
                      Bon d\xE9but de semaine
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
                      CITRINE MOBILIT\xC9
                    </div>
                    <div style="font-size: 13px; color: #A7F3D0; font-weight: 500; margin-top: 4px;">
                      Lundi ${dateDisplay} \xB7 Douala, Cameroun
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <!-- Cercle d\xE9coratif Material -->
                    <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.14); border-radius: 50%; text-align: center; line-height: 48px; font-size: 22px;">
                      \u2615
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bloc Illustration Humaans avec Halo Doux -->
          <tr>
            <td align="center" style="padding: 26px 36px 12px 36px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background: radial-gradient(circle, #E0F2F1 0%, #ffffff 70%); border-radius: 24px; padding: 12px; display: inline-block;">
                      <img src="cid:humaans_monday" alt="Personnage Humaans vous souhaitant un bon lundi" width="260" height="260" style="display: block; max-width: 260px; width: 100%; height: auto; border-radius: 18px; box-shadow: 0 8px 24px rgba(0, 105, 92, 0.12); border: 2px solid #ffffff;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Chaleureux Exact & Personnalis\xE9 (Pr\xE9nom \xE0 partir du 2e mot) -->
          <tr>
            <td style="padding: 16px 36px 24px 36px; text-align: left;">
              
              <!-- Salutation avec pr\xE9nom -->
              <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin: 0 0 16px 0; line-height: 1.25;">
                Hello ${firstName} !
              </h1>

              <p style="font-size: 15.5px; color: #1e293b; line-height: 1.6; margin: 0 0 14px 0; font-weight: 600;">
                Un nouveau lundi, une nouvelle semaine et plein de belles choses \xE0 accomplir ! \u{1F60E}
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 14px 0;">
                On esp\xE8re que tu es pr\xEAt(e) \xE0 attaquer cette semaine avec le plein d'\xE9nergie, de motivation et de bonne humeur.
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Que les id\xE9es fusent, que les objectifs avancent et que les petites victoires s'encha\xEEnent ! \u{1F680}
              </p>

              <!-- Banni\xE8re verte de r\xE9ussite Citrine -->
              <div style="background-color: #E0F2F1; border: 1.5px solid #80CBC4; border-radius: 14px; padding: 14px 20px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 15.5px; font-weight: 800; color: #004D40;">
                  On se souhaite une belle semaine de r\xE9ussite chez Citrine Mobilit\xE9 ! \u{1F49A}
                </span>
              </div>

              <!-- Carte Proverbe Cool de la Semaine (Rotation parmi 10 proverbes cools) -->
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #B45309; margin-bottom: 5px;">
                  Il faut garder en tete que:
                </div>
                <div style="font-size: 14px; font-style: italic; color: #78350F; line-height: 1.5; font-weight: 600;">
                  ${quote}
                </div>
              </div>

              <!-- 3 Cl\xE9s Amicales pour la semaine -->
              <div style="margin-bottom: 26px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #004D40; margin-bottom: 12px;">
                  3 petits tips bienveillants pour une semaine au top :
                </div>

                <!-- Cl\xE9 1 : Priorit\xE9s au calme -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">\u{1F3AF}</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">On pose les priorit\xE9s au calme :</strong> Un pas apr\xE8s l'autre ! Commence par les 2 ou 3 dossiers qui comptent le plus, avance \xE0 ton rythme et valide tes \xE9tapes sans stress.
                    </td>
                  </tr>
                </table>

                <!-- Cl\xE9 2 : Entraide & Bonne humeur -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">\u{1F91D}</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">L'esprit d'\xE9quipe avant tout :</strong> Une question, un petit blocage ou une bonne id\xE9e ? N'h\xE9site pas \xE0 \xE9changer, on est toute une \xE9quipe pr\xEAte \xE0 s'\xE9pauler avec le sourire !
                    </td>
                  </tr>
                </table>

                <!-- Cl\xE9 3 : \xC9nergie & Pause sacr\xE9e -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">\u26A1</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">Prends soin de ton \xE9nergie :</strong> On d\xE9marre motiv\xE9s d\xE8s 08h00, et \xE0 midi, pause d\xE9jeuner sacr\xE9e pour recharger les batteries, d\xE9connecter et souffler !
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Bouton d'action Material You vers https://citrine-management.vercel.app -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 16px 0;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #00796B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 28px; box-shadow: 0 4px 14px rgba(0, 121, 107, 0.35); letter-spacing: 0.3px;">
                      \u{1F680} Ouvrir mon espace Citrine
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page Material Design 3 (Subtle Neutral) -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #004D40;">
                CITRINE MOBILIT\xC9 \xB7 DIRECTION DES RESSOURCES HUMAINES
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
async function sendMondayGreetingToAllEmployees(options) {
  const doualaTime = getDoualaDateInfo();
  const errors = [];
  const recipientEmails = [];
  let sentCount = 0;
  const now = /* @__PURE__ */ new Date();
  const weekdayName = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Douala", weekday: "long" }).format(now).toLowerCase();
  const isMonday = weekdayName === "monday";
  if (!isMonday && !options?.forceMonday) {
    const skipMsg = `\u23F8\uFE0F [GREETING LUNDI] Envoi ignor\xE9 : nous sommes ${weekdayName} et le message de bon d\xE9but de semaine est programm\xE9 chaque lundi \xE0 08h00.`;
    console.log(skipMsg);
    return {
      success: true,
      message: skipMsg,
      sentCount: 0,
      recipientEmails: [],
      errors: [],
      timestamp: doualaTime.fullDateStr
    };
  }
  console.log(`\u{1F305} [GREETING LUNDI 08:00] D\xE9marrage de l'envoi du message de bon d\xE9but de semaine (${doualaTime.fullDateStr})...`);
  try {
    const humaansAttachment = getHumaansImageAttachment();
    const attachments = humaansAttachment ? [humaansAttachment] : [];
    const coolQuote = getWeeklyCoolQuote();
    const appUrl = "https://citrine-management.vercel.app";
    if (options?.testRecipient && options.testRecipient.trim()) {
      const targetEmails = parseEmailList(options.testRecipient);
      if (targetEmails.length === 0) {
        return {
          success: false,
          message: "Adresse e-mail destinataire invalide.",
          sentCount: 0,
          recipientEmails: [],
          errors: ["Adresse e-mail destinataire invalide"],
          timestamp: doualaTime.fullDateStr
        };
      }
      const testEmployeeName = "\xC9quipe Citrine";
      const testFirstName = extractFirstName(testEmployeeName);
      const htmlContent = buildMondayGreetingHtml({
        employeeName: testEmployeeName,
        dateStr: doualaTime.dateOnly,
        quote: coolQuote.quote,
        appUrl
      });
      console.log(`\u2709\uFE0F [GREETING LUNDI TEST] Envoi du mail de bonjour vers : ${targetEmails.join(", ")}...`);
      const result = await sendThreadedEmployeeEmail({
        employeeName: testEmployeeName,
        employeeId: "greeting-test",
        eventTitle: "Bon d\xE9but de semaine \u2014 Citrine Mobilit\xE9",
        threadCategory: "greeting",
        threadSubject: `Hello ${testFirstName} ! Bon d\xE9but de semaine chez Citrine Mobilit\xE9`,
        htmlContent,
        attachments,
        overrideRecipients: targetEmails,
        recipientEmails: targetEmails
      });
      if (!result.success) {
        return {
          success: false,
          message: `\xC9chec d'envoi du message de bonjour : ${result.error}`,
          sentCount: 0,
          recipientEmails: targetEmails,
          errors: [result.error || "Erreur inconnue"],
          timestamp: doualaTime.fullDateStr
        };
      }
      return {
        success: true,
        message: `Message de bon d\xE9but de semaine envoy\xE9 avec succ\xE8s \xE0 ${targetEmails.join(", ")}.`,
        sentCount: 1,
        recipientEmails: targetEmails,
        errors: [],
        timestamp: doualaTime.fullDateStr
      };
    }
    const employees = await getCollectionData("employees");
    const activeEmployees = employees.filter((emp) => {
      const status = String(emp.status || emp.employmentStatus || "").toLowerCase();
      if (status === "archived" || status === "inactif" || status === "inactive" || status === "parti") {
        return false;
      }
      return Boolean(emp.email && emp.email.includes("@"));
    });
    if (activeEmployees.length === 0) {
      console.warn("\u26A0\uFE0F [GREETING LUNDI] Aucun collaborateur avec e-mail valide trouv\xE9.");
      return {
        success: true,
        message: "Aucun collaborateur \xE9ligible trouv\xE9.",
        sentCount: 0,
        recipientEmails: [],
        errors: [],
        timestamp: doualaTime.fullDateStr
      };
    }
    console.log(`\u{1F680} [GREETING LUNDI] Envoi personnalis\xE9 \xE0 ${activeEmployees.length} collaborateur(s)...`);
    for (const emp of activeEmployees) {
      const empName = emp.name || "Collaborateur";
      const empEmail = emp.email?.trim();
      const empId = emp.id;
      if (!empEmail) continue;
      const empFirstName = extractFirstName(empName);
      try {
        const htmlContent = buildMondayGreetingHtml({
          employeeName: empName,
          dateStr: doualaTime.dateOnly,
          quote: coolQuote.quote,
          appUrl
        });
        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: "Bon d\xE9but de semaine \u2014 Citrine Mobilit\xE9",
          threadCategory: "greeting",
          threadSubject: `Hello ${empFirstName} ! Bon d\xE9but de semaine chez Citrine Mobilit\xE9`,
          htmlContent,
          attachments,
          overrideRecipients: [empEmail],
          recipientEmails: [empEmail]
        });
        sentCount++;
        recipientEmails.push(empEmail);
        console.log(`\u2713 [GREETING LUNDI] E-mail transmis \xE0 ${empName} (Pr\xE9nom: ${empFirstName}, Email: ${empEmail})`);
      } catch (err) {
        const msg = `Erreur pour ${empName} (${empEmail}) : ${err?.message || err}`;
        console.error(`\u274C [GREETING LUNDI Error]:`, msg);
        errors.push(msg);
      }
    }
    const summaryMsg = `Message de bon d\xE9but de semaine envoy\xE9 avec succ\xE8s \xE0 ${sentCount}/${activeEmployees.length} collaborateurs.`;
    console.log(`\u2705 [GREETING LUNDI 08:00 TERMIN\xC9] ${summaryMsg}`);
    return {
      success: errors.length === 0 || sentCount > 0,
      message: summaryMsg,
      sentCount,
      recipientEmails,
      errors,
      timestamp: doualaTime.fullDateStr
    };
  } catch (globalErr) {
    const rawError = globalErr?.message || String(globalErr);
    console.error("\u{1F4A5} [GREETING LUNDI FATAL ERROR]:", globalErr);
    return {
      success: false,
      message: `Erreur g\xE9n\xE9rale lors de l'envoi du message de bon d\xE9but de semaine : ${rawError}`,
      sentCount,
      recipientEmails,
      errors: [rawError],
      timestamp: doualaTime.fullDateStr
    };
  }
}

// src/server/apiHandler.ts
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
      const result = await sendMondayGreetingToAllEmployees({
        testRecipient: targetRecipients.join(", "),
        forceMonday: true
      });
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
    if (urlPath === "/attendance/weekly-recap" && method === "GET") {
      try {
        const data = await compileWeeklyAttendanceData({
          manual: true,
          forceFriday: req.query?.forceFriday === "true"
        });
        return res.status(200).json({ success: true, report: data });
      } catch (error) {
        console.error("[API /attendance/weekly-recap GET Error]:", error);
        return res.status(500).json({ success: false, error: error.message || "Erreur de compilation du r\xE9capitulatif." });
      }
    }
    if (urlPath === "/attendance/weekly-recap" && method === "POST") {
      try {
        const { forceFriday, testRecipient } = body;
        const result = await sendWeeklyConsolidatedReport({
          manual: true,
          forceFriday: Boolean(forceFriday),
          testRecipient
        });
        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error("[API /attendance/weekly-recap POST Error]:", error);
        return res.status(500).json({ success: false, error: error.message || "\xC9chec de l'envoi du r\xE9capitulatif hebdomadaire." });
      }
    }
    if (urlPath === "/cron/daily-timesheet" || urlPath === "/api/cron/daily-timesheet") {
      try {
        console.log(`\u23F0 [SERVERLESS CRON] D\xE9clenchement de l'envoi automatique des feuilles de temps quotidiennes...`);
        const result = await executeDailyTimesheetDispatch();
        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error("[API /cron/daily-timesheet Error]:", error);
        return res.status(500).json({ success: false, error: error.message || String(error) });
      }
    }
    if (urlPath === "/cron/weekly-recap" || urlPath === "/api/cron/weekly-recap") {
      try {
        console.log(`\u23F0 [SERVERLESS CRON] D\xE9clenchement de l'envoi du r\xE9capitulatif hebdomadaire consolid\xE9...`);
        const result = await sendWeeklyConsolidatedReport({ forceFriday: true });
        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error("[API /cron/weekly-recap Error]:", error);
        return res.status(500).json({ success: false, error: error.message || String(error) });
      }
    }
    if (urlPath === "/cron/monday-greeting" || urlPath === "/api/cron/monday-greeting") {
      try {
        console.log(`\u23F0 [SERVERLESS CRON] D\xE9clenchement message bon d\xE9but de semaine du lundi 08h00...`);
        const forceMonday = req.query?.force === "true" || body?.force === true;
        const testRecipient = req.query?.testRecipient || body?.testRecipient;
        const result = await sendMondayGreetingToAllEmployees({ forceMonday, testRecipient });
        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error("[API /cron/monday-greeting Error]:", error);
        return res.status(500).json({ success: false, error: error.message || String(error) });
      }
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
