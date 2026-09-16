/**
 * IndexedDB wrapper for FocusedOnYou offline-first logging.
 * Stores: foy_sessions, foy_sets, foy_sync_queue, foy_metadata.
 */

const DB_NAME = "foy-offline";
const DB_VERSION = 1;
const STORES = ["foy_sessions", "foy_sets", "foy_sync_queue", "foy_metadata"] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB only available in browser"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          if (name === "foy_sync_queue") {
            store.createIndex("by_created", "createdAt", { unique: false });
          }
          if (name === "foy_sets") {
            store.createIndex("by_session", "session_id", { unique: false });
          }
        }
      });
    };
  });
  return dbPromise;
}

export async function initDB(): Promise<IDBDatabase> {
  return openDB();
}

function getStore(
  db: IDBDatabase,
  storeName: StoreName,
  mode: IDBTransactionMode = "readonly"
): IDBObjectStore {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export async function put<T extends { id: string }>(
  table: StoreName,
  item: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, table, "readwrite");
    const req = store.put(item);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function get<T extends { id: string }>(
  table: StoreName,
  id: string
): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, table);
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result ?? undefined);
  });
}

export type WhereClause = { key: string; value: string | number | boolean };

export async function getAll<T extends { id: string }>(
  table: StoreName,
  where?: WhereClause
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, table);
    const req = where
      ? store.index(where.key).getAll(IDBKeyRange.only(where.value))
      : store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result ?? []);
  });
}

export async function deleteRecord(table: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, table, "readwrite");
    const req = store.delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function clearStore(table: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, table, "readwrite");
    const req = store.clear();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}
