import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export interface LoadingAlertOptions {
  title?: string;
  text?: string;
}

/**
 * Affiche un loader plein écran/modal strict en attendant la réponse du serveur.
 */
export function showLoadingAlert(options: LoadingAlertOptions = { title: 'Traitement en cours...', text: 'Communication avec le serveur en cours...' }) {
  MySwal.fire({
    title: options.title || 'Traitement en cours...',
    text: options.text || 'Veuillez patienter pendant la réponse du serveur...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

/**
 * Affiche une alerte de succès SweetAlert2.
 */
export function showSuccessAlert(title: string, text?: string) {
  return MySwal.fire({
    icon: 'success',
    title: title || 'Succès !',
    text: text || 'Opération effectuée avec succès.',
    confirmButtonText: 'OK',
    confirmButtonColor: '#00796B',
  });
}

/**
 * Affiche une alerte d'échec SweetAlert2.
 */
export function showErrorAlert(title: string, text?: string) {
  return MySwal.fire({
    icon: 'error',
    title: title || 'Échec de l\'opération',
    text: text || 'Une erreur est survenue lors de la communication avec le serveur.',
    confirmButtonText: 'Compris',
    confirmButtonColor: '#DC2626',
  });
}

/**
 * Boîte de dialogue de confirmation de suppression (SweetAlert2)
 */
export async function confirmDeleteAlert(options: {
  title?: string;
  text?: string;
  itemName?: string;
  confirmButtonText?: string;
}): Promise<boolean> {
  const result = await MySwal.fire({
    title: options.title || 'Êtes-vous sûr ?',
    text: options.text || 'Cette action est irréversible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DC2626',
    cancelButtonColor: '#64748B',
    confirmButtonText: options.confirmButtonText || 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    reverseButtons: true,
  });
  return result.isConfirmed;
}

/**
 * Ferme toute alerte SweetAlert2 active.
 */
export function closeAlert() {
  Swal.close();
}
