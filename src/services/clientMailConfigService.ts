export async function testMailConnection(
  smtpConfig: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  },
  testRecipient?: string
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string; details?: any }> {
  console.log("🧪 [CLIENT MAIL TEST] Début du test de connexion SMTP vers /api/mail/test-connection...", {
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.user,
    hasPass: Boolean(smtpConfig.pass),
    testRecipient,
  });

  try {
    const res = await fetch('/api/mail/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig, testRecipient }),
    });

    const rawText = await res.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(rawText);
    } catch {}

    console.log(`🧪 [CLIENT MAIL TEST RÉPONSE] Status = ${res.status}:`, resJson || rawText);

    if (!res.ok) {
      const rawError = resJson?.error || resJson?.message || rawText || `Erreur HTTP ${res.status} (${res.statusText})`;
      console.error("❌ [CLIENT MAIL TEST ÉCHEC HTTP]:", rawError);
      return { success: false, error: rawError, details: resJson };
    }

    return resJson || { success: true };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    console.error("💥 [CLIENT MAIL TEST EXCEPTION]:", err);
    return { success: false, error: `Exception test SMTP : ${rawError}`, details: err };
  }
}

export async function fetchServerMailConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
  try {
    console.log("🔍 [CLIENT MAIL CONFIG] Chargement configuration SMTP...");
    const res = await fetch('/api/mail/config');
    const rawText = await res.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(rawText);
    } catch {}

    if (!res.ok) {
      const rawError = resJson?.error || rawText || `Erreur HTTP ${res.status}`;
      console.error("❌ [CLIENT MAIL CONFIG FETCH ERROR]:", rawError);
      return { success: false, error: rawError };
    }
    return resJson || { success: true };
  } catch (err: any) {
    console.error("💥 [CLIENT MAIL CONFIG EXCEPTION]:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function saveServerMailConfig(config: any): Promise<{ success: boolean; config?: any; error?: string }> {
  try {
    console.log("💾 [CLIENT MAIL CONFIG] Sauvegarde configuration SMTP...");
    const res = await fetch('/api/mail/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const rawText = await res.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(rawText);
    } catch {}

    if (!res.ok) {
      const rawError = resJson?.error || rawText || `Erreur HTTP ${res.status}`;
      console.error("❌ [CLIENT MAIL CONFIG SAVE ERROR]:", rawError);
      return { success: false, error: rawError };
    }
    return resJson || { success: true };
  } catch (err: any) {
    console.error("💥 [CLIENT MAIL CONFIG SAVE EXCEPTION]:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
