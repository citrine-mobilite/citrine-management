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

  return { html, statusLabel };
}
