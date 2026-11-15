import Swal, { SweetAlertOptions } from 'sweetalert2';

// Base styling configuration to match Citrine Glassmorphism Design System
const baseSwalConfig: SweetAlertOptions = {
  backdrop: 'rgba(15, 23, 42, 0.40)',
  customClass: {
    popup: 'glass-modal rounded-3xl p-6 font-sans shadow-2xl',
    title: 'font-serif font-bold text-lg text-stone-900',
    htmlContainer: 'text-xs text-stone-600 leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition mx-1.5',
    cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition glass-chip text-stone-700 hover:text-stone-900 mx-1.5',
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
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white glass-btn-danger cursor-pointer transition mx-1.5',
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
        ? 'px-5 py-2.5 rounded-xl font-bold text-xs text-white glass-btn-danger cursor-pointer transition mx-1.5'
        : 'px-5 py-2.5 rounded-xl font-bold text-xs text-white glass-btn-primary cursor-pointer transition mx-1.5',
    },
  });

  return result.isConfirmed;
}

/**
 * Affichage d'un loader SweetAlert immédiat et synchrone pendant une opération serveur.
 * Tourne jusqu'à ce que la réponse du serveur soit reçue.
 */
export function showLoadingAlert(
  titleOrOptions: string | { title?: string; text?: string } = 'Traitement en cours...',
  text: string = 'Communication avec le serveur en cours...'
) {
  let title = 'Traitement en cours...';
  let message = text;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || title;
    message = titleOrOptions.text || message;
  } else if (typeof titleOrOptions === 'string') {
    title = titleOrOptions;
  }

  Swal.fire({
    ...baseSwalConfig,
    title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

/**
 * Ferme toute alerte ou loader actif.
 */
export function closeAlert() {
  Swal.close();
}

/**
 * Affichage d'un SweetAlert de succès (uniquement APRÈS réception de la réponse du serveur).
 */
export async function showSuccessAlert(title: string = 'Succès !', text: string = 'Opération effectuée avec succès.') {
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'success',
    iconColor: '#10B981',
    title,
    text,
    confirmButtonText: 'OK, Continuer',
    confirmButtonColor: '#00796B',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white glass-btn-primary cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Affichage d'un SweetAlert d'échec affichant la véritable exception du serveur.
 */
export async function showErrorAlert(title: string = 'Échec de l\'opération', text: string = 'Une erreur est survenue.') {
  console.error("❌ [SWEETALERT ERROR POPUP]:", { title, text });
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'error',
    iconColor: '#E11D48',
    title,
    html: `<div class="text-left font-mono text-xs bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed break-words shadow-2xs">${text}</div>`,
    confirmButtonText: 'Fermer',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white glass-btn-danger cursor-pointer transition mx-1.5',
    },
  });
}

/**
 * Affichage d'un SweetAlert pour un statut en attente / différé / validation requise.
 */
export async function showPendingAlert(
  title: string = 'En attente de traitement',
  text: string = 'Votre demande a été transmise et est en attente de validation.'
) {
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'info',
    iconColor: '#3B82F6',
    title,
    text,
    confirmButtonText: 'Compris',
    confirmButtonColor: '#2563EB',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

export { executeOperationWithLoading, executeDeleteWithSweetAlert } from './sweetAlertExecutors';

export default Swal;
