import { useEffect, useRef, useState, createContext, useContext, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { useUIStore } from '@/store/ui';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { 
  fetchAllUserData, 
  syncLearningPath, 
  syncQuizSession, 
  syncNote,
  syncDelete,
  processSyncQueue,
  getLastSyncTime,
  getPendingSyncCount,
  clearSyncQueue,
  removeFromSyncQueueByPathId,
  clearAllIndexedDB,
} from '@/lib/firebase/sync';
import { getUserProfile, updateUserProfile } from '@/lib/firebase/auth';
import { clearAllCaches } from '@/lib/pwa/sw-register';

// Data version - increment this to force a reset of all local data for existing users
// This is useful when breaking changes are made to the data structure
// v9: Firebase migration fixes + fresh start for all users
// v10: Preserve known_user during reset so onboarding status survives
// v11: Fix logout data deletion bug - ensures cross-device sync works
const DATA_VERSION = 12;
const DATA_VERSION_KEY = 'quietude:data_version';

// KnownUser types for local storage of remembered emails
export interface KnownUser {
  email: string;
  name?: string;
  lastLogin?: string;
}

// Get known user from localStorage
export function getKnownUser(email: string): KnownUser | null {
  try {
    const stored = localStorage.getItem(`quietude:known_user:${email}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Set known user in localStorage
export function setKnownUser(email: string, user: KnownUser): void {
  try {
    localStorage.setItem(`quietude:known_user:${email}`, JSON.stringify(user));
  } catch {
    console.warn('[KnownUser] Failed to save to localStorage');
  }
}

// Alias functions for compatibility
export const getKnownUserSync = getKnownUser;
export const setKnownUserSync = setKnownUser;

// Async versions with fallback
export async function getKnownUserWithFallback(email: string): Promise<KnownUser | null> {
  return getKnownUser(email);
}

export async function setKnownUserWithBackup(email: string, user: KnownUser): Promise<void> {
  setKnownUser(email, user);
}

// Get all known users
export function getAllKnownUsers(): KnownUser[] {
  const users: KnownUser[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('quietude:known_user:')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          users.push(JSON.parse(stored));
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return users;
}

export const getAllKnownUsersSync = getAllKnownUsers;

async function checkAndResetDataVersion(): Promise<boolean> {
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
  const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
  
  if (currentVersion < DATA_VERSION) {
    console.log(`[DataVersion] Upgrading from v${currentVersion} to v${DATA_VERSION}, clearing data for fresh start...`);
    
    // v9: Clear app data but PRESERVE known_user keys (onboarding status backup)
    // This allows returning users to skip onboarding even after data reset
    
    // Clear localStorage keys for app data, but KEEP known_user for onboarding fallback
    const keysToRemove = Object.keys(localStorage).filter(key => 
      (key.startsWith('quietude:') && !key.startsWith('quietude:known_user:')) || 
      key.startsWith('paths-') ||
      key.startsWith('sessions-') ||
      key.startsWith('notes-') ||
      key.startsWith('user-') ||
      key.startsWith('auth-') ||
      key.startsWith('ui-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear IndexedDB (app data) - but known_user is in localStorage, not IndexedDB
    await clearAllIndexedDB();
    
    // Clear all service worker caches
    await clearAllCaches();
    
    // Set new version AFTER clearing (so quietude: prefix removal doesn't clear it)
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION.toString());
    
    console.log(`[DataVersion] Reset complete: cleared ${keysToRemove.length} localStorage keys (preserved known_user), cleared IndexedDB and caches`);
    return true; // Data was reset
  }
  
  return false; // No reset needed
}

interface AuthContextValue {
  isInitialized: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime: Date | null;
}

const AuthContext = createContext<AuthContextValue>({
  isInitialized: false,
  isOnline: true,
  pendingSyncCount: 0,
  lastSyncTime: null,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { initialize, isAuthenticated, userId, email } = useAuthStore();
  const userStore = useUserStore();
  const pathsStore = usePathsStore();
  const sessionsStore = useSessionsStore();
  const notesStore = useNotesStore();
  const uiStore = useUIStore();
  
  const syncedRef = useRef(false);
  const setupCompleteRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Bug 2 fix: Listen for storage changes from other tabs (account switches)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quietude:auth-state' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          const currentUserId = useAuthStore.getState().userId;
          
          // If another tab changed the user, reload this tab to sync state
          if (newState.state?.userId !== currentUserId) {
            console.log('[AuthProvider] Account change detected in another tab, reloading...');
            window.location.reload();
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reset refs and cleanup subscriptions when userId changes (logout/account switch)
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      // User changed - reset sync state
      if (prevUserIdRef.current !== null && userId !== prevUserIdRef.current) {
        console.log('[AuthProvider] User changed, resetting sync state');
        syncedRef.current = false;
        setupCompleteRef.current = false;
        
        // Cleanup old subscriptions
        unsubscribersRef.current.forEach(unsub => unsub());
        unsubscribersRef.current = [];
      }
      prevUserIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      // Check data version and clear old data if needed (now async)
      const wasReset = await checkAndResetDataVersion();
      // No reload needed - stores will initialize fresh with empty state
      
      await initialize();
      setIsInitialized(true);
      
      const lastSync = await getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
      
      const pending = await getPendingSyncCount();
      setPendingSyncCount(pending);
    };
    
    init();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !userId || syncedRef.current) {
      return;
    }
    
    const syncFromServer = async () => {
      // Check if sync was already done during login (in Verify.tsx)
      const syncAlreadyDone = sessionStorage.getItem('quietude:sync-done');
      if (syncAlreadyDone) {
        sessionStorage.removeItem('quietude:sync-done');
        syncedRef.current = true;
        return;
      }
      
      if (!isFirebaseConfigured() || !navigator.onLine) {
        syncedRef.current = true;
        return;
      }
      
      try {
        const profile = await getUserProfile(userId);
        const localIsOnboarded = userStore.isOnboarded;
        
        if (profile) {
          // If locally onboarded but server says not, the local state wins
          // and we should sync it to the server
          const shouldBeOnboarded = localIsOnboarded || profile.isOnboarded;
          
          userStore.setProfile({
            name: profile.name || userStore.name || null,
            email: profile.email,
            studyField: profile.studyField || userStore.studyField || null,
            learnStyle: profile.learnStyle || userStore.learnStyle || null,
            studyTime: profile.studyTime || userStore.studyTime || null,
            isOnboarded: shouldBeOnboarded,
            isAuthenticated: true,
          });
          
          // Sync local onboarded state to server if it wasn't saved before
          if (localIsOnboarded && !profile.isOnboarded) {
            updateUserProfile(userId, {
              name: userStore.name,
              studyField: userStore.studyField,
              learnStyle: userStore.learnStyle,
              studyTime: userStore.studyTime,
              isOnboarded: true,
            });
          }
          
          if (profile.themeMood) {
            uiStore.setMood(profile.themeMood as any);
          }
        } else {
          userStore.setProfile({
            email,
            isAuthenticated: true,
          });
        }
        
        const serverData = await fetchAllUserData(userId);
        
        if (serverData) {
          // ACCOUNT SWITCH DETECTION: Check if local data belongs to a different user
          // by comparing user_id on existing paths (if any exist)
          const existingPaths = usePathsStore.getState().paths;
          const hasLocalDataFromDifferentUser = existingPaths.some(p => p.user_id && p.user_id !== userId);
          
          if (hasLocalDataFromDifferentUser) {
            console.log('[AuthProvider] Detected local data from different user, clearing stores');
            pathsStore.clearAll();
            sessionsStore.clearAll();
            notesStore.clearAll();
          }
          
          // Merge server paths with local - always get fresh state to avoid duplicates
          serverData.paths.forEach(serverPath => {
            const currentPaths = usePathsStore.getState().paths;
            const localPath = currentPaths.find(p => p.id === serverPath.id);
            if (!localPath) {
              pathsStore.addPath(serverPath);
            } else {
              // Update local path with server data (e.g. status, current_topic_id changes)
              pathsStore.updatePath(serverPath.id, serverPath);
            }
          });
          
          const serverPathIds = new Set(serverData.paths.map(p => p.id));
          const currentPathsAfterMerge = usePathsStore.getState().paths;
          currentPathsAfterMerge.forEach(localPath => {
            if (!serverPathIds.has(localPath.id)) {
              syncLearningPath(localPath, userId);
            }
          });
          
          // Merge server sessions with local - always get fresh state to avoid duplicates
          serverData.sessions.forEach(serverSession => {
            const currentSessions = useSessionsStore.getState().sessions;
            const localSession = currentSessions.find(s => s.id === serverSession.id);
            if (!localSession) {
              sessionsStore.addSession(serverSession);
            } else if (serverSession.submitted_at && !localSession.submitted_at) {
              // Server has a completed version but local doesn't — update it
              sessionsStore.updateSession(serverSession.id, serverSession);
            }
          });
          
          const serverSessionIds = new Set(serverData.sessions.map(s => s.id));
          const currentSessionsAfterMerge = useSessionsStore.getState().sessions;
          currentSessionsAfterMerge.forEach(localSession => {
            if (!serverSessionIds.has(localSession.id)) {
              syncQuizSession(localSession, userId);
            }
          });
          
          // Merge server notes with local - always get fresh state to avoid duplicates
          serverData.notes.forEach(serverNote => {
            const currentNotes = useNotesStore.getState().notes;
            const localNote = currentNotes.find(n => n.id === serverNote.id);
            if (!localNote) {
              notesStore.addNote(serverNote);
            }
          });
          
          const serverNoteIds = new Set(serverData.notes.map(n => n.id));
          const currentNotesAfterMerge = useNotesStore.getState().notes;
          currentNotesAfterMerge.forEach(localNote => {
            if (!serverNoteIds.has(localNote.id)) {
              syncNote(localNote, userId);
            }
          });
          
          setLastSyncTime(new Date());
        }
        
        processSyncQueue();
      } catch (err) {
        console.error('[AuthProvider] Sync from server failed:', err);
      }
      
      syncedRef.current = true;
    };
    
    syncFromServer();
  }, [isInitialized, isAuthenticated, userId, email]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !userId || setupCompleteRef.current) {
      return;
    }
    
    setupCompleteRef.current = true;
    
    // Helper to safely sync with error handling
    const safeSync = async (syncFn: () => Promise<void>) => {
      try {
        await syncFn();
      } catch (err) {
        console.error('[AuthProvider] Sync operation failed:', err);
        // Don't throw - allow app to continue working
      }
    };
    
    const unsubPaths = usePathsStore.subscribe((state, prevState) => {
      // CRITICAL: Don't sync deletes during logout (when ALL paths are being cleared)
      // This prevents deleting user data from server during logout
      const isBeingCleared = state.paths.length === 0 && prevState.paths.length > 0;
      
      if (state.paths !== prevState.paths) {
        const newPaths = state.paths.filter(
          p => !prevState.paths.find(pp => pp.id === p.id)
        );
        const updatedPaths = state.paths.filter(p => {
          const prev = prevState.paths.find(pp => pp.id === p.id);
          return prev && JSON.stringify(p) !== JSON.stringify(prev);
        });
        
        [...newPaths, ...updatedPaths].forEach(path => {
          safeSync(() => syncLearningPath(path, userId));
        });
        
        // Only sync deletes if NOT being cleared (logout)
        if (!isBeingCleared) {
          const deletedPaths = prevState.paths.filter(
            p => !state.paths.find(sp => sp.id === p.id)
          );
          deletedPaths.forEach(path => {
            safeSync(() => syncDelete('learning_paths', path.id, userId));
            // Clean up any orphaned quiz sessions in the sync queue for this path
            safeSync(() => removeFromSyncQueueByPathId(path.id));
          });
        } else {
          console.log('[AuthProvider] Paths being cleared (logout), skipping server delete');
        }
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubSessions = useSessionsStore.subscribe((state, prevState) => {
      // CRITICAL: Don't sync deletes during logout (when ALL sessions are being cleared)
      const isBeingCleared = state.sessions.length === 0 && prevState.sessions.length > 0;
      
      if (state.sessions !== prevState.sessions) {
        const newSessions = state.sessions.filter(
          s => !prevState.sessions.find(ps => ps.id === s.id)
        );
        const updatedSessions = state.sessions.filter(s => {
          const prev = prevState.sessions.find(ps => ps.id === s.id);
          return prev && JSON.stringify(s) !== JSON.stringify(prev);
        });
        
        [...newSessions, ...updatedSessions].forEach(session => {
          safeSync(() => syncQuizSession(session, userId));
        });
        
        // Only sync deletes if NOT being cleared (logout)
        if (!isBeingCleared) {
          const deletedSessions = prevState.sessions.filter(
            s => !state.sessions.find(ss => ss.id === s.id)
          );
          deletedSessions.forEach(session => {
            safeSync(() => syncDelete('quiz_sessions', session.id, userId));
          });
        } else {
          console.log('[AuthProvider] Sessions being cleared (logout), skipping server delete');
        }
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubNotes = useNotesStore.subscribe((state, prevState) => {
      // CRITICAL: Don't sync deletes during logout (when ALL notes are being cleared)
      const isBeingCleared = state.notes.length === 0 && prevState.notes.length > 0;
      
      if (state.notes !== prevState.notes) {
        const newNotes = state.notes.filter(
          n => !prevState.notes.find(pn => pn.id === n.id)
        );
        const updatedNotes = state.notes.filter(n => {
          const prev = prevState.notes.find(pn => pn.id === n.id);
          return prev && JSON.stringify(n) !== JSON.stringify(prev);
        });
        
        [...newNotes, ...updatedNotes].forEach(note => {
          safeSync(() => syncNote(note, userId));
        });
        
        // Only sync deletes if NOT being cleared (logout)
        if (!isBeingCleared) {
          const deletedNotes = prevState.notes.filter(
            n => !state.notes.find(sn => sn.id === n.id)
          );
          deletedNotes.forEach(note => {
            safeSync(() => syncDelete('notes', note.id, userId));
          });
        } else {
          console.log('[AuthProvider] Notes being cleared (logout), skipping server delete');
        }
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubUser = useUserStore.subscribe((state, prevState) => {
      // CRITICAL: Don't sync to server during logout (when profile is being cleared)
      // This prevents corrupting server data with isOnboarded: false
      const isBeingCleared = !state.name && !state.studyField && !state.learnStyle && 
                             !state.studyTime && !state.isOnboarded && !state.isAuthenticated;
      if (isBeingCleared) {
        console.log('[AuthProvider] Profile being cleared (logout), skipping server sync');
        return;
      }
      
      const profileChanged = 
        state.name !== prevState.name ||
        state.studyField !== prevState.studyField ||
        state.learnStyle !== prevState.learnStyle ||
        state.studyTime !== prevState.studyTime ||
        state.isOnboarded !== prevState.isOnboarded;
      
      if (profileChanged && isFirebaseConfigured()) {
        updateUserProfile(userId, {
          name: state.name,
          studyField: state.studyField,
          learnStyle: state.learnStyle,
          studyTime: state.studyTime,
          isOnboarded: state.isOnboarded,
        });
      }
    });
    
    const unsubUI = useUIStore.subscribe((state, prevState) => {
      if (state.activeMood !== prevState.activeMood && isFirebaseConfigured()) {
        updateUserProfile(userId, {
          themeMood: state.activeMood,
        });
      }
    });
    
    // Store unsubscribers for cleanup on user change
    unsubscribersRef.current = [unsubPaths, unsubSessions, unsubNotes, unsubUser, unsubUI];
    
    return () => {
      unsubPaths();
      unsubSessions();
      unsubNotes();
      unsubUser();
      unsubUI();
      unsubscribersRef.current = [];
    };
  }, [isInitialized, isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const pending = await getPendingSyncCount();
      if (pending > 0) {
        processSyncQueue();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    
    const interval = setInterval(async () => {
      const pending = await getPendingSyncCount();
      setPendingSyncCount(pending);
      
      if (pending > 0 && navigator.onLine) {
        processSyncQueue();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, userId]);

  const value: AuthContextValue = {
    isInitialized,
    isOnline,
    pendingSyncCount,
    lastSyncTime,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
