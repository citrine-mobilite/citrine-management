import { CompanyModuleConfig } from '../types';

export interface SendThreadedEmailInput {
  employeeName: string;
  employeeId?: string | number;
  employeeEmail?: string;
  eventTitle: string;
  threadCategory?: string;
  threadSubject?: string;
  htmlContent: string;
  recipientEmails?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
}

export const clientMailService = {
  /**
   * Envoie une notification par e-mail rattachée au fil unique du collaborateur.
   * Affiche l'exception brute exacte et tous les logs console en production.
   */
  async sendThreadedEmail(
    input: SendThreadedEmailInput,
    moduleConfig?: CompanyModuleConfig
  ): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string; details?: any; status?: number }> {
    console.log("================================================================");
    console.log("🚀 [CLIENT MAIL SERVICE] Démarrage de l'envoi de mail...", {
      employeeName: input.employeeName,
      employeeId: input.employeeId,
      eventTitle: input.eventTitle,
      threadCategory: input.threadCategory,
      threadSubject: input.threadSubject,
      attachmentsCount: input.attachments?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Si les notifications emails sont explicitement désactivées
    if (moduleConfig?.enableEmailNotifications === false) {
      console.warn("⚠️ [CLIENT MAIL SERVICE] Envoi désactivé dans la configuration de l'entreprise (enableEmailNotifications=false).");
      console.log("================================================================");
      return { success: true, simulated: true };
    }

    try {
      console.log("📤 [CLIENT MAIL SERVICE] Exécution requête POST /api/mail/send-threaded...");
      const res = await fetch('/api/mail/send-threaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      console.log(`📥 [CLIENT MAIL SERVICE] Réponse HTTP reçue : Status = ${res.status} (${res.statusText})`);

      const rawText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(rawText);
      } catch {
        // Le corps n'est pas du JSON (ex: HTML 404/500 ou message texte)
      }

      console.log("🔍 [CLIENT MAIL SERVICE] Corps de la réponse brute :", {
        status: res.status,
        statusText: res.statusText,
        isJson: resJson !== null,
        body: resJson || rawText,
      });

      if (!res.ok) {
        // Extraction fidèle de la véritable exception sans masquer son contenu
        const rawException = 
          resJson?.error || 
          resJson?.message || 
          (typeof rawText === 'string' && rawText.trim() ? rawText : `Erreur serveur HTTP ${res.status} (${res.statusText})`);

        console.error("❌ [CLIENT MAIL SERVICE ÉCHEC HTTP] Véritable exception retournée par le serveur :", {
          status: res.status,
          statusText: res.statusText,
          exception: rawException,
          details: resJson?.details,
          stack: resJson?.stack,
        });
        console.log("================================================================");

        return { 
          success: false, 
          error: rawException,
          status: res.status,
          details: resJson,
        };
      }

      if (resJson && resJson.success === false) {
        const rawException = resJson.error || "Échec signalé par le serveur";
        console.error("❌ [CLIENT MAIL SERVICE ÉCHEC INTERNE] Erreur retournée :", rawException);
        console.log("================================================================");
        return {
          success: false,
          error: rawException,
          details: resJson,
        };
      }

      console.log("✅ [CLIENT MAIL SERVICE SUCCÈS] E-mail envoyé avec succès !", resJson);
      console.log("================================================================");
      return resJson || { success: true };
    } catch (err: any) {
      const rawException = err?.message || String(err);
      console.error("💥 [CLIENT MAIL SERVICE EXCEPTION RÉSEAU / FETCH]:", {
        message: rawException,
        stack: err?.stack,
        errorObj: err,
      });
      console.log("================================================================");
      return { 
        success: false, 
        error: `Exception réseau client : ${rawException}`,
        details: err,
      };
    }
  },

  /**
   * Teste la configuration SMTP et renvoie l'exception brute en cas d'erreur
   */
  async testConnection(
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
        body: JSON.stringify({
          smtpConfig,
          testRecipient,
        }),
      });

      const rawText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(rawText);
      } catch {
        // Non-JSON
      }

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
  },

  /**
   * Récupère la configuration SMTP effective depuis le serveur
   */
  async fetchMailConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
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
  },

  /**
   * Sauvegarde la configuration SMTP & RH en base de données sur le serveur
   */
  async saveMailConfig(config: any): Promise<{ success: boolean; config?: any; error?: string }> {
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
  },

  /**
   * Helper pour envoyer une notification de mission professionnelle
   */
  async notifyMissionAssigned(params: {
    employeeName: string;
    employeeEmail?: string;
    employeeId?: string | number;
    destinationOrReason: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    moduleConfig?: CompanyModuleConfig;
  }) {
    const html = `
      <p>Bonjour <strong>${params.employeeName}</strong>,</p>
      <p>Nous vous confirmons votre ordre et affectation en <strong>Mission Professionnelle</strong>.</p>
      
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: bold; width: 40%;">Objet / Motif :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${params.destinationOrReason}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Période :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">Du ${params.startDate} au ${params.endDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Durée totale :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${params.durationDays} jour(s)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Pointage :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #15803d;">Dispense automatique de badge physique accordée</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #44403c;">
        Pendant cette période, votre statut RH est officiellement <strong>En mission</strong>. Aucun pointage au bureau n'est requis et aucune absence ne sera constatée.
      </p>
      <p style="margin-top: 20px; font-weight: 600;">
        Bien cordialement,<br>
        La Direction des Ressources Humaines
      </p>
    `;

    return this.sendThreadedEmail(
      {
        employeeName: params.employeeName,
        employeeId: params.employeeId,
        employeeEmail: params.employeeEmail,
        eventTitle: 'Affectation en Mission Professionnelle',
        htmlContent: html,
      },
      params.moduleConfig
    );
  },

  /**
   * Helper pour envoyer une notification de décision de congé ou permission
   */
  async notifyLeaveDecision(params: {
    employeeName: string;
    employeeEmail?: string;
    employeeId?: string | number;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: 'approved' | 'rejected' | 'modified';
    reason?: string;
    moduleConfig?: CompanyModuleConfig;
  }) {
    const isApproved = params.status === 'approved';
    const statusLabel = isApproved ? 'Approuvée' : params.status === 'rejected' ? 'Refusée' : 'Modifiée';
    const statusColor = isApproved ? '#166534' : params.status === 'rejected' ? '#991b1b' : '#854d0e';
    const bgColor = isApproved ? '#f0fdf4' : params.status === 'rejected' ? '#fef2f2' : '#fefce8';
    const borderColor = isApproved ? '#bbf7d0' : params.status === 'rejected' ? '#fecaca' : '#fef08a';

    const html = `
      <p>Bonjour <strong>${params.employeeName}</strong>,</p>
      <p>Votre demande d'absence / congé a fait l'objet d'un arbitrage par la direction.</p>

      <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #57534e; font-weight: bold; width: 40%;">Type :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1c1917;">${params.leaveType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #57534e; font-weight: bold;">Période :</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1c1917;">Du ${params.startDate} au ${params.endDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #57534e; font-weight: bold;">Décision RH :</td>
            <td style="padding: 6px 0; font-weight: bold; color: ${statusColor};">${statusLabel}</td>
          </tr>
          ${params.reason ? `
          <tr>
            <td style="padding: 6px 0; color: #57534e; font-weight: bold;">Observation :</td>
            <td style="padding: 6px 0; color: #1c1917;">${params.reason}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin-top: 20px; font-weight: 600;">
        Bien cordialement,<br>
        La Direction des Ressources Humaines
      </p>
    `;

    return this.sendThreadedEmail(
      {
        employeeName: params.employeeName,
        employeeId: params.employeeId,
        employeeEmail: params.employeeEmail,
        eventTitle: `Décision Congé / Absence : ${statusLabel}`,
        htmlContent: html,
      },
      params.moduleConfig
    );
  },
};
