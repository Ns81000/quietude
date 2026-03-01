import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MoodTheme } from '@/lib/theme';
import { applyTheme, persistMood } from '@/lib/theme';

interface UIStore {
  activeMood: MoodTheme | null;
  moodSelectorOpen: boolean;
  setMood: (mood: MoodTheme | null) => void;
  openMoodSelector: () => void;
  closeMoodSelector: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeMood: null,
      moodSelectorOpen: false,
      setMood: (mood) => {
        persistMood(mood);
        if (mood) applyTheme(mood);
        set({ activeMood: mood });
      },
      openMoodSelector: () => set({ moodSelectorOpen: true }),
      closeMoodSelector: () => set({ moodSelectorOpen: false }),
    }),
    { name: 'quietude:ui', partialize: (s) => ({ activeMood: s.activeMood }) }
  )
);
