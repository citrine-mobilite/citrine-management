import { useState, useEffect, useCallback } from 'react';
import { asyncActionTrackerService, AsyncLoadingState } from '../services/asyncActionTrackerService';

/**
 * Hook React pour suivre l'état du loader asynchrone universel
 * et exécuter facilement des actions avec le seuil strict de 1 seconde.
 */
export function useAsyncAction() {
  const [loadingState, setLoadingState] = useState<AsyncLoadingState>(() =>
    asyncActionTrackerService.getState()
  );

  useEffect(() => {
    const unsubscribe = asyncActionTrackerService.subscribe((state) => {
      setLoadingState(state);
    });
    return unsubscribe;
  }, []);

  const runWithLoader = useCallback(
    async <T>(
      label: string,
      promiseOrFn: Promise<T> | (() => Promise<T>),
      details?: string
    ): Promise<T> => {
      return asyncActionTrackerService.track(label, promiseOrFn, details);
    },
    []
  );

  return {
    isLoading: loadingState.isLoading,
    actionLabel: loadingState.currentActionLabel,
    actionDetails: loadingState.currentActionDetails,
    elapsedSeconds: loadingState.elapsedSeconds,
    runWithLoader,
    startAction: (label: string, details?: string) =>
      asyncActionTrackerService.startAction(label, details),
  };
}
