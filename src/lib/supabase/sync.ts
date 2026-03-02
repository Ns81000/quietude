import { getSupabase, isSupabaseConfigured } from './client';
import { withRetry } from './retry';
import { get, set, del, keys, clear } from 'idb-keyval';
import type { LearningPath as DBLearningPath, QuizSession as DBQuizSession, Note as DBNote } from './database.types';
import type { LearningPath } from '@/types/quiz';
import type { QuizSession } from '@/store/quiz';
import type { Note } from '@/store/notes';

const SYNC_QUEUE_KEY = 'quietude:sync_queue';
const LAST_SYNC_KEY = 'quietude:last_sync';

/**
 * Clear all IndexedDB databases used by the app.
 * This ensures a completely fresh start on data version upgrades.
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    // Clear idb-keyval store
    await clear();
    console.log('[Sync] Cleared IndexedDB');
  } catch (err) {
    console.error('[Sync] Failed to clear IndexedDB:', err);
  }
}

interface SyncQueueItem {
  id: string;
  table: 'learning_paths' | 'quiz_sessions' | 'notes' | 'profiles';
  operation: 'upsert' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

let syncInProgress = false;
let syncListeners: Array<(status: SyncStatus) => void> = [];

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

function notifySyncStatus(status: SyncStatus): void {
  syncListeners.forEach(l => l(status));
}

async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const queue = await get<SyncQueueItem[]>(SYNC_QUEUE_KEY);
    return queue || [];
  } catch {
    return [];
  }
}

async function setSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  await set(SYNC_QUEUE_KEY, queue);
}

/**
 * Remove items from sync queue that reference a specific learning path.
 * This prevents orphaned quiz sessions from causing sync errors after path deletion.
 */
export async function removeFromSyncQueueByPathId(pathId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter(item => {
      // Remove quiz_sessions that reference this path_id
      if (item.table === 'quiz_sessions' && item.data.path_id === pathId) {
        return false;
      }
      // Remove the learning_path itself
      if (item.table === 'learning_paths' && item.data.id === pathId) {
        return false;
      }
      return true;
    });
    
    if (filteredQueue.length !== queue.length) {
      await setSyncQueue(filteredQueue);
      console.log(`[Sync] Removed ${queue.length - filteredQueue.length} orphaned items from queue for path: ${pathId}`);
    }
  } catch (err) {
    console.error('[Sync] Failed to clean up sync queue:', err);
  }
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  // Only add to queue if Supabase is configured
  if (!isSupabaseConfigured()) {
    return;
  }
  
  // Never sync data with local- user IDs to server (they don't exist there)
  if (item.data.user_id && typeof item.data.user_id === 'string' && item.data.user_id.startsWith('local-')) {
    console.warn('[Sync] Skipping sync for local-only user data:', item.table);
    return;
  }

  const queue = await getSyncQueue();
  
  const existingIndex = queue.findIndex(
    q => q.table === item.table && q.data.id === item.data.id
  );
  
  const newItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  };
  
  if (existingIndex >= 0) {
    queue[existingIndex] = newItem;
  } else {
    queue.push(newItem);
  }
  
  await setSyncQueue(queue);
  
  if (navigator.onLine) {
    processSyncQueue();
  }
}

export async function processSyncQueue(): Promise<void> {
  if (syncInProgress || !navigator.onLine || !isSupabaseConfigured()) {
    return;
  }
  
  syncInProgress = true;
  notifySyncStatus('syncing');
  
  try {
    const queue = await getSyncQueue();
    if (queue.length === 0) {
      notifySyncStatus('idle');
      return;
    }
    
    const supabase = getSupabase();
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    const failedItems: SyncQueueItem[] = [];
    
    for (const item of sortedQueue) {
      try {
        if (item.operation === 'upsert') {
          const { error } = await supabase
            .from(item.table)
            .upsert(item.data as any);
          
          if (error) {
            throw error;
          }
        } else if (item.operation === 'delete') {
          const { error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id as string);
          
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
        }
      } catch (err) {
        console.error(`[Sync] Failed to process item:`, item, err);
        
        if (item.retries < 3) {
          // Exponential backoff: 5s, 25s, 125s
          const backoffMs = Math.pow(5, item.retries + 1) * 1000;
          failedItems.push({
            ...item,
            retries: item.retries + 1,
            timestamp: Date.now() + backoffMs,
          });
        }
      }
    }
    
    await setSyncQueue(failedItems);
    
    if (failedItems.length > 0) {
      notifySyncStatus('error');
    } else {
      await set(LAST_SYNC_KEY, Date.now());
      notifySyncStatus('idle');
    }
  } catch (err) {
    console.error('[Sync] Queue processing failed:', err);
    notifySyncStatus('error');
  } finally {
    syncInProgress = false;
  }
}

export async function syncLearningPath(path: LearningPath, userId: string): Promise<void> {
  const dbPath: Partial<DBLearningPath> = {
    id: path.id,
    user_id: userId,
    title: path.title || null,
    subject: path.subject,
    education_level: path.education_level || null,
    topic_type: path.topic_type || null,
    source_type: path.source_type || null,
    source_url: path.source_url || null,
    source_text: path.source_text || null,
    source_file_name: path.source_file_name || null,
    topic_map: path.topic_map as any,
    topics: path.topics as any,
    needs_study_plan: path.needs_study_plan,
    status: path.status,
    current_topic_id: path.current_topic_id || null,
    created_at: path.created_at,
    updated_at: new Date().toISOString(),
  };
  
  await addToSyncQueue({
    table: 'learning_paths',
    operation: 'upsert',
    data: dbPath,
  });
}

