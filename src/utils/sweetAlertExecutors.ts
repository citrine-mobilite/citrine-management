import {
  confirmDeleteAlert,
  showErrorAlert,
  showPendingAlert,
  showSuccessAlert,
} from './sweetAlert';
import { asyncActionTrackerService } from '../services/asyncActionTrackerService';

const MIN_LOADER_VISIBLE_MS = 220;

async function ensureMinimumLoaderTime(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_LOADER_VISIBLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_LOADER_VISIBLE_MS - elapsed));
  }
}

export async function executeOperationWithLoading<T = any>(options: {
  loadingTitle?: string;
  loadingText?: string;
  action: () => Promise<T> | T;
  successTitle?: string;
  successMessage?: string;
  errorMessage?: string;
  pendingTitle?: string;
  pendingMessage?: string;
  isPendingCheck?: (result: T) => boolean;
}): Promise<{ success: boolean; data?: T; error?: any; isPending?: boolean }> {
  const {
    loadingTitle = 'Opération en cours...',
    loadingText = 'Veuillez patienter pendant le traitement de votre demande...',
    action,
    successTitle = 'Succès !',
    successMessage = 'Opération effectuée avec succès.',
    errorMessage = 'Une erreur est survenue lors de la communication avec le serveur.',
    pendingTitle = 'Demande en attente',
    pendingMessage = "L'opération a été enregistrée et est en attente de validation.",
    isPendingCheck,
  } = options;

  const startedAt = Date.now();
  const stopLoader = asyncActionTrackerService.startAction(loadingTitle, loadingText, true);

  try {
    const result = await action();
    await ensureMinimumLoaderTime(startedAt);
    stopLoader();
    await asyncActionTrackerService.waitForIdle();

    if (result && typeof result === 'object' && ((result as any).success === false || (result as any).error)) {
      const errMsg = (result as any).error || errorMessage;
      await showErrorAlert("Échec de l'opération", errMsg);
      return { success: false, error: errMsg, data: result };
    }

    const isPending = isPendingCheck
      ? isPendingCheck(result)
      : result &&
        typeof result === 'object' &&
        ((result as any).status === 'pending' ||
          (result as any).isPending === true ||
          (result as any).outcome === 'pending');

    if (isPending) {
      await showPendingAlert(pendingTitle, pendingMessage);
      return { success: true, data: result, isPending: true };
    }

    await showSuccessAlert(successTitle, successMessage);
    return { success: true, data: result };
  } catch (error: any) {
    await ensureMinimumLoaderTime(startedAt);
    stopLoader();
    await asyncActionTrackerService.waitForIdle();
    console.error('❌ [OPERATION ERROR]:', error);
    const finalErrorMsg = error?.message || String(error) || errorMessage;
    await showErrorAlert("Échec de l'opération", finalErrorMsg);
    return { success: false, error };
  }
}

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
    successMessage = "L'élément a été supprimé avec succès.",
    errorMessage = 'Échec de la suppression.',
  } = options;

  const isConfirmed = await confirmDeleteAlert({ title, text, itemName });
  if (!isConfirmed) return false;

  const startedAt = Date.now();
  const stopLoader = asyncActionTrackerService.startAction(
    'Suppression en cours...',
    'Veuillez patienter pendant la suppression...',
    true
  );

  try {
    await action();
    await ensureMinimumLoaderTime(startedAt);
    stopLoader();
    await asyncActionTrackerService.waitForIdle();
    await showSuccessAlert(successTitle, successMessage);
    return true;
  } catch (error: any) {
    await ensureMinimumLoaderTime(startedAt);
    stopLoader();
    await asyncActionTrackerService.waitForIdle();
    console.error('❌ [DELETE ERROR]:', error);
    const finalErrorMsg = error?.message || errorMessage;
    await showErrorAlert('Échec de la suppression', finalErrorMsg);
    return false;
  }
}
