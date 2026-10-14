/**
 * In-Memory Storage Utility (Zero LocalStorage)
 * All data comes directly from the database or in-memory state as requested.
 */

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => memoryStore.get(key) || null,
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
  },
  clear: (): void => {
    memoryStore.clear();
  }
};
