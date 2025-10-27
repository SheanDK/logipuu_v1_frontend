'use client';

import { OfflineJob } from './offlineJob.types';
import { createDefaultOfflineJobStore } from './storage/indexedDbStore';
import { OfflineJobStore } from './storage/persistentStore';

/**
 * Cached driver map response wrapper.
 * `payload` holds whatever structure the API returned.
 */
export interface DriverCachedMapData {
    fetchedAt: number;
    payload: any;
}

/**
 * Cached details for a single Puulaani (timber site).
 */
export interface DriverCachedPuulaani {
    puulaaniId: number;
    fetchedAt: number;
    payload: any;
}

/**
 * Minimal metadata for an offline-created load draft,
 * used to reconcile local drafts with server state later.
 */
export interface DriverCachedLoadDraftMeta {
    tempId: string;
    puulaaniId: number;
    createdAt: number;
}

/**
 * A point-in-time view of everything cached for the driver.
 */
export interface DriverCacheSnapshot {
    mapData?: DriverCachedMapData;
    puulaanit: DriverCachedPuulaani[];
    pendingLoadDrafts: DriverCachedLoadDraftMeta[];
}

/** IndexedDB database and object store names */
const DB_NAME = 'driverOfflineCache';
const STORE_CACHE = 'driverCache';
const STORE_DRAFTS = 'driverDrafts';

/** Singleton promise for an open IndexedDB connection */
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open (and upgrade if needed) the IndexedDB database.
 * Creates object stores on first run or version bump.
 */
function openDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = () => {
                const db = request.result;

                // Store for misc cache entries (map data, puulaani details, …)
                if (!db.objectStoreNames.contains(STORE_CACHE)) {
                    db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
                }

                // Store for offline load drafts (by tempId)
                if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
                    db.createObjectStore(STORE_DRAFTS, { keyPath: 'tempId' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return dbPromise;
}

/**
 * Utility to run a function within a transaction for a given store.
 * Ensures the transaction is completed or aborted as appropriate.
 */
async function withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    worker: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
    const db = await openDb();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        worker(store)
            .then((result) => {
                tx.oncomplete = () => resolve(result);
            })
            .catch((error) => {
                tx.abort();
                reject(error);
            });

        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

/**
 * Cache the latest driver map data (overwrites previous).
 */
export async function saveDriverMapData(payload: any): Promise<void> {
    await withStore(STORE_CACHE, 'readwrite', async (store) => {
        store.put({ key: 'mapData', fetchedAt: Date.now(), payload });
    });
}

/**
 * Load cached driver map data (if present).
 */
export async function loadDriverMapData(): Promise<DriverCachedMapData | undefined> {
    return withStore(STORE_CACHE, 'readonly', async (store) => {
        return new Promise<DriverCachedMapData | undefined>((resolve, reject) => {
            const request = store.get('mapData');
            request.onsuccess = () => resolve(request.result as DriverCachedMapData | undefined);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Cache a single Puulaani (timber site) details record by puulaaniId.
 */
export async function savePuulaaniDetails(puulaaniId: number, payload: any): Promise<void> {
    await withStore(STORE_CACHE, 'readwrite', async (store) => {
        const serializable = JSON.parse(JSON.stringify(payload));
        store.put({ key: `puulaani:${puulaaniId}`, puulaaniId, fetchedAt: Date.now(), payload: serializable });
    });
}

/**
 * Load cached Puulaani details for a given puulaaniId (if present).
 */
export async function loadPuulaaniDetails(puulaaniId: number): Promise<DriverCachedPuulaani | undefined> {
    return withStore(STORE_CACHE, 'readonly', async (store) => {
        return new Promise<DriverCachedPuulaani | undefined>((resolve, reject) => {
            const request = store.get(`puulaani:${puulaaniId}`);
            request.onsuccess = () => resolve(request.result as DriverCachedPuulaani | undefined);
            request.onerror = () => reject(request.error);
        });
    });
}

export async function hasPuulaaniDetails(puulaaniId: number): Promise<boolean> {
    const record = await loadPuulaaniDetails(puulaaniId);
    return Boolean(record);
}

/**
 * List all cached Puulaani records from the cache store.
 */
export async function listCachedPuulaanit(): Promise<DriverCachedPuulaani[]> {
    return withStore(STORE_CACHE, 'readonly', async (store) => {
        const records: DriverCachedPuulaani[] = [];
        return new Promise<DriverCachedPuulaani[]>((resolve, reject) => {
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (!cursor) {
                    resolve(records);
                    return;
                }
                const value = cursor.value;
                // Only include entries with key format "puulaani:<id>"
                if (value && typeof value.key === 'string' && value.key.startsWith('puulaani:')) {
                    records.push(value as DriverCachedPuulaani);
                }
                cursor.continue();
            };
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Add or update a pending offline load draft metadata entry.
 */
export async function addPendingLoadDraft(meta: DriverCachedLoadDraftMeta): Promise<void> {
    await withStore(STORE_DRAFTS, 'readwrite', async (store) => {
        store.put(meta);
    });
}

/**
 * Remove a pending offline load draft by its temporary ID.
 */
export async function removePendingLoadDraft(tempId: string): Promise<void> {
    await withStore(STORE_DRAFTS, 'readwrite', async (store) => {
        store.delete(tempId);
    });
}

/**
 * List all pending offline load drafts (metadata only).
 */
export async function listPendingLoadDrafts(): Promise<DriverCachedLoadDraftMeta[]> {
    return withStore(STORE_DRAFTS, 'readonly', async (store) => {
        return new Promise<DriverCachedLoadDraftMeta[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as DriverCachedLoadDraftMeta[]);
            request.onerror = () => reject(request.error);
        });
    });
}

/**
 * Clear both cache stores: cached data and pending drafts.
 * Useful on logout or hard refresh.
 */
export async function clearDriverCache(): Promise<void> {
    await withStore(STORE_CACHE, 'readwrite', async (store) => {
        store.clear();
    });
    await withStore(STORE_DRAFTS, 'readwrite', async (store) => {
        store.clear();
    });
}

/**
 * Build a snapshot of all relevant cached items in one go.
 * Helpful for debugging or presenting an offline overview.
 */
export async function snapshotDriverCache(): Promise<DriverCacheSnapshot> {
    const [mapData, puulaanit, drafts] = await Promise.all([
        loadDriverMapData(),
        listCachedPuulaanit(),
        listPendingLoadDrafts(),
    ]);
    return {
        mapData,
        puulaanit,
        pendingLoadDrafts: drafts,
    };
}
