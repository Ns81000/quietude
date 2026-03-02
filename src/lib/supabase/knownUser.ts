/**
 * Multi-layer storage for critical user identity data.
 * Uses localStorage + IndexedDB for redundancy.
 * If one fails, the other serves as backup.
 */

import { get, set, del } from 'idb-keyval';

const KNOWN_USER_KEY_PREFIX = 'quietude:known_user:';
const IDB_KNOWN_USER_PREFIX = 'known_user:';

export interface KnownUser {
  email: string;
  userId: string;
  isOnboarded: boolean;
  lastSyncedAt?: string; // Track when we last synced with server
}

/**
 * Get known user from both localStorage and IndexedDB.
 * Returns the most recent one (by lastSyncedAt) if both exist.
 */
export async function getKnownUserWithFallback(email: string | null): Promise<KnownUser | null> {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase();
  let localUser: KnownUser | null = null;
  let idbUser: KnownUser | null = null;
  
  // Try localStorage first (fastest)
  try {
    const stored = localStorage.getItem(`${KNOWN_USER_KEY_PREFIX}${normalizedEmail}`);
    localUser = stored ? JSON.parse(stored) : null;
  } catch {
    console.warn('[KnownUser] localStorage read failed');
  }
  
  // Try IndexedDB as backup
  try {
    idbUser = await get<KnownUser>(`${IDB_KNOWN_USER_PREFIX}${normalizedEmail}`);
  } catch {
    console.warn('[KnownUser] IndexedDB read failed');
  }
  
  // If both exist, return the most recently synced one
  if (localUser && idbUser) {
    const localTime = localUser.lastSyncedAt ? new Date(localUser.lastSyncedAt).getTime() : 0;
    const idbTime = idbUser.lastSyncedAt ? new Date(idbUser.lastSyncedAt).getTime() : 0;
    return localTime >= idbTime ? localUser : idbUser;
  }
  
  // Return whichever one exists
  return localUser || idbUser || null;
}

/**
 * Synchronous get for cases where async isn't possible (like route guards).
 * Only checks localStorage.
 */
export function getKnownUserSync(email: string | null): KnownUser | null {
  if (!email) return null;
  try {
    const stored = localStorage.getItem(`${KNOWN_USER_KEY_PREFIX}${email.toLowerCase()}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save known user to both localStorage and IndexedDB.
 * Ensures redundancy in case one storage mechanism fails.
 */
export async function setKnownUserWithBackup(user: KnownUser): Promise<void> {
  const normalizedEmail = user.email.toLowerCase();
  const userWithTimestamp: KnownUser = {
    ...user,
    lastSyncedAt: new Date().toISOString(),
  };
  
  // Save to localStorage (sync, fast)
  try {
    localStorage.setItem(
      `${KNOWN_USER_KEY_PREFIX}${normalizedEmail}`,
      JSON.stringify(userWithTimestamp)
    );
  } catch (err) {
    console.warn('[KnownUser] localStorage write failed:', err);
  }
  
  // Save to IndexedDB (async, backup)
  try {
    await set(`${IDB_KNOWN_USER_PREFIX}${normalizedEmail}`, userWithTimestamp);
  } catch (err) {
    console.warn('[KnownUser] IndexedDB write failed:', err);
  }
}

/**
 * Synchronous set for cases where async isn't possible.
 * Only writes to localStorage (IndexedDB write is fire-and-forget).
 */
export function setKnownUserSync(user: KnownUser): void {
  const normalizedEmail = user.email.toLowerCase();
  const userWithTimestamp: KnownUser = {
    ...user,
    lastSyncedAt: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(
      `${KNOWN_USER_KEY_PREFIX}${normalizedEmail}`,
      JSON.stringify(userWithTimestamp)
    );
  } catch (err) {
    console.warn('[KnownUser] localStorage write failed:', err);
  }
  
  // Fire-and-forget IndexedDB write
  set(`${IDB_KNOWN_USER_PREFIX}${normalizedEmail}`, userWithTimestamp).catch(() => {});
}

/**
 * Clear known user from both storage mechanisms.
 */
export async function clearKnownUserFromAll(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  
  try {
    localStorage.removeItem(`${KNOWN_USER_KEY_PREFIX}${normalizedEmail}`);
  } catch { /* ignore */ }
  
  try {
    await del(`${IDB_KNOWN_USER_PREFIX}${normalizedEmail}`);
  } catch { /* ignore */ }
}

/**
 * Get all known users from localStorage (for data version migration).
 */
export function getAllKnownUsersSync(): KnownUser[] {
  const users: KnownUser[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(KNOWN_USER_KEY_PREFIX)) {
      try {
        const user = JSON.parse(localStorage.getItem(key) || '');
        if (user) users.push(user);
      } catch { /* ignore */ }
    }
  }
  return users;
}
