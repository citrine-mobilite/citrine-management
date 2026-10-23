/**
 * ⚡ CITRINE MANAGEMENT - GLOBAL ASYNC ACTION TRACKER SERVICE
 * Règle d'or : Toute action qui prend du temps affiche un loader SI ET SEULEMENT SI
 * elle prend plus de 1 seconde (1000 ms).
 * - En dessous de 1 seconde : action transparente, zéro flash, zéro perturbation visuelle.
 * - Au-delà de 1 seconde : affichage automatique d'un loader élégant et précis.
 */

export interface AsyncActionInfo {
  id: string;
  label: string;
  details?: string;
  startTime: number;
}

export interface AsyncLoadingState {
  isLoading: boolean;
  activeActionsCount: number;
  currentActionLabel: string;
  currentActionDetails?: string;
  elapsedSeconds: number;
}

type Listener = (state: AsyncLoadingState) => void;

class AsyncActionTrackerService {
  private activeActions = new Map<string, AsyncActionInfo>();
  private visibleActions = new Set<string>();
  private pendingTimers = new Map<string, any>();
  private listeners = new Set<Listener>();
  private elapsedInterval: any = null;
  private currentElapsed = 0;

  private state: AsyncLoadingState = {
    isLoading: false,
    activeActionsCount: 0,
    currentActionLabel: '',
    elapsedSeconds: 0,
  };

  /**
   * Seuil de déclenchement du loader (1000 ms = 1 seconde)
   */
  public readonly DELAY_THRESHOLD_MS = 1000;

  /**
   * Démarre le suivi d'une action asynchrone avec un seuil de 1 seconde.
   * Retourne une fonction stop() à appeler à la fin de l'action.
   */
  public startAction(label: string = 'Traitement en cours...', details?: string): () => void {
    const id = `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const startTime = Date.now();

    const actionInfo: AsyncActionInfo = { id, label, details, startTime };
    this.activeActions.set(id, actionInfo);

    // Démarre un compte à rebours de 1 seconde.
    // Si l'action n'est pas terminée au bout de 1s, elle devient "visible" et déclenche le loader.
    const timer = setTimeout(() => {
      this.pendingTimers.delete(id);
      if (this.activeActions.has(id)) {
        this.visibleActions.add(id);
        this.updateState();
      }
    }, this.DELAY_THRESHOLD_MS);

    this.pendingTimers.set(id, timer);

    // Retourne la fonction de finalisation
    return () => this.stopAction(id);
  }

  /**
   * Arrête le suivi d'une action.
   */
  public stopAction(id: string): void {
    // Si le timer d'1s n'était pas encore échu, on l'annule (aucun loader n'aura été affiché)
    if (this.pendingTimers.has(id)) {
      clearTimeout(this.pendingTimers.get(id));
      this.pendingTimers.delete(id);
    }

    this.activeActions.delete(id);
    this.visibleActions.delete(id);
    this.updateState();
  }

  /**
   * Enveloppe une Promesse ou une fonction asynchrone avec le suivi du seuil de 1 seconde.
   */
  public async track<T>(
    label: string,
    promiseOrFn: Promise<T> | (() => Promise<T>),
    details?: string
  ): Promise<T> {
    const stop = this.startAction(label, details);
    try {
      if (typeof promiseOrFn === 'function') {
        return await promiseOrFn();
      }
      return await promiseOrFn;
    } finally {
      stop();
    }
  }

  /**
   * S'abonne aux changements d'état du loader global.
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Récupère l'état actuel.
   */
  public getState(): AsyncLoadingState {
    return this.state;
  }

  private updateState(): void {
    const isVisible = this.visibleActions.size > 0;
    const activeCount = this.activeActions.size;

    let currentLabel = '';
    let currentDetails: string | undefined;

    if (isVisible) {
      // Trouver la dernière action visible pour afficher son libellé
      const lastVisibleId = Array.from(this.visibleActions).pop();
      if (lastVisibleId && this.activeActions.has(lastVisibleId)) {
        const info = this.activeActions.get(lastVisibleId)!;
        currentLabel = info.label;
        currentDetails = info.details;
      } else {
        currentLabel = 'Traitement en cours...';
      }

      // Démarrer le compteur de secondes si pas encore fait
      if (!this.elapsedInterval) {
        this.currentElapsed = 1;
        this.elapsedInterval = setInterval(() => {
          this.currentElapsed += 1;
          this.state = {
            ...this.state,
            elapsedSeconds: this.currentElapsed,
          };
          this.notify();
        }, 1000);
      }
    } else {
      // Arrêter le compteur de secondes
      if (this.elapsedInterval) {
        clearInterval(this.elapsedInterval);
        this.elapsedInterval = null;
      }
      this.currentElapsed = 0;
    }

    this.state = {
      isLoading: isVisible,
      activeActionsCount: activeCount,
      currentActionLabel: currentLabel,
      currentActionDetails: currentDetails,
      elapsedSeconds: this.currentElapsed,
    };

    this.notify();

    // Déclenche également un custom event global pour compatibilité
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('citrine:async_action_loading', {
          detail: this.state,
        })
      );
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('[AsyncActionTracker] Erreur dans le listener:', err);
      }
    }
  }
}

export const asyncActionTrackerService = new AsyncActionTrackerService();
