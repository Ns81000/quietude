import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  name: string | null;
  email: string | null;
  studyField: string | null;
  learnStyle: string | null;
  studyTime: string | null;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  setProfile: (profile: Partial<UserStore>) => void;
  clear: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: null,
      email: null,
      studyField: null,
      learnStyle: null,
      studyTime: null,
      isOnboarded: false,
      isAuthenticated: false,
      setProfile: (profile) => set(profile),
      clear: () =>
        set({
          name: null,
          email: null,
          studyField: null,
          learnStyle: null,
          studyTime: null,
          isOnboarded: false,
          isAuthenticated: false,
        }),
    }),
    { name: 'quietude:user' }
  )
);
