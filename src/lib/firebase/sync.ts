/**
 * Firebase Sync Module
 * 
 * Manages data synchronization between local Zustand stores and Firestore.
 * Firestore has built-in offline persistence, so this is much simpler than Supabase.
 */

import { isFirebaseConfigured } from './client';
import {
  saveLearningPath,
  saveQuizSession,
  saveNote,
  deleteLearningPath,
  deleteQuizSession,
  deleteNote,
  saveFlashcardDeck,
  saveFlashcard,
  saveFlashcardsBatch,
  deleteFlashcardDeck,
  deleteFlashcard,
  fetchAllUserData,
} from './firestore';
import type { AppLearningPath, AppQuizSession, AppNote, AppFlashcardDeck, AppFlashcard } from './types';
import { get, set, clear } from 'idb-keyval';

// ============================================
// Sync Status
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

let syncListeners: Array<(status: SyncStatus) => void> = [];

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

let activeSyncs = 0;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let currentStatus: SyncStatus = 'idle';

function notifySyncStatus(status: SyncStatus): void {
  if (status === 'syncing') {
    activeSyncs++;
    if (activeSyncs === 1) {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        currentStatus = 'syncing';
        syncListeners.forEach((l) => l('syncing'));
        syncTimer = null;
      }, 400); // 400ms delay to prevent quick yellow dot flashes
    }
  } else if (status === 'idle') {
    if (activeSyncs > 0) activeSyncs--;
    
    if (activeSyncs === 0) {
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }
      if (currentStatus !== 'idle') {
        currentStatus = 'idle';
        syncListeners.forEach((l) => l('idle'));
      }
    }
  } else if (status === 'error') {
    if (activeSyncs > 0) activeSyncs--;
    
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    
    currentStatus = 'error';
    syncListeners.forEach((l) => l('error'));
  } else {
    currentStatus = status;
    syncListeners.forEach((l) => l(status));
  }
}

// ============================================
// Clear Local Data
// ============================================

/**
 * Clear all IndexedDB data
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    await clear();
  } catch (err) {
    console.error('[Sync] Failed to clear IndexedDB:', err);
  }
}

/**
 * Clear sync queue (compatibility function)
 */
export async function clearSyncQueue(): Promise<void> {
  // With Firestore, we don't have a manual sync queue
  // Firestore handles offline persistence automatically
}

// ============================================
// Sync Functions
// ============================================

/**
 * Sync a learning path to Firestore
 */
export async function syncLearningPath(path: AppLearningPath, userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveLearningPath(userId, path);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync learning path:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync a quiz session to Firestore
 */
export async function syncQuizSession(session: AppQuizSession, userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveQuizSession(userId, session);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync quiz session:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync a note to Firestore
 */
export async function syncNote(note: AppNote, userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveNote(userId, note);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync note:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync a flashcard deck to Firestore
 */
export async function syncFlashcardDeck(deck: AppFlashcardDeck, userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveFlashcardDeck(userId, deck);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync flashcard deck:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync a flashcard to Firestore
 */
export async function syncFlashcard(card: AppFlashcard, userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveFlashcard(userId, card);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync flashcard:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync multiple flashcards to Firestore in a batch
 */
export async function syncFlashcardsBatch(cards: AppFlashcard[], userId: string): Promise<void> {
  if (!isFirebaseConfigured() || !navigator.onLine || cards.length === 0) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    await saveFlashcardsBatch(userId, cards);
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync flashcards batch:', err);
    notifySyncStatus('error');
  }
}

/**
 * Sync deletion to Firestore
 */
export async function syncDelete(
  table: 'learning_paths' | 'quiz_sessions' | 'notes' | 'flashcard_decks' | 'flashcards',
  id: string,
  userId?: string
): Promise<void> {
  // Guard against undefined userId (happens during logout)
  if (!userId || !isFirebaseConfigured() || !navigator.onLine) {
    return;
  }
  
  try {
    notifySyncStatus('syncing');
    
    switch (table) {
      case 'learning_paths':
        await deleteLearningPath(userId, id);
        break;
      case 'quiz_sessions':
        await deleteQuizSession(userId, id);
        break;
      case 'notes':
        await deleteNote(userId, id);
        break;
      case 'flashcard_decks':
        await deleteFlashcardDeck(userId, id);
        break;
      case 'flashcards':
        await deleteFlashcard(userId, id);
        break;
    }
    
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Failed to sync delete:', err);
    notifySyncStatus('error');
  }
}

/**
 * Remove orphaned items from sync queue (compatibility function)
 * With Firestore, this is handled automatically
 */
export async function removeFromSyncQueueByPathId(pathId: string): Promise<void> {
  // Firestore handles cascading deletes if needed
  void pathId;
}

/**
 * Force sync all pending changes
 */
export async function forceSync(userId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !navigator.onLine) {
    return false;
  }
  
  // With Firestore offline persistence, data is automatically synced when online
  // This function just checks if we're connected
  notifySyncStatus('syncing');
  
  try {
    // Simple connectivity check
    await fetch('https://www.googleapis.com/generate_204', { mode: 'no-cors' });
    notifySyncStatus('idle');
    return true;
  } catch {
    notifySyncStatus('offline');
    return false;
  }
}

/**
 * Process sync queue (compatibility function)
 * Firestore handles this automatically
 */
export async function processSyncQueue(): Promise<void> {
  // Firestore automatically syncs when online
  if (navigator.onLine && isFirebaseConfigured()) {
    notifySyncStatus('idle');
  } else {
    notifySyncStatus('offline');
  }
}

/**
 * Get last sync time (compatibility function)
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    return await get<number>('quietude:last_sync') || null;
  } catch {
    return null;
  }
}

/**
 * Get pending sync count (compatibility function)
 * Firestore handles offline queue internally
 */
export async function getPendingSyncCount(): Promise<number> {
  // Firestore doesn't expose pending write count
  return 0;
}

// Re-export fetchAllUserData for convenience
export { fetchAllUserData };

// ============================================
// Online/Offline Listeners
// ============================================

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (isFirebaseConfigured()) {
      notifySyncStatus('syncing');
      // Firestore will automatically sync pending writes
      setTimeout(() => notifySyncStatus('idle'), 1000);
    }
  });
  
  window.addEventListener('offline', () => {
    notifySyncStatus('offline');
  });
}
