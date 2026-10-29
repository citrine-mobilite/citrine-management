import { sendThreadedEmployeeEmail } from "../../src/services/serverMailService.ts";

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Méthode ${req.method} non autorisée sur cet endpoint. Seul POST est accepté.`,
    });
  }

  const startTime = Date.now();
  console.log("================================================================");
  console.log("📨 [VERCEL API /api/mail/send-threaded] Réception requête envoi email...");

  try {
    // Dans l'environnement Vercel Serverless, req.body est déjà parsé par @vercel/node.
    // Si c'est encore une chaîne (ex: raw body), on tente de la désérialiser proprement.
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // conserve body tel quel
      }
    }
    body = body || {};

    const {
      employeeName,
      employeeId,
      eventTitle,
      htmlContent,
      attachments,
      smtpConfig,
      threadCategory,
      threadSubject,
      overrideRecipients,
    } = body;

    console.log("📋 [PAYLOAD INFO]:", {
      employeeName,
      employeeId,
      eventTitle,
      threadCategory,
      threadSubject,
      attachmentsCount: Array.isArray(attachments) ? attachments.length : 0,
      overrideRecipientsCount: Array.isArray(overrideRecipients) ? overrideRecipients.length : 0,
    });

    if (!employeeName || !eventTitle || !htmlContent) {
      const missingFields = [
        !employeeName && "employeeName",
        !eventTitle && "eventTitle",
        !htmlContent && "htmlContent",
      ].filter(Boolean).join(", ");

      const validationError = `Paramètres obligatoires manquants pour l'envoi d'email : ${missingFields}`;
      console.error(`❌ [VERCEL VALIDATION ERROR]: ${validationError}`);
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const result = await sendThreadedEmployeeEmail(
      {
        employeeName,
        employeeId,
        eventTitle,
        threadCategory,
        threadSubject,
        htmlContent,
        attachments,
        overrideRecipients,
      },
      smtpConfig
    );

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ [VERCEL API SUCCÈS en ${duration}ms]:`, {
        messageId: result.messageId,
        recipients: result.recipients,
      });
      return res.status(200).json(result);
    } else {
      console.error(`❌ [VERCEL API ÉCHEC en ${duration}ms]:`, result.error);
      return res.status(500).json(result);
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const rawMessage = error?.message || String(error);
    console.error(`💥 [VERCEL API send-threaded EXCEPTION en ${duration}ms]:`, {
      message: rawMessage,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack,
    });

    return res.status(500).json({
      success: false,
      error: rawMessage,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack,
    });
  }
}
