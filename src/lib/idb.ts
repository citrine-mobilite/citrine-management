import { openDB, DBSchema, IDBPDatabase } from 'idb';

export const DB_NAME = 'ProcessFlowDB';
export const DB_VERSION = 2;

export interface ProcessFlowDBSchema extends DBSchema {
  presences: {
    key: string;
    value: any;
  };
  tasks: {
    key: string;
    value: any;
  };
  employees: {
    key: string;
    value: any;
  };
  reminders: {
    key: string;
    value: any;
  };
  inventory_items: {
    key: string;
    value: any;
  };
  financial_transactions: {
    key: string;
    value: any;
  };
  users: {
    key: string;
    value: any;
  };
  offline_queue: {
    key: string;
    value: {
      id: string;
      collectionName: string;
      actionType: 'save' | 'delete';
      payload: any;
      timestamp: string;
    };
  };
}

// In-memory fallback if IndexedDB is blocked or unavailable in iframe
const memoryFallback = new Map<string, Map<string, any>>();

function getMemoryStore(storeName: string) {
  if (!memoryFallback.has(storeName)) {
    memoryFallback.set(storeName, new Map());
  }
  return memoryFallback.get(storeName)!;
}

const fallbackIdb: any = {
  objectStoreNames: {
    contains: () => true,
  },
  async put(storeName: string, val: any) {
    const store = getMemoryStore(storeName);
    const key = val.id || val.key || `${Date.now()}`;
    store.set(key, val);
    return key;
  },
  async getAll(storeName: string) {
    const store = getMemoryStore(storeName);
    return Array.from(store.values());
  },
  async get(storeName: string, key: string) {
    const store = getMemoryStore(storeName);
    return store.get(key);
  },
  async delete(storeName: string, key: string) {
    const store = getMemoryStore(storeName);
    store.delete(key);
  },
  async clear(storeName: string) {
    const store = getMemoryStore(storeName);
    store.clear();
  },
  transaction(storeName: string) {
    return {
      store: {
        put: async (val: any) => fallbackIdb.put(storeName, val),
        clear: async () => fallbackIdb.clear(storeName),
        delete: async (k: string) => fallbackIdb.delete(storeName, k),
        get: async (k: string) => fallbackIdb.get(storeName, k),
        getAll: async () => fallbackIdb.getAll(storeName),
      },
      done: Promise.resolve(),
    };
  },
};

async function initIdb(): Promise<IDBPDatabase<ProcessFlowDBSchema> | any> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return fallbackIdb;
  }

  try {
    const db = await openDB<ProcessFlowDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const stores = [
          'presences',
          'tasks',
          'employees',
          'reminders',
          'inventory_items',
          'financial_transactions',
          'users',
          'offline_queue',
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName as any)) {
            db.createObjectStore(storeName as any, { keyPath: 'id' });
          }
        });
      },
    });
    return db;
  } catch (error) {
    console.warn('[IDB] IndexedDB inaccessible, using memory fallback:', error);
    return fallbackIdb;
  }
}

export const dbPromise = initIdb();
