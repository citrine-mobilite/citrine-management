// Utility service for mobile haptic feedback (Vibration API)

export const haptic = {
  // Light tap for standard buttons
  light: () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
  },
  // Success pattern for clocking or task completion
  success: () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate([15, 50, 15]); } catch { /* ignore */ }
    }
  },
  // Warning pattern for missing data or offline queue
  warning: () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate([30, 100, 30]); } catch { /* ignore */ }
    }
  },
  // Error pattern
  error: () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate([50, 50, 50]); } catch { /* ignore */ }
    }
  }
};
