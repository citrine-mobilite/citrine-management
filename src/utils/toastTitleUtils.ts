export function deduceToastTitle(text: string, t: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('pointage') || lower.includes('badgé') || lower.includes('arrivée') || lower.includes('départ') || lower.includes('pause')) return 'Pointage de Présence';
  if (lower.includes('permission') || lower.includes('congé') || lower.includes('absence')) return 'Demande de Permission / Congé';
  if (lower.includes('frais') || lower.includes('remboursement') || lower.includes('dépense')) return 'Note de Frais';
  if (lower.includes('paie') || lower.includes('salaire') || lower.includes('bulletin')) return 'Rémunération & Paie';
  if (lower.includes('prêt') || lower.includes('acompte')) return 'Avance & Prêt Financier';
  if (lower.includes('tâche') || lower.includes('task')) return 'Gestion des Tâches';
  if (lower.includes('incident') || lower.includes('retard') || lower.includes('discipline')) return 'Signalement RH / Incident';
  if (lower.includes('profil') || lower.includes('avatar') || lower.includes('mot de passe') || lower.includes('compte')) return 'Gestion du Profil';
  if (lower.includes('code') || lower.includes('badge') || lower.includes('qr')) return 'Code d’Accès & Badge';
  if (lower.includes('supprim') || lower.includes('annul')) return 'Suppression effectuée';
  if (lower.includes('modifi') || lower.includes('mis à jour')) return 'Mise à jour enregistrée';
  if (t === 'error') return 'Attention requise';
  if (t === 'warning') return 'Avertissement système';
  if (t === 'info') return 'Information Citrine';
  return 'Opération confirmée';
}

export function resolveToastPayload(
  titleOrMessage: string,
  messageOrType?: string | 'success' | 'error' | 'warning' | 'info',
  type?: 'success' | 'error' | 'warning' | 'info'
): { resolvedTitle: string; resolvedMessage: string; resolvedType: 'success' | 'error' | 'warning' | 'info' } {
  if (type) {
    return { resolvedTitle: titleOrMessage, resolvedMessage: String(messageOrType || ''), resolvedType: type };
  }
  if (
    messageOrType === 'success' ||
    messageOrType === 'error' ||
    messageOrType === 'warning' ||
    messageOrType === 'info'
  ) {
    return {
      resolvedTitle: deduceToastTitle(titleOrMessage, messageOrType),
      resolvedMessage: titleOrMessage,
      resolvedType: messageOrType,
    };
  }
  if (typeof messageOrType === 'string' && messageOrType.trim().length > 0) {
    return { resolvedTitle: titleOrMessage, resolvedMessage: messageOrType, resolvedType: 'success' };
  }
  return {
    resolvedTitle: deduceToastTitle(titleOrMessage, 'success'),
    resolvedMessage: titleOrMessage,
    resolvedType: 'success',
  };
}

