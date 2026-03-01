# Sync Mechanism

[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=flat-square)](https://supabase.com/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Offline_Storage-blue?style=flat-square)](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
[![idb-keyval](https://img.shields.io/badge/idb--keyval-Wrapper-orange?style=flat-square)](https://github.com/jakearchibald/idb-keyval)

Quietude implements an **offline-first synchronization system** that ensures data integrity across devices while providing seamless offline functionality. The system queues changes locally and syncs with Supabase when connectivity is restored.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Architecture Overview](#architecture-overview)
- [Sync Queue System](#sync-queue-system)
- [Conflict Resolution](#conflict-resolution)
- [IndexedDB Storage](#indexeddb-storage)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Network Detection](#network-detection)
- [Implementation Details](#implementation-details)

---

## Philosophy

The sync mechanism follows the **offline-first** design principle:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE-FIRST PRINCIPLES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   1. LOCAL FIRST                                                                │
│   ├── All writes go to local storage immediately                               │
│   ├── UI updates instantly (optimistic updates)                                 │
│   └── User never waits for network                                              │
│                                                                                 │
│   2. EVENTUAL CONSISTENCY                                                       │
│   ├── Changes queue for sync when offline                                       │
│   ├── Sync happens automatically when online                                    │
│   └── Conflicts resolved deterministically                                      │
│                                                                                 │
│   3. GRACEFUL DEGRADATION                                                       │
│   ├── Full functionality offline                                                │
│   ├── Sync status visible to user                                               │
│   └── Manual sync trigger available                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SYNC ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                           USER ACTION                                    │  │
│   │                      (Create Quiz, Save Note)                            │  │
│   └────────────────────────────────┬────────────────────────────────────────┘  │
│                                    │                                            │
│                                    ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          ZUSTAND STORE                                   │  │
│   │                      (Immediate local update)                            │  │
│   └────────────────────────────────┬────────────────────────────────────────┘  │
│                                    │                                            │
│                    ┌───────────────┴───────────────┐                           │
│                    │                               │                           │
│                    ▼                               ▼                           │
│   ┌────────────────────────────┐   ┌────────────────────────────┐             │
│   │      localStorage          │   │      SYNC QUEUE            │             │
│   │   (Zustand persist)        │   │   (IndexedDB via idb)      │             │
│   └────────────────────────────┘   └─────────────┬──────────────┘             │
│                                                   │                            │
│                                    ┌──────────────┴──────────────┐             │
│                                    │                             │             │
│                             Online │                      Offline│             │
│                                    ▼                             ▼             │
│                    ┌────────────────────────────┐  ┌────────────────────────┐ │
│                    │      SUPABASE SYNC         │  │    QUEUE PENDING       │ │
│                    │   (Process immediately)    │  │   (Wait for online)    │ │
│                    └────────────────────────────┘  └────────────────────────┘ │
│                                    │                             │             │
│                                    └──────────────┬──────────────┘             │
│                                                   │                            │
│                                                   ▼                            │
│                              ┌────────────────────────────────┐               │
│                              │     SYNC STATUS INDICATOR      │               │
│                              │   (Pending count, last sync)   │               │
│                              └────────────────────────────────┘               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Queue System

### Queue Item Structure

```typescript
// src/lib/supabase/sync.ts
interface SyncQueueItem {
  id: string;
  operation: 'insert' | 'update' | 'delete';
  table: 'quiz_sessions' | 'notes' | 'learning_paths' | 'user_sessions';
  data: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  lastError?: string;
}
```

### Adding to Queue

```typescript
import { set, get, del, keys } from 'idb-keyval';

const SYNC_QUEUE_PREFIX = 'sync_queue_';

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attempts: 0
  };
  
  // Store in IndexedDB
  await set(`${SYNC_QUEUE_PREFIX}${queueItem.id}`, queueItem);
  
  // Attempt immediate sync if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}
```

### Processing Queue

```typescript
export async function processSyncQueue(): Promise<SyncResult> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(SYNC_QUEUE_PREFIX)
  );
  
  const results: SyncResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    pending: 0
  };
  
  // Sort by timestamp (oldest first)
  const items: SyncQueueItem[] = [];
  for (const key of queueKeys) {
    const item = await get(key);
    if (item) items.push(item);
  }
  items.sort((a, b) => a.timestamp - b.timestamp);
  
  for (const item of items) {
    results.processed++;
    
    try {
      await syncItem(item);
      await del(`${SYNC_QUEUE_PREFIX}${item.id}`);
      results.succeeded++;
    } catch (error) {
      // Update attempt count
      item.attempts++;
      item.lastError = error.message;
      
      if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        // Move to dead letter queue
        await set(`dead_letter_${item.id}`, item);
        await del(`${SYNC_QUEUE_PREFIX}${item.id}`);
        results.failed++;
      } else {
        // Keep in queue for retry
        await set(`${SYNC_QUEUE_PREFIX}${item.id}`, item);
        results.pending++;
      }
    }
  }
  
  return results;
}
```

### Sync Operation Handler

```typescript
async function syncItem(item: SyncQueueItem): Promise<void> {
  const { supabase } = await import('./client');
  
  switch (item.operation) {
    case 'insert':
      const { error: insertError } = await supabase
        .from(item.table)
        .insert(item.data);
      if (insertError) throw insertError;
      break;
      
    case 'update':
      const { error: updateError } = await supabase
        .from(item.table)
        .update(item.data)
        .eq('id', item.data.id);
      if (updateError) throw updateError;
      break;
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from(item.table)
        .delete()
        .eq('id', item.data.id);
      if (deleteError) throw deleteError;
      break;
  }
}
```

---

## Conflict Resolution

### Resolution Strategy

Quietude uses a **Last-Write-Wins (LWW)** strategy with timestamp-based ordering:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       CONFLICT RESOLUTION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Scenario: Same record edited on two devices while offline                     │
│                                                                                 │
│   Device A (offline)           Server              Device B (offline)           │
│        │                          │                       │                     │
│   Edit at T=100                   │                  Edit at T=150              │
│   updatedAt: 100                  │                  updatedAt: 150             │
│        │                          │                       │                     │
│        │                     ┌────┴────┐                  │                     │
│        │                     │ Online  │                  │                     │
│        │                     │ T=200   │                  │                     │
│        │                     └────┬────┘                  │                     │
│        │                          │                       │                     │
│   Sync at T=200 ─────────────────►│                       │                     │
│   (updatedAt: 100)                │                       │                     │
│        │                          │                       │                     │
│        │                     ┌────┴────┐                  │                     │
│        │                     │ Compare │                  │                     │
│        │                     │ T=100   │                  │                     │
│        │                     │ vs null │                  │                     │
│        │                     │ Accept! │                  │                     │
│        │                     └────┬────┘                  │                     │
│        │                          │                       │                     │
│        │                          │◄───────────────── Sync at T=250             │
│        │                          │                  (updatedAt: 150)           │
│        │                          │                       │                     │
│        │                     ┌────┴────┐                  │                     │
│        │                     │ Compare │                  │                     │
│        │                     │ T=150   │                  │                     │
│        │                     │ vs T=100│                  │                     │
│        │                     │ 150>100 │                  │                     │
│        │                     │ Accept! │                  │                     │
│        │                     └────┬────┘                  │                     │
│        │                          │                       │                     │
│   Receive update ◄────────────────│                       │                     │
│   (updatedAt: 150)                │                       │                     │
│        │                          │                       │                     │
│   Final: Both devices have version with updatedAt: 150                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
async function resolveConflict(
  localItem: SyncQueueItem,
  serverItem: Record<string, unknown>
): Promise<'local' | 'server' | 'merge'> {
  const localTimestamp = localItem.data.updatedAt as number;
  const serverTimestamp = serverItem.updatedAt as number;
  
  // Last-write-wins
  if (localTimestamp > serverTimestamp) {
    return 'local';
  } else if (serverTimestamp > localTimestamp) {
    return 'server';
  }
  
  // Identical timestamps - merge by field
  return 'merge';
}

async function mergeRecords(
  local: Record<string, unknown>,
  server: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const merged = { ...server };
  
  // For each field, take the most recently updated value
  for (const key of Object.keys(local)) {
    if (key === 'id' || key === 'createdAt') continue;
    
    // If local has the field and server doesn't, use local
    if (local[key] !== undefined && server[key] === undefined) {
      merged[key] = local[key];
    }
  }
  
  merged.updatedAt = Date.now();
  return merged;
}
```

---

## IndexedDB Storage

### Database Structure

```typescript
// Using idb-keyval for simplified IndexedDB access

// Key patterns:
// sync_queue_{uuid}     - Pending sync items
// dead_letter_{uuid}    - Failed items for manual review
// cache_{hash}          - API response cache
// offline_content_{id}  - Cached content for offline use
```

### Storage Operations

```typescript
import { set, get, del, keys, clear } from 'idb-keyval';

// Store offline content
export async function cacheForOffline(
  contentId: string, 
  content: unknown
): Promise<void> {
  await set(`offline_content_${contentId}`, {
    content,
    cachedAt: Date.now()
  });
}

// Retrieve offline content
export async function getOfflineContent(contentId: string): Promise<unknown | null> {
  const cached = await get(`offline_content_${contentId}`);
  return cached?.content ?? null;
}

// Get sync queue status
export async function getSyncQueueStatus(): Promise<{
  pending: number;
  failed: number;
  oldestPending: number | null;
}> {
  const allKeys = await keys();
  
  const pendingKeys = allKeys.filter(k => 
    typeof k === 'string' && k.startsWith('sync_queue_')
  );
  const failedKeys = allKeys.filter(k => 
    typeof k === 'string' && k.startsWith('dead_letter_')
  );
  
  let oldestPending: number | null = null;
  for (const key of pendingKeys) {
    const item = await get(key) as SyncQueueItem;
    if (!oldestPending || item.timestamp < oldestPending) {
      oldestPending = item.timestamp;
    }
  }
  
  return {
    pending: pendingKeys.length,
    failed: failedKeys.length,
    oldestPending
  };
}
```

---

## Real-time Subscriptions

### Supabase Realtime Integration

```typescript
// src/lib/supabase/sync.ts
import { supabase } from './client';

export function subscribeToChanges(userId: string) {
  // Subscribe to quiz session updates
  const quizChannel = supabase
    .channel('quiz_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_sessions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        handleRemoteChange('quiz_sessions', payload);
      }
    )
    .subscribe();

  // Subscribe to notes updates
  const notesChannel = supabase
    .channel('notes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        handleRemoteChange('notes', payload);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    quizChannel.unsubscribe();
    notesChannel.unsubscribe();
  };
}

function handleRemoteChange(
  table: string, 
  payload: { eventType: string; new: unknown; old: unknown }
) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  switch (eventType) {
    case 'INSERT':
      // Add to local store if not already present
      syncToLocalStore(table, newRecord, 'insert');
      break;
    case 'UPDATE':
      // Update local store
      syncToLocalStore(table, newRecord, 'update');
      break;
    case 'DELETE':
      // Remove from local store
      syncToLocalStore(table, oldRecord, 'delete');
      break;
  }
}
```

---

## Network Detection

### Online/Offline Handling

```typescript
// src/lib/supabase/sync.ts
let isOnline = navigator.onLine;

export function initNetworkDetection() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

async function handleOnline() {
  isOnline = true;
  console.log('[Sync] Network restored, processing queue...');
  
  // Process pending sync queue
  const result = await processSyncQueue();
  
  // Notify user of sync results
  if (result.succeeded > 0) {
    showSyncNotification(`Synced ${result.succeeded} changes`);
  }
  if (result.failed > 0) {
    showSyncNotification(`${result.failed} changes failed to sync`, 'warning');
  }
}

function handleOffline() {
  isOnline = false;
  console.log('[Sync] Network lost, queuing changes locally...');
  showSyncNotification('Working offline - changes will sync when reconnected');
}
```

### Sync Indicator Component

```typescript
// src/components/auth/SyncIndicator.tsx
import { useEffect, useState } from 'react';
import { getSyncQueueStatus } from '@/lib/supabase/sync';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export function SyncIndicator() {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    pending: number;
    isSyncing: boolean;
  }>({
    isOnline: navigator.onLine,
    pending: 0,
    isSyncing: false
  });

  useEffect(() => {
    const updateStatus = async () => {
      const queueStatus = await getSyncQueueStatus();
      setStatus(prev => ({
        ...prev,
        pending: queueStatus.pending
      }));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status.isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : status.isOnline ? (
        <Cloud className="h-4 w-4 text-green-500" />
      ) : (
        <CloudOff className="h-4 w-4 text-yellow-500" />
      )}
      
      {status.pending > 0 && (
        <span className="text-xs">
          {status.pending} pending
        </span>
      )}
    </div>
  );
}
```

---

## Implementation Details

### Sync Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYNC FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   User Action                                                                   │
│       │                                                                         │
│       ▼                                                                         │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │  1. Update Zustand Store (Optimistic)                              │        │
│   │     useQuizStore.getState().completeSession(sessionData)          │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│       │                                                                         │
│       ▼                                                                         │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │  2. Persist to localStorage (Automatic via Zustand persist)        │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│       │                                                                         │
│       ▼                                                                         │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │  3. Add to Sync Queue (IndexedDB)                                  │        │
│   │     await addToSyncQueue({                                         │        │
│   │       operation: 'insert',                                         │        │
│   │       table: 'quiz_sessions',                                      │        │
│   │       data: sessionData                                            │        │
│   │     })                                                             │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│       │                                                                         │
│       ├────────────────┬────────────────┐                                       │
│       │                │                │                                       │
│    Online?          Online           Offline                                    │
│       │                │                │                                       │
│       ▼                ▼                ▼                                       │
│   ┌────────────────────────┐   ┌────────────────────────┐                      │
│   │ 4a. Process Queue      │   │ 4b. Queue remains      │                      │
│   │     Immediately        │   │     in IndexedDB       │                      │
│   └────────────────────────┘   └────────────────────────┘                      │
│       │                                │                                        │
│       ▼                                │                                        │
│   ┌────────────────────────┐           │                                        │
│   │ 5. Supabase Insert     │           │                                        │
│   │    await supabase      │           │                                        │
│   │      .from('...')      │           │                                        │
│   │      .insert(data)     │           │                                        │
│   └────────────────────────┘           │                                        │
│       │                                │                                        │
│       ├────────────────┬───────────────┤                                        │
│       │                │               │                                        │
│    Success          Failed        Network Restored                              │
│       │                │               │                                        │
│       ▼                ▼               ▼                                        │
│   ┌──────────┐   ┌──────────┐   ┌──────────────────────┐                       │
│   │ Remove   │   │ Retry or │   │ Process entire queue │                       │
│   │ from     │   │ Dead     │   │ (steps 4a onwards)   │                       │
│   │ queue    │   │ letter   │   └──────────────────────┘                       │
│   └──────────┘   └──────────┘                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Error Recovery

```typescript
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  attempt: number = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      throw error;
    }
    
    await new Promise(resolve => 
      setTimeout(resolve, RETRY_DELAYS[attempt])
    );
    
    return retryWithBackoff(operation, attempt + 1);
  }
}
```

### Manual Sync Trigger

```typescript
export async function forceSyncNow(): Promise<SyncResult> {
  if (!navigator.onLine) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      pending: await getSyncQueueStatus().then(s => s.pending),
      error: 'Cannot sync while offline'
    };
  }
  
  return processSyncQueue();
}
```

---

## Summary

The Quietude sync mechanism provides:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Offline-first | IndexedDB queue | Works without network |
| Optimistic updates | Immediate local write | Instant UI feedback |
| Conflict resolution | Last-write-wins | Deterministic merging |
| Auto-retry | Exponential backoff | Resilient sync |
| Real-time | Supabase subscriptions | Multi-device sync |
| Status visibility | SyncIndicator component | User awareness |

---

**Related Documentation:**
- [Database Schema](./DATABASE_SCHEMA.md) - Table structures
- [State Management](./STATE_MANAGEMENT.md) - Store integration
- [PWA Features](./PWA_FEATURES.md) - Offline capabilities

---

<div align="center">
  <sub>Seamless synchronization for uninterrupted learning</sub>
</div>
