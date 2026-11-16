import Swal, { SweetAlertOptions } from 'sweetalert2';
import { asyncActionTrackerService } from '../services/asyncActionTrackerService';

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

let activeManualLoaderStopper: (() => void) | null = null;

function stopManualLoaderIfAny() {
  if (activeManualLoaderStopper) {
    try {
      activeManualLoaderStopper();
    } catch {}
    activeManualLoaderStopper = null;
  }
}

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
 * Affichage immédiat du modal loader centré pendant une opération de création, modification ou suppression.
 */
export function showLoadingAlert(
  titleOrOptions: string | { title?: string; text?: string } = 'Opération en cours...',
  text: string = 'Veuillez patienter...'
) {
  let title = 'Opération en cours...';
  let message = text;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || title;
    message = titleOrOptions.text || message;
  } else if (typeof titleOrOptions === 'string') {
    title = titleOrOptions;
  }

  stopManualLoaderIfAny();
  if (Swal.isVisible()) {
    Swal.close();
  }
  activeManualLoaderStopper = asyncActionTrackerService.startAction(title, message, true);
}

/**
 * Ferme tout loader ou SweetAlert actif.
 */
export function closeAlert() {
  stopManualLoaderIfAny();
  if (Swal.isVisible()) {
    Swal.close();
  }
}

/**
 * 1/3 - SweetAlert de succès (uniquement pour Création, Modification, Suppression)
 */
export async function showSuccessAlert(title: string = 'Succès !', text: string = 'Opération effectuée avec succès.') {
  stopManualLoaderIfAny();
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
 * 2/3 - SweetAlert d'échec affichant la véritable exception (Création, Modification, Suppression)
 */
export async function showErrorAlert(title: string = 'Échec de l\'opération', text: string = 'Une erreur est survenue.') {
  stopManualLoaderIfAny();
  console.error('❌ [SWEETALERT ERROR POPUP]:', { title, text });
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
 * 3/3 - SweetAlert pour un statut en attente / différé / validation requise
 */
export async function showPendingAlert(
  title: string = 'En attente de validation',
  text: string = 'Votre demande a été enregistrée et est en attente de traitement.'
) {
  stopManualLoaderIfAny();
  return Swal.fire({
    ...baseSwalConfig,
    icon: 'info',
    iconColor: '#D97706',
    title,
    text,
    confirmButtonText: 'Compris',
    confirmButtonColor: '#D97706',
    customClass: {
      ...baseSwalConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-sm cursor-pointer transition mx-1.5',
    },
  });
}

export { executeOperationWithLoading, executeDeleteWithSweetAlert } from './sweetAlertExecutors';

export default Swal;
