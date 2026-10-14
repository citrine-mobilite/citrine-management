/**
 * Safe Persistent Storage Utility with Multi-Tier Fallback:
 * 1. window.localStorage (persists across page reloads & browser restarts)
 * 2. window.sessionStorage (persists across reloads within the same session)
 * 3. In-memory Map (fallback if third-party storage is restricted in sandboxed iframes)
 */

const memoryStore = new Map<string, string>();

function getStorage(type: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window[type];
    const testKey = '__citrine_test_storage__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    // 1. Try localStorage
    try {
      const ls = getStorage('localStorage');
      if (ls) {
        const val = ls.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
      }
    } catch {}

    // 2. Try sessionStorage
    try {
      const ss = getStorage('sessionStorage');
      if (ss) {
        const val = ss.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
      }
    } catch {}

    // 3. Fallback to memory
    return memoryStore.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);

    try {
      const ls = getStorage('localStorage');
      if (ls) {
        ls.setItem(key, value);
      }
    } catch {}

    try {
      const ss = getStorage('sessionStorage');
      if (ss) {
        ss.setItem(key, value);
      }
    } catch {}
  },

  removeItem: (key: string): void => {
    memoryStore.delete(key);

    try {
      const ls = getStorage('localStorage');
      if (ls) {
        ls.removeItem(key);
      }
    } catch {}

    try {
      const ss = getStorage('sessionStorage');
      if (ss) {
        ss.removeItem(key);
      }
    } catch {}
  },

  clear: (): void => {
    memoryStore.clear();

    try {
      const ls = getStorage('localStorage');
      if (ls) {
        ls.clear();
      }
    } catch {}

    try {
      const ss = getStorage('sessionStorage');
      if (ss) {
        ss.clear();
      }
    } catch {}
  }
};
