/**
 * Offline Storage Module
 *
 * IndexedDB-based offline storage for the driver mobile PWA.
 * Stores loads, messages, fuel logs, and POD drafts for offline access.
 * Tracks sync status so items can be synced when connectivity returns.
 */

const DB_NAME = 'tms-driver-offline';
const DB_VERSION = 2;

export type OfflineStore =
  | 'loads'
  | 'messages'
  | 'fuel-logs'
  | 'pod-drafts'
  | 'pending-status-updates'
  | 'pending-uploads';

interface OfflineRecord {
  key: string;
  data: unknown;
  timestamp: number;
  synced: boolean;
}

/** Open (or create) the IndexedDB database with all required stores. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      const stores: OfflineStore[] = [
        'loads',
        'messages',
        'fuel-logs',
        'pod-drafts',
        'pending-status-updates',
        'pending-uploads',
      ];

      for (const storeName of stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Save data to an offline store.
 * If the key already exists it will be overwritten.
 */
export async function saveOfflineData(
  store: OfflineStore,
  key: string,
  data: unknown,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);

    const record: OfflineRecord = {
      key,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    objectStore.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Retrieve a single item from an offline store. */
export async function getOfflineData<T = unknown>(
  store: OfflineStore,
  key: string,
): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const objectStore = tx.objectStore(store);
    const request = objectStore.get(key);

    request.onsuccess = () => {
      db.close();
      const record = request.result as OfflineRecord | undefined;
      resolve(record ? (record.data as T) : null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Get all items in a store that have not been synced yet. */
export async function getPendingSyncItems<T = unknown>(
  store: OfflineStore,
): Promise<Array<{ key: string; data: T; timestamp: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const objectStore = tx.objectStore(store);
    const index = objectStore.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => {
      db.close();
      const records = (request.result as OfflineRecord[]).map((r) => ({
        key: r.key,
        data: r.data as T,
        timestamp: r.timestamp,
      }));
      resolve(records);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Mark a single item as synced. */
export async function markSynced(
  store: OfflineStore,
  key: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    const getReq = objectStore.get(key);

    getReq.onsuccess = () => {
      const record = getReq.result as OfflineRecord | undefined;
      if (record) {
        record.synced = true;
        objectStore.put(record);
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Remove all items that have been successfully synced from a store. */
export async function clearSyncedItems(store: OfflineStore): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    const index = objectStore.index('synced');
    const request = index.openCursor(IDBKeyRange.only(true));
    let deletedCount = 0;

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve(deletedCount);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Get the total count of pending (unsynced) items across all stores. */
export async function getTotalPendingCount(): Promise<number> {
  const stores: OfflineStore[] = [
    'pending-status-updates',
    'pending-uploads',
    'fuel-logs',
    'pod-drafts',
    'messages',
  ];

  let total = 0;
  for (const store of stores) {
    const items = await getPendingSyncItems(store);
    total += items.length;
  }
  return total;
}
