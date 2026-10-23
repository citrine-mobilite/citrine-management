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
 * Affichage d'un loader SweetAlert pendant une opération asynchrone
 */
export function showLoadingAlert(title: string = 'Opération en cours...', text: string = 'Veuillez patienter...') {
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
 * Affichage d'un SweetAlert de succès
 */
export async function showSuccessAlert(title: string = 'Succès !', text: string = 'Opération effectuée avec succès.', timer: number = 2200) {
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'success',
    iconColor: '#10B981',
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: timer <= 0,
    confirmButtonText: 'Fermer',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2A7B76] hover:bg-[#20635F] shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Affichage d'un SweetAlert d'échec
 */
export async function showErrorAlert(title: string = 'Erreur', text: string = 'Une erreur est survenue.') {
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'error',
    iconColor: '#E11D48',
    title,
    text,
    confirmButtonText: 'Compris',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Exécute une suppression complète :
 * - Confirmation Modal
 * - Loader affiché UNIQUEMENT si l'action prend plus de 1 seconde (règle des 1000ms)
 * - Fermeture immédiate et propre, sans pop-up de succès redondant
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
    errorMessage = 'Échec de la suppression.',
  } = options;

  // 1. Demande de confirmation
  const isConfirmed = await confirmDeleteAlert({ title, text, itemName });
  if (!isConfirmed) return false;

  // 2. Déclenchement du Loader SI ET SEULEMENT SI l'action prend plus de 1 seconde
  let loaderTimer: any = setTimeout(() => {
    showLoadingAlert('Suppression en cours...', 'Veuillez patienter pendant la mise à jour...');
  }, 1000);

  try {
    // 3. Exécution de l'action
    await action();

    // 4. Fermeture propre : annulation du loader s'il n'a pas encore été déclenché, ou fermeture
    clearTimeout(loaderTimer);
    if (Swal.isVisible()) {
      Swal.close();
    }
    return true;
  } catch (error: any) {
    clearTimeout(loaderTimer);
    console.error('Erreur lors de la suppression :', error);
    const finalErrorMsg = error?.message || errorMessage;
    await showErrorAlert('Échec de la suppression', finalErrorMsg);
    return false;
  }
}

/**
 * Exécute une action générale :
 * - Confirmation Modal
 * - Loader affiché UNIQUEMENT si l'action prend plus de 1 seconde (règle des 1000ms)
 * - Fermeture propre
 */
export async function executeActionWithSweetAlert<T = any>(options: {
  title: string;
  text?: string;
  html?: string;
  confirmButtonText?: string;
  isDestructive?: boolean;
  loadingTitle?: string;
  loadingText?: string;
  action: () => Promise<T> | T;
  successTitle?: string;
  successMessage?: string;
  errorMessage?: string;
}): Promise<{ success: boolean; data?: T; error?: any }> {
  const {
    title,
    text,
    html,
    confirmButtonText = 'Confirmer',
    isDestructive = false,
    loadingTitle = 'Traitement en cours...',
    loadingText = 'Veuillez patienter...',
    action,
    errorMessage = 'Une erreur est survenue lors du traitement.',
  } = options;

  // 1. Demande de confirmation
  const isConfirmed = await confirmActionAlert({
    title,
    text,
    html,
    confirmButtonText,
    isDestructive,
  });
  if (!isConfirmed) return { success: false };

  // 2. Déclenchement du Loader SI ET SEULEMENT SI l'action prend plus de 1 seconde
  let loaderTimer: any = setTimeout(() => {
    showLoadingAlert(loadingTitle, loadingText);
  }, 1000);

  try {
    // 3. Action
    const result = await action();

    // 4. Fermeture directe
    clearTimeout(loaderTimer);
    if (Swal.isVisible()) {
      Swal.close();
    }
    return { success: true, data: result };
  } catch (error: any) {
    clearTimeout(loaderTimer);
    console.error('Erreur lors du traitement :', error);
    await showErrorAlert('Erreur', error?.message || errorMessage);
    return { success: false, error };
  }
}

export default Swal;
