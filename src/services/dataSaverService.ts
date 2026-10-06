// Data Saver Mode Service for low-bandwidth 2G/3G mobile networks

const STORAGE_KEY = 'citrine_data_saver_mode';

let dataSaverState = false;

// Initialize state
if (typeof window !== 'undefined') {
  dataSaverState = localStorage.getItem(STORAGE_KEY) === 'true';
}

const listeners = new Set<(enabled: boolean) => void>();

export const dataSaverService = {
  isEnabled: () => dataSaverState,

  toggle: () => {
    dataSaverState = !dataSaverState;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(dataSaverState));
    }
    listeners.forEach(fn => fn(dataSaverState));
    return dataSaverState;
  },

  set: (enabled: boolean) => {
    dataSaverState = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
    listeners.forEach(fn => fn(dataSaverState));
  },

  subscribe: (listener: (enabled: boolean) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
