import { useEffect, useRef, useState, createContext, useContext, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { useUIStore } from '@/store/ui';
import { isSupabaseConfigured } from '@/lib/supabase/client';
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
} from '@/lib/supabase/sync';
import { getUserProfile, updateUserProfile } from '@/lib/supabase/auth';

// Data version - increment this to force a reset of all local data for existing users
// This is useful when breaking changes are made to the data structure
const DATA_VERSION = 2; // Bumped from 1 to 2 to clear old buggy data
const DATA_VERSION_KEY = 'quietude:data_version';

function checkAndResetDataVersion(): boolean {
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
  const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
  
  if (currentVersion < DATA_VERSION) {
    console.log(`[DataVersion] Upgrading from v${currentVersion} to v${DATA_VERSION}, clearing local data...`);
    
    // Clear all localStorage keys for this app
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('quietude:') || 
      key.startsWith('paths-') ||
      key.startsWith('sessions-') ||
      key.startsWith('notes-') ||
      key.startsWith('user-') ||
      key.startsWith('auth-') ||
      key.startsWith('ui-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear IndexedDB sync queue
    clearSyncQueue().catch(console.error);
    
    // Set new version
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION.toString());
    
    console.log(`[DataVersion] Cleared ${keysToRemove.length} localStorage keys`);
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
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
      // Check data version and clear old data if needed
      const wasReset = checkAndResetDataVersion();
      if (wasReset) {
        // Force page reload to reinitialize stores with clean state
        window.location.reload();
        return;
      }
      
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
      
      if (!isSupabaseConfigured() || !navigator.onLine) {
        syncedRef.current = true;
        return;
      }
      
      try {
        const profile = await getUserProfile(userId);
        const localIsOnboarded = userStore.isOnboarded;
        
        if (profile) {
          // If locally onboarded but server says not, the local state wins
          // and we should sync it to the server
          const shouldBeOnboarded = localIsOnboarded || profile.is_onboarded;
          
          userStore.setProfile({
            name: profile.name || userStore.name || null,
            email: profile.email,
            studyField: profile.study_field || userStore.studyField || null,
            learnStyle: profile.learn_style || userStore.learnStyle || null,
            studyTime: profile.study_time || userStore.studyTime || null,
            isOnboarded: shouldBeOnboarded,
            isAuthenticated: true,
          });
          
          // Sync local onboarded state to server if it wasn't saved before
          if (localIsOnboarded && !profile.is_onboarded) {
            updateUserProfile(userId, {
              name: userStore.name,
              study_field: userStore.studyField,
              learn_style: userStore.learnStyle,
              study_time: userStore.studyTime,
              is_onboarded: true,
            });
          }
          
          if (profile.theme_mood) {
            uiStore.setMood(profile.theme_mood as any);
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
    
    const unsubPaths = usePathsStore.subscribe((state, prevState) => {
      if (state.paths !== prevState.paths) {
        const newPaths = state.paths.filter(
          p => !prevState.paths.find(pp => pp.id === p.id)
        );
        const updatedPaths = state.paths.filter(p => {
          const prev = prevState.paths.find(pp => pp.id === p.id);
          return prev && JSON.stringify(p) !== JSON.stringify(prev);
        });
        
        [...newPaths, ...updatedPaths].forEach(path => {
          syncLearningPath(path, userId);
        });
        
        const deletedPaths = prevState.paths.filter(
          p => !state.paths.find(sp => sp.id === p.id)
        );
        deletedPaths.forEach(path => {
          syncDelete('learning_paths', path.id);
          // Clean up any orphaned quiz sessions in the sync queue for this path
          removeFromSyncQueueByPathId(path.id);
        });
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubSessions = useSessionsStore.subscribe((state, prevState) => {
      if (state.sessions !== prevState.sessions) {
        const newSessions = state.sessions.filter(
          s => !prevState.sessions.find(ps => ps.id === s.id)
        );
        const updatedSessions = state.sessions.filter(s => {
          const prev = prevState.sessions.find(ps => ps.id === s.id);
          return prev && JSON.stringify(s) !== JSON.stringify(prev);
        });
        
        [...newSessions, ...updatedSessions].forEach(session => {
          syncQuizSession(session, userId);
        });
        
        const deletedSessions = prevState.sessions.filter(
          s => !state.sessions.find(ss => ss.id === s.id)
        );
        deletedSessions.forEach(session => {
          syncDelete('quiz_sessions', session.id);
        });
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubNotes = useNotesStore.subscribe((state, prevState) => {
      if (state.notes !== prevState.notes) {
        const newNotes = state.notes.filter(
          n => !prevState.notes.find(pn => pn.id === n.id)
        );
        const updatedNotes = state.notes.filter(n => {
          const prev = prevState.notes.find(pn => pn.id === n.id);
          return prev && JSON.stringify(n) !== JSON.stringify(prev);
        });
        
        [...newNotes, ...updatedNotes].forEach(note => {
          syncNote(note, userId);
        });
        
        const deletedNotes = prevState.notes.filter(
          n => !state.notes.find(sn => sn.id === n.id)
        );
        deletedNotes.forEach(note => {
          syncDelete('notes', note.id);
        });
        
        getPendingSyncCount().then(setPendingSyncCount);
      }
    });
    
    const unsubUser = useUserStore.subscribe((state, prevState) => {
      const profileChanged = 
        state.name !== prevState.name ||
        state.studyField !== prevState.studyField ||
        state.learnStyle !== prevState.learnStyle ||
        state.studyTime !== prevState.studyTime ||
        state.isOnboarded !== prevState.isOnboarded;
      
      if (profileChanged && isSupabaseConfigured()) {
        updateUserProfile(userId, {
          name: state.name,
          study_field: state.studyField,
          learn_style: state.learnStyle,
          study_time: state.studyTime,
          is_onboarded: state.isOnboarded,
        });
      }
    });
    
    const unsubUI = useUIStore.subscribe((state, prevState) => {
      if (state.activeMood !== prevState.activeMood && isSupabaseConfigured()) {
        updateUserProfile(userId, {
          theme_mood: state.activeMood,
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
