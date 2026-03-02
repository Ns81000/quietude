import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sendOTP,
  verifyOTP,
  validateSession,
  logout as authLogout,
  getStoredSession,
  isFirebaseConfigured,
  forceSync,
  processSyncQueue,
  clearSyncQueue,
  type SyncStatus,
  subscribeSyncStatus,
} from '@/lib/firebase';
import { useUserStore } from './user';
import { usePathsStore } from './paths';
import { useSessionsStore } from './sessions';
import { useNotesStore } from './notes';

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
              sessionExpiresAt: null, // Firebase sessions don't expire like Supabase
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
        
        // Firebase sessions don't need manual refresh - handled automatically
        
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
        
        // NOTE: We intentionally do NOT clear known_user on logout
        // This allows the device to remember the user's onboarding status
        // and avoids re-asking onboarding questions on re-login
        
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
        
        if (isValid && session.userId && navigator.onLine && isFirebaseConfigured()) {
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
