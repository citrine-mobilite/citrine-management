export function buildMissionAssignedHtml(params: {
  employeeName: string;
  destinationOrReason: string;
  startDate: string;
  endDate: string;
  durationDays: number;
}): string {
  return `
      <p>Bonjour <strong>${params.employeeName}</strong>,</p>
      <p>Nous vous confirmons votre ordre et affectation en <strong>Mission Professionnelle</strong>.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f3ff" style="width: 100%; background-color: #f5f3ff; border: 1px solid #ddd6fe; margin: 16px 0;">
        <tr>
          <td class="email-pad-sm" style="padding: 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 13px;">
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #6b21a8; font-weight: bold; width: 38%;">Objet / Motif :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${params.destinationOrReason}</td>
              </tr>
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Période :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">Du ${params.startDate} au ${params.endDate}</td>
              </tr>
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Durée totale :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #1e1b4b;">${params.durationDays} jour(s)</td>
              </tr>
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #6b21a8; font-weight: bold;">Pointage :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #15803d;">Dispense automatique de badge physique accordée</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #44403c;">
        Pendant cette période, votre statut RH est officiellement <strong>En mission</strong>. Aucun pointage au bureau n&apos;est requis et aucune absence ne sera constatée.
      </p>
      <p style="margin-top: 20px; font-weight: 600;">
        Bien cordialement,<br />
        La Direction des Ressources Humaines
      </p>
    `;
}

export function buildLeaveDecisionHtml(params: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'rejected' | 'modified';
  reason?: string;
}): { html: string; statusLabel: string } {
  const isApproved = params.status === 'approved';
  const statusLabel = isApproved ? 'Approuvée' : params.status === 'rejected' ? 'Refusée' : 'Modifiée';
  const statusColor = isApproved ? '#166534' : params.status === 'rejected' ? '#991b1b' : '#854d0e';
  const bgColor = isApproved ? '#f0fdf4' : params.status === 'rejected' ? '#fef2f2' : '#fefce8';
  const borderColor = isApproved ? '#bbf7d0' : params.status === 'rejected' ? '#fecaca' : '#fef08a';

  const html = `
      <p>Bonjour <strong>${params.employeeName}</strong>,</p>
      <p>Votre demande d&apos;absence / congé a fait l&apos;objet d&apos;un arbitrage par la direction.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${bgColor}" style="width: 100%; background-color: ${bgColor}; border: 1px solid ${borderColor}; margin: 16px 0;">
        <tr>
          <td class="email-pad-sm" style="padding: 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; font-size: 13px;">
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #57534e; font-weight: bold; width: 38%;">Type :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #1c1917;">${params.leaveType}</td>
              </tr>
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #57534e; font-weight: bold;">Période :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: #1c1917;">Du ${params.startDate} au ${params.endDate}</td>
              </tr>
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #57534e; font-weight: bold;">Décision RH :</td>
                <td class="email-kv-val" style="padding: 6px 0; font-weight: bold; color: ${statusColor};">${statusLabel}</td>
              </tr>
              ${params.reason ? `
              <tr>
                <td class="email-kv-label" style="padding: 6px 0; color: #57534e; font-weight: bold;">Observation :</td>
                <td class="email-kv-val" style="padding: 6px 0; color: #1c1917;">${params.reason}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-weight: 600;">
        Bien cordialement,<br />
        La Direction des Ressources Humaines
      </p>
    `;

  return { html, statusLabel };
}