export async function syncQuizSession(session: QuizSession, userId: string): Promise<void> {
  const dbSession: Partial<DBQuizSession> = {
    id: session.id,
    user_id: userId,
    topic_id: session.topic_id,
    path_id: session.path_id,
    subject: session.subject || null,
    is_dig_deeper: session.is_dig_deeper,
    is_retake: session.is_retake,
    config: session.config as any,
    questions: session.questions as any,
    answers: session.answers as any,
    score: session.score,
    total: session.total,
    score_pct: session.score_pct,
    passed: session.passed,
    started_at: session.started_at,
    submitted_at: session.submitted_at,
    time_taken_secs: session.time_taken_secs,
  };
  
  await addToSyncQueue({
    table: 'quiz_sessions',
    operation: 'upsert',
    data: dbSession,
  });
}

export async function syncNote(note: Note, userId: string): Promise<void> {
  const dbNote: Partial<DBNote> = {
    id: note.id,
    user_id: userId,
    topic_id: note.topic_id,
    topic_title: note.topic_title,
    subject: note.subject,
    content_html: note.content_html,
    session_id: note.session_id || null,
    created_at: note.created_at,
    updated_at: new Date().toISOString(),
  };
  
  await addToSyncQueue({
    table: 'notes',
    operation: 'upsert',
    data: dbNote,
  });
}

export async function syncDelete(table: 'learning_paths' | 'quiz_sessions' | 'notes', id: string): Promise<void> {
  await addToSyncQueue({
    table,
    operation: 'delete',
    data: { id },
  });
}

export async function fetchAllUserData(userId: string): Promise<{
  paths: LearningPath[];
  sessions: QuizSession[];
  notes: Note[];
} | null> {
  if (!isSupabaseConfigured() || !navigator.onLine) {
    return null;
  }
  
  // Never fetch data for local-only users from server
  if (userId.startsWith('local-')) {
    console.warn('[Sync] Cannot fetch server data for local-only user');
    return null;
  }
  
  try {
    // Use retry mechanism for resilient data fetching
    return await withRetry(async () => {
      const supabase = getSupabase();
      const [pathsRes, sessionsRes, notesRes] = await Promise.all([
        supabase.from('learning_paths').select('*').eq('user_id', userId),
        supabase.from('quiz_sessions').select('*').eq('user_id', userId),
        supabase.from('notes').select('*').eq('user_id', userId),
      ]);
      
      if (pathsRes.error || sessionsRes.error || notesRes.error) {
        throw new Error(`Failed to fetch: paths=${pathsRes.error?.message}, sessions=${sessionsRes.error?.message}, notes=${notesRes.error?.message}`);
      }
      
      const paths: LearningPath[] = (pathsRes.data || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        title: p.title || undefined,
        subject: p.subject,
        education_level: p.education_level || '',
        topic_type: p.topic_type || '',
        source_type: p.source_type as any,
        source_url: p.source_url,
        source_text: p.source_text || undefined,
        source_file_name: p.source_file_name || undefined,
        topic_map: p.topic_map as any,
        topics: (p.topics as any) || [],
        needs_study_plan: p.needs_study_plan,
        status: p.status as 'active' | 'completed' | 'archived',
        current_topic_id: p.current_topic_id,
        created_at: p.created_at,
      }));
      
      const sessions: QuizSession[] = (sessionsRes.data || []).map(s => ({
        id: s.id,
        user_id: s.user_id,
        topic_id: s.topic_id,
        path_id: s.path_id,
        subject: s.subject || '',
        is_dig_deeper: s.is_dig_deeper,
        is_retake: s.is_retake,
        config: s.config as any,
        questions: s.questions as any,
        answers: s.answers as any,
        score: s.score,
        total: s.total,
        score_pct: s.score_pct,
        passed: s.passed,
        started_at: s.started_at,
        submitted_at: s.submitted_at,
        time_taken_secs: s.time_taken_secs,
      }));
      
      const notes: Note[] = (notesRes.data || []).map(n => ({
        id: n.id,
        topic_id: n.topic_id,
        topic_title: n.topic_title,
        subject: n.subject,
        content_html: n.content_html,
        session_id: n.session_id || undefined,
        created_at: n.created_at,
      }));
      
      await set(LAST_SYNC_KEY, Date.now());
      
      return { paths, sessions, notes };
    }, { maxRetries: 3, baseDelayMs: 1000 });
  } catch (err) {
    console.error('[Sync] Failed to fetch all user data after retries:', err);
    return null;
  }
}

export async function forceSync(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !navigator.onLine) {
    return false;
  }
  
  await processSyncQueue();
  
  const queue = await getSyncQueue();
  return queue.length === 0;
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    return await get<number>(LAST_SYNC_KEY) || null;
  } catch {
    return null;
  }
}

export async function getPendingSyncCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

/**
 * Clear the entire sync queue. Used when logging out or switching accounts
 * to prevent old user's data from syncing to new user's account.
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await setSyncQueue([]);
    console.log('[Sync] Sync queue cleared');
  } catch (err) {
    console.error('[Sync] Failed to clear sync queue:', err);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (isSupabaseConfigured()) {
      processSyncQueue();
    }
  });
  
  window.addEventListener('offline', () => {
    notifySyncStatus('offline');
  });
}
