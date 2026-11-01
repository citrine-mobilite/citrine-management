import Swal, { SweetAlertOptions } from 'sweetalert2';

// Base styling configuration to match Citrine Design System
const baseSwalConfig: SweetAlertOptions = {
  customClass: {
    popup: 'rounded-3xl border border-stone-200 shadow-2xl p-6 font-sans',
    title: 'font-serif font-bold text-lg text-stone-900',
    htmlContainer: 'text-xs text-stone-600 leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition mx-1.5',
    cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition bg-stone-100 text-stone-700 hover:bg-stone-200 mx-1.5',
  },
  buttonsStyling: false,
};

/**
 * Boîte de dialogue de confirmation de suppression standardisée
 */
export async function confirmDeleteAlert(options: {
  title?: string;
  text?: string;
  itemName?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}): Promise<boolean> {
  const {
    title = 'Confirmer la suppression',
    text = 'Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.',
    itemName,
    confirmButtonText = 'Oui, supprimer',
    cancelButtonText = 'Annuler',
  } = options;

  const htmlContent = itemName
    ? `<div class="space-y-2 mt-1">
        <p class="text-stone-600 text-xs">${text}</p>
        <div class="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 font-bold text-xs truncate">
          "${itemName}"
        </div>
       </div>`
    : `<p class="text-stone-600 text-xs">${text}</p>`;

  const result = await Swal.fire({
    ...baseSwalConfig,
    title,
    html: htmlContent,
    icon: 'warning',
    iconColor: '#E11D48',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    focusCancel: true,
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer transition mx-1.5',
    },
  });

  return result.isConfirmed;
}

/**
 * Boîte de dialogue de confirmation générique (validation, modification, etc.)
 */
export async function confirmActionAlert(options: {
  title: string;
  text?: string;
  html?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'info' | 'question' | 'success';
  isDestructive?: boolean;
}): Promise<boolean> {
  const {
    title,
    text,
    html,
    confirmButtonText = 'Confirmer',
    cancelButtonText = 'Annuler',
    icon = 'question',
    isDestructive = false,
  } = options;

  const result = await Swal.fire({
    ...baseSwalConfig,
    title,
    text: html ? undefined : text,
    html,
    icon,
    iconColor: isDestructive ? '#E11D48' : '#2A7B76',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: isDestructive
        ? 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer transition mx-1.5'
        : 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2A7B76] hover:bg-[#20635F] shadow-sm cursor-pointer transition mx-1.5',
    },
  });

  return result.isConfirmed;
}

/**
 * Affichage d'un loader SweetAlert immédiat et synchrone pendant une opération serveur.
 */
export function showLoadingAlert(title: string = 'Traitement en cours...', text: string = 'Communication avec le serveur en cours...') {
  Swal.fire({
    ...baseSwalConfig,
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

/**
 * Affichage d'un SweetAlert de succès immédiat après réponse serveur.
 */
export async function showSuccessAlert(title: string = 'Succès !', text: string = 'Opération effectuée avec succès.') {
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'success',
    iconColor: '#10B981',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#00796B',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2A7B76] hover:bg-[#20635F] shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Affichage d'un SweetAlert d'échec affichant la véritable exception du serveur.
 */
export async function showErrorAlert(title: string = 'Erreur', text: string = 'Une erreur est survenue.') {
  console.error("❌ [SWEETALERT ERROR POPUP]:", { title, text });
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'error',
    iconColor: '#E11D48',
    title,
    html: `<div class="text-left font-mono text-xs bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed break-words shadow-2xs">${text}</div>`,
    confirmButtonText: 'Compris',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Exécute une action asynchrone (création, modification, suppression...) avec :
 * 1. Loader synchrone immédiat (sans délai)
 * 2. Attente de la réponse du serveur
 * 3. Affichage d'une alerte de succès OU d'erreur selon le résultat réel du serveur.
 */
export async function executeOperationWithLoading<T = any>(options: {
  loadingTitle?: string;
  loadingText?: string;
  action: () => Promise<T> | T;
  successTitle?: string;
  successMessage?: string;
  errorMessage?: string;
}): Promise<{ success: boolean; data?: T; error?: any }> {
  const {
    loadingTitle = 'Traitement en cours...',
    loadingText = 'Communication avec le serveur en cours...',
    action,
    successTitle = 'Succès !',
    successMessage = 'Opération effectuée avec succès.',
    errorMessage = 'Une erreur est survenue lors de la communication avec le serveur.',
  } = options;

  // 1. Afficher immédiatement le loader bloquant
  showLoadingAlert(loadingTitle, loadingText);

  try {
    // 2. Attendre la réponse du serveur
    const result = await action();

    // 3. Afficher le succès
    await showSuccessAlert(successTitle, successMessage);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('❌ [OPERATION ERROR]:', error);
    const finalErrorMsg = error?.message || String(error) || errorMessage;
    // 4. Afficher l'erreur exacte
    await showErrorAlert('Échec de l\'opération', finalErrorMsg);
    return { success: false, error };
  }
}

/**
 * Exécute une suppression complète avec confirmation préalable, loader immédiat et retour serveur.
 */
export async function executeDeleteWithSweetAlert(options: {
  title?: string;
  text?: string;
  itemName?: string;
  action: () => Promise<any> | any;
  successTitle?: string;
  successMessage?: string;
  errorMessage?: string;
}): Promise<boolean> {
  const {
    title = 'Confirmer la suppression',
    text = 'Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.',
    itemName,
    action,
    successTitle = 'Supprimé !',
    successMessage = 'L\'élément a été supprimé avec succès.',
    errorMessage = 'Échec de la suppression.',
  } = options;

  // 1. Demande de confirmation
  const isConfirmed = await confirmDeleteAlert({ title, text, itemName });
  if (!isConfirmed) return false;

  // 2. Loader immédiat sans délai
  showLoadingAlert('Suppression en cours...', 'Suppression définitive sur le serveur...');

  try {
    // 3. Attente de la réponse du serveur
    await action();

    // 4. Succès
    await showSuccessAlert(successTitle, successMessage);
    return true;
  } catch (error: any) {
    console.error('❌ [DELETE ERROR]:', error);
    const finalErrorMsg = error?.message || errorMessage;
    await showErrorAlert('Échec de la suppression', finalErrorMsg);
    return false;
  }
}

export default Swal;
