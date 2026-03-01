import { get, set, del, keys } from 'idb-keyval';

const OFFLINE_NOTES_KEY = 'quietude:offline:notes';
const OFFLINE_SESSIONS_KEY = 'quietude:offline:sessions';
const OFFLINE_PATHS_KEY = 'quietude:offline:paths';

export async function cacheForOffline<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, {
      data,
      cachedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[Offline] Failed to cache data:', err);
  }
}

export async function getOfflineData<T>(key: string): Promise<T | null> {
  try {
    const cached = await get<{ data: T; cachedAt: number }>(key);
    return cached?.data || null;
  } catch {
    return null;
  }
}

export async function cacheNotes(notes: unknown[]): Promise<void> {
  await cacheForOffline(OFFLINE_NOTES_KEY, notes);
}

export async function getOfflineNotes<T>(): Promise<T[] | null> {
  return getOfflineData<T[]>(OFFLINE_NOTES_KEY);
}

export async function cacheSessions(sessions: unknown[]): Promise<void> {
  await cacheForOffline(OFFLINE_SESSIONS_KEY, sessions);
}

export async function getOfflineSessions<T>(): Promise<T[] | null> {
  return getOfflineData<T[]>(OFFLINE_SESSIONS_KEY);
}

export async function cachePaths(paths: unknown[]): Promise<void> {
  await cacheForOffline(OFFLINE_PATHS_KEY, paths);
}

export async function getOfflinePaths<T>(): Promise<T[] | null> {
  return getOfflineData<T[]>(OFFLINE_PATHS_KEY);
}

export async function clearOfflineCache(): Promise<void> {
  try {
    await del(OFFLINE_NOTES_KEY);
    await del(OFFLINE_SESSIONS_KEY);
    await del(OFFLINE_PATHS_KEY);
  } catch (err) {
    console.warn('[Offline] Failed to clear cache:', err);
  }
}

export async function getOfflineCacheSize(): Promise<number> {
  try {
    let size = 0;
    const allKeys = await keys();
    
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith('quietude:offline:')) {
        const data = await get(key);
        if (data) {
          size += JSON.stringify(data).length;
        }
      }
    }
    
    return size;
  } catch {
    return 0;
  }
}
