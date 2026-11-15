import { CompanyModuleConfig } from '../types';
import { buildMissionAssignedHtml, buildLeaveDecisionHtml } from './clientMailTemplates';
import {
  testMailConnection,
  fetchServerMailConfig,
  saveServerMailConfig,
} from './clientMailConfigService';

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
   */
  async sendThreadedEmail(
    input: SendThreadedEmailInput,
    moduleConfig?: CompanyModuleConfig
  ): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string; details?: any; status?: number }> {
    if (moduleConfig?.enableEmailNotifications === false) {
      console.warn("⚠️ [CLIENT MAIL SERVICE] Envoi désactivé dans la configuration de l'entreprise (enableEmailNotifications=false).");
      return { success: true, simulated: true };
    }

    try {
      const res = await fetch('/api/mail/send-threaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const rawText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(rawText);
      } catch {}

      if (!res.ok) {
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
        return {
          success: false,
          error: rawException,
          details: resJson,
        };
      }

      return resJson || { success: true };
    } catch (err: any) {
      const rawException = err?.message || String(err);
      console.error("💥 [CLIENT MAIL SERVICE EXCEPTION RÉSEAU / FETCH]:", {
        message: rawException,
        stack: err?.stack,
        errorObj: err,
      });
      return {
        success: false,
        error: `Exception réseau client : ${rawException}`,
        details: err,
      };
    }
  },

  testConnection: testMailConnection,
  fetchMailConfig: fetchServerMailConfig,
  saveMailConfig: saveServerMailConfig,

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
    const html = buildMissionAssignedHtml(params);
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
    const { html, statusLabel } = buildLeaveDecisionHtml(params);
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
