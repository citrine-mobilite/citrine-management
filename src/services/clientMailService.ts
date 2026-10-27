import { CompanyModuleConfig } from '../types';

export interface SendThreadedEmailInput {
  employeeName: string;
  employeeId?: string | number;
  employeeEmail?: string;
  eventTitle: string;
  htmlContent: string;
  recipientEmails?: string[];
}

export const clientMailService = {
  /**
   * Envoie une notification par e-mail rattachée au fil unique du collaborateur.
   * Si les paramètres SMTP sont configurés dans moduleConfig, ils sont transmis.
   * Sinon, le backend utilise les variables d'environnement SMTP.
   */
  async sendThreadedEmail(
    input: SendThreadedEmailInput,
    moduleConfig?: CompanyModuleConfig
  ): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
    // Si les notifications emails sont explicitement désactivées
    if (moduleConfig?.enableEmailNotifications === false) {
      return { success: true, simulated: true };
    }

    try {
      const res = await fetch('/api/mail/send-threaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || 'Erreur lors de l\'envoi du mail' };
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[clientMailService] Notice envoi email:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Teste la configuration SMTP
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
  ): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/mail/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          testRecipient,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || 'Erreur lors du test SMTP' };
      }

      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
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
