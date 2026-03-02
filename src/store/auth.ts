import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sendOTP,
  verifyOTP,
  validateSession,
  refreshSession,
  logout as authLogout,
  getStoredSession,
  getUserProfile,
  updateUserProfile,
  type StoredSession,
} from '@/lib/supabase/auth';
import { useUserStore } from './user';
import { usePathsStore } from './paths';
import { useSessionsStore } from './sessions';
import { useNotesStore } from './notes';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  forceSync,
  processSyncQueue,
  fetchAllUserData,
  clearSyncQueue,
  type SyncStatus,
  subscribeSyncStatus,
} from '@/lib/supabase/sync';

// Known user key - same as in AuthProvider
const KNOWN_USER_KEY = 'quietude:known_user';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  sessionExpiresAt: string | null;
  syncStatus: SyncStatus;
  error: string | null;
  
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; userId?: string; error?: string }>;
  validateAndRefreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setSyncStatus: (status: SyncStatus) => void;
  
  initialize: () => Promise<void>;
  syncAllData: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: true,
      userId: null,
      email: null,
      sessionExpiresAt: null,
      syncStatus: 'idle',
      error: null,

      sendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await sendOTP(email);
          set({ isLoading: false });
          
          if (!result.success) {
            set({ error: result.error });
          }
          
          return result;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to send code';
          set({ isLoading: false, error });
          return { success: false, error };
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await verifyOTP(email, otp);
          
          if (result.success && result.userId) {
            set({
              isAuthenticated: true,
              isLoading: false,
              userId: result.userId,
              email,
              sessionExpiresAt: getStoredSession()?.expiresAt || null,
            });
            
            return { success: true, userId: result.userId };
          } else {
            set({ isLoading: false, error: result.error });
            return { success: false, error: result.error };
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Verification failed';
          set({ isLoading: false, error });
          return { success: false, error };
        }
      },

      validateAndRefreshSession: async () => {
        const result = await validateSession();
        
        if (!result.valid) {
          set({
            isAuthenticated: false,
            userId: null,
            email: null,
            sessionExpiresAt: null,
          });
          return false;
        }
        
        if (result.needsRefresh) {
          await refreshSession();
          const newSession = getStoredSession();
          if (newSession) {
            set({ sessionExpiresAt: newSession.expiresAt });
          }
        }
        
        set({
          isAuthenticated: true,
          userId: result.userId || null,
          email: result.email || null,
        });
        
        return true;
      },

      logout: async () => {
        const { userId, syncAllData } = get();
        
        set({ syncStatus: 'syncing' });
        
        if (userId) {
          try {
            await syncAllData();
          } catch (err) {
            console.warn('[Auth] Failed to sync before logout:', err);
          }
        }
        
        await authLogout();
        
        // Clear all user data stores to prevent data bleeding between accounts
        useUserStore.getState().clear();
        usePathsStore.getState().clearAll();
        useSessionsStore.getState().clearAll();
        useNotesStore.getState().clearAll();
        
        // Clear sync queue to prevent old user's pending operations from syncing
        await clearSyncQueue();
        
        // Clear known user on logout
        localStorage.removeItem(KNOWN_USER_KEY);
        
        set({
          isAuthenticated: false,
          userId: null,
          email: null,
          sessionExpiresAt: null,
          syncStatus: 'idle',
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),

      initialize: async () => {
        set({ isLoading: true });
        
        const session = getStoredSession();
        
        if (!session) {
          set({
            isLoading: false,
            isAuthenticated: false,
            userId: null,
            email: null,
          });
          return;
        }
        
        const isValid = await get().validateAndRefreshSession();
        
        if (isValid && session.userId && navigator.onLine && isSupabaseConfigured()) {
          processSyncQueue();
        }
        
        set({ isLoading: false });
      },

      syncAllData: async () => {
        const { userId } = get();
        if (!userId) return false;
        
        set({ syncStatus: 'syncing' });
        
        try {
          const success = await forceSync(userId);
          set({ syncStatus: success ? 'idle' : 'error' });
          return success;
        } catch {
          set({ syncStatus: 'error' });
          return false;
        }
      },
    }),
    {
      name: 'quietude:auth-state',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        email: state.email,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  subscribeSyncStatus((status) => {
    useAuthStore.getState().setSyncStatus(status);
  });
}
