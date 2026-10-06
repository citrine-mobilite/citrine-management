export function getTimeBasedGreeting(date: Date = new Date()): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const m0400 = 4 * 60;        // 240 (04:00)
  const m1100 = 11 * 60;       // 660 (11:00)
  const m1500 = 15 * 60;       // 900 (15:00)
  const m1900 = 19 * 60;       // 1140 (19:00)

  if (totalMinutes >= m0400 && totalMinutes <= m1100) {
    return "Bonjour";
  } else if (totalMinutes > m1100 && totalMinutes <= m1500) {
    return "Bon après-midi";
  } else if (totalMinutes > m1500 && totalMinutes <= m1900) {
    return "Bonsoir";
  } else {
    return "Bonne nuit";
  }
}

export type ClockActionType = 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';

export interface ClockSequenceResult {
  effectiveAction: ClockActionType;
  overridden: boolean;
  message?: string;
}

/**
 * Enforces strict sequential order for pointages:
 * 1. arrival (Arrivée)
 * 2. pauseStart (Début de pause)
 * 3. pauseEnd (Retour de pause)
 * 4. departure (Départ)
 *
 * If arrival is missing, ANY clock attempt forces 'arrival' first.
 * If user is on pause (pauseStart set, pauseEnd missing), ANY clock attempt forces 'pauseEnd' first.
 */
export function enforceSequentialClockAction(
  requestedAction: ClockActionType,
  existingPresence?: {
    arrivalTime?: string | null;
    pauseStart?: string | null;
    pauseEnd?: string | null;
    departureTime?: string | null;
  }
): ClockSequenceResult {
  const arrival = existingPresence?.arrivalTime;
  const pauseStart = existingPresence?.pauseStart;
  const pauseEnd = existingPresence?.pauseEnd;
  const departure = existingPresence?.departureTime;

  // Rule 1: Arrival MUST be clocked first. If missing, force 'arrival'
  if (!arrival) {
    if (requestedAction !== 'arrival') {
      return {
        effectiveAction: 'arrival',
        overridden: true,
        message: "L'Arrivée n'ayant pas encore été pointée aujourd'hui, le pointage enregistre obligatoirement votre 'Arrivée' en premier."
      };
    }
    return { effectiveAction: 'arrival', overridden: false };
  }

  // Rule 2: Arrival is clocked. If user is currently ON PAUSE (pauseStart set, pauseEnd missing)
  if (pauseStart && !pauseEnd) {
    if (requestedAction !== 'pauseEnd') {
      return {
        effectiveAction: 'pauseEnd',
        overridden: true,
        message: "Vous étiez en pause. Le pointage enregistre obligatoirement votre 'Retour de pause'."
      };
    }
    return { effectiveAction: 'pauseEnd', overridden: false };
  }

  // Rule 3: Arrival is clocked. If user tries 'pauseEnd' without having clocked 'pauseStart'
  if (!pauseStart && requestedAction === 'pauseEnd') {
    return {
      effectiveAction: 'pauseStart',
      overridden: true,
      message: "Le début de pause n'ayant pas été enregistré, le pointage marque d'abord le 'Début de pause'."
    };
  }

  // Rule 4: If departure is already clocked
  if (departure) {
    return {
      effectiveAction: requestedAction,
      overridden: false,
      message: "Tous les pointages de la journée ont déjà été enregistrés."
    };
  }

  return { effectiveAction: requestedAction, overridden: false };
}

/**
 * Checks if arrival time is strictly after the company's lateThresholdTime.
 */
export function isLate(arrivalTime: string | null | undefined, lateThreshold?: string): boolean {
  if (!arrivalTime || !arrivalTime.includes(':') || !lateThreshold || !lateThreshold.includes(':')) return false;
  const [h, m] = arrivalTime.split(':').map(Number);
  const [threshH, threshM] = lateThreshold.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || isNaN(threshH) || isNaN(threshM)) return false;
  return (h * 60 + m) > (threshH * 60 + threshM);
}

/**
 * Formats duration in minutes to a human readable format (e.g., "7h 45m" or "45m")
 */
export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes <= 0) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

