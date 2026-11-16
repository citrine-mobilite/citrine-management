import { DEFAULT_COMPANY_INFO } from '../pdf/pdfCompanyInfo';

/**
 * En-tête officiel de l'entreprise (format compatible Outlook / Gmail, sans image base64 bloquée)
 */
export function buildOfficialEmailCompanyHeaderHtml(
  docTitle: string,
  metaLinesHtml: string
): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-bottom: 3px solid #D4A82F; margin-bottom: 14px;">
      <tr>
        <td class="email-stack" style="vertical-align: top; padding-bottom: 10px;">
          <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 900; color: #164e4b; letter-spacing: 0.6px; line-height: 1.05;">
            ${DEFAULT_COMPANY_INFO.name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px;">
            ${DEFAULT_COMPANY_INFO.subTitle}${DEFAULT_COMPANY_INFO.baseline ? ` — ${DEFAULT_COMPANY_INFO.baseline}` : ''}
          </div>
        </td>
        <td align="right" class="email-stack-left" style="vertical-align: top; padding-bottom: 10px; font-size: 9.5px; color: #64748b; line-height: 1.4;">
          <div style="font-weight: 800; color: #164e4b; letter-spacing: 0.4px;">RÉPUBLIQUE DU CAMEROUN</div>
          <div style="font-weight: 700; color: #92400e;">DOCUMENT OFFICIEL INTERNE</div>
          <div>${DEFAULT_COMPANY_INFO.address}</div>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #164e4b; margin-bottom: 16px;">
      <tr>
        <td class="email-stack" style="padding: 10px 12px; vertical-align: middle;">
          <div style="font-size: 13px; font-weight: 900; color: #164e4b; text-transform: uppercase;">
            ${docTitle}
          </div>
        </td>
        <td align="right" class="email-stack-left" style="padding: 10px 12px; vertical-align: middle; font-size: 11px; color: #334155; line-height: 1.45; font-family: Consolas, monospace;">
          ${metaLinesHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Pied de page officiel légal de l'entreprise pour les e-mails (Outlook-safe)
 */
export function buildOfficialEmailCompanyFooterHtml(attachmentNote?: string): string {
  return `
    ${
      attachmentNote
        ? `<div style="text-align: center; font-size: 11px; color: #64748b; padding: 10px 0 8px 0;"><em>${attachmentNote}</em></div>`
        : ''
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-top: 2px solid #D4A82F; margin-top: 10px;">
      <tr>
        <td align="center" style="padding: 12px 8px 4px 8px; text-align: center; font-size: 10.5px; color: #334155; line-height: 1.5;">
          <div style="font-weight: 800; color: #164e4b;">
            ${DEFAULT_COMPANY_INFO.name} &middot; ${DEFAULT_COMPANY_INFO.address} (${DEFAULT_COMPANY_INFO.city}, ${DEFAULT_COMPANY_INFO.country})
          </div>
          <div style="color: #475569; font-size: 10px;">
            Tél. ${DEFAULT_COMPANY_INFO.phone} &middot; ${DEFAULT_COMPANY_INFO.email}
          </div>
          <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
            SARL au capital de ${DEFAULT_COMPANY_INFO.capital} &mdash; NUI : ${DEFAULT_COMPANY_INFO.nui} &mdash; RCCM : ${DEFAULT_COMPANY_INFO.rccm}
          </div>
        </td>
      </tr>
    </table>
  `;
}
