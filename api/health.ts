export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: "ok",
    environment: "vercel-serverless",
    timestamp: new Date().toISOString(),
    smtpHostConfigured: Boolean(process.env.SMTP_HOST),
    smtpPort: process.env.SMTP_PORT || "587",
    smtpUserConfigured: Boolean(process.env.SMTP_USER),
    smtpPassConfigured: Boolean(process.env.SMTP_PASS),
    hrEmailConfigured: Boolean(process.env.HR_NOTIFICATION_EMAIL),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL),
  });
}
