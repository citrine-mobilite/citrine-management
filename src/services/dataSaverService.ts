// Data Saver Mode Service (In-Memory)

let dataSaverState = false;
const listeners = new Set<(enabled: boolean) => void>();

export const dataSaverService = {
  isEnabled: () => dataSaverState,

  toggle: () => {
    dataSaverState = !dataSaverState;
    listeners.forEach(fn => fn(dataSaverState));
    return dataSaverState;
  },

  set: (enabled: boolean) => {
    dataSaverState = enabled;
    listeners.forEach(fn => fn(dataSaverState));
  },

  subscribe: (listener: (enabled: boolean) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
