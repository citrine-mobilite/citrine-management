import { 
  sendThreadedEmployeeEmail, 
  getEffectiveSmtpConfig, 
  parseEmailList 
} from "../../src/services/serverMailService.ts";

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-citrine-auth");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Méthode ${req.method} non autorisée. Seul POST est accepté.`,
    });
  }

  console.log("🧪 [VERCEL /api/mail/test-connection] Démarrage du test SMTP...");

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }
    body = body || {};

    const { testRecipient, smtpConfig } = body;
    const effective = await getEffectiveSmtpConfig(smtpConfig);

    const targetRecipients = testRecipient && testRecipient.trim()
      ? parseEmailList(testRecipient)
      : parseEmailList(effective.hrEmail);

    if (targetRecipients.length === 0) {
      const noRecipMsg = "Aucun destinataire spécifié et la variable HR_NOTIFICATION_EMAIL n'est pas configurée.";
      console.error("❌ [VERCEL TEST SMTP]:", noRecipMsg);
      return res.status(400).json({
        success: false,
        error: noRecipMsg,
      });
    }

    const result = await sendThreadedEmployeeEmail(
      {
        employeeName: "Test Connexion Citrine",
        employeeId: "citrine-test",
        eventTitle: "Test Connexion SMTP - Citrine Mobilité",
        htmlContent: `<p>Bonjour,</p><p>Ce message confirme que la configuration SMTP de votre application Citrine Mobilité sur Vercel est <strong>100% opérationnelle</strong>.</p><p>Destinataire(s) RH configuré(s) : <code>${targetRecipients.join(", ")}</code></p>`,
        overrideRecipients: targetRecipients,
      },
      smtpConfig
    );

    if (result.success) {
      console.log("✅ [VERCEL TEST SMTP SUCCÈS]:", result);
      return res.status(200).json(result);
    } else {
      console.error("❌ [VERCEL TEST SMTP ÉCHEC]:", result.error);
      return res.status(500).json(result);
    }
  } catch (error: any) {
    console.error("💥 [VERCEL TEST SMTP EXCEPTION]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      code: error?.code,
      response: error?.response,
      stack: error?.stack,
    });
  }
}
