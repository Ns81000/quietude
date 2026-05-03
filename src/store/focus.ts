import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Howl } from 'howler';

export type FocusStep = 'time' | 'audio' | 'session';

interface FocusStore {
  // Session configuration
  duration: number; // in seconds
  selectedSounds: string[]; // sound IDs
  soundVolumes: Record<string, number>; // per-sound volume (0-1)
  globalVolume: number; // master volume (0-1)
  
  // Session state
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  startTime: number | null;
  
  // UI state
  currentStep: FocusStep;
  selectedCategory: string;
  selectedCollection: string | null;
  
  // Audio state
  loadedSounds: Record<string, Howl>;
  loadingStates: Record<string, boolean>;
  
  // Actions - Configuration
  setDuration: (seconds: number) => void;
  selectSound: (id: string) => void;
  unselectSound: (id: string) => void;
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, volume: number) => void;
  setGlobalVolume: (volume: number) => void;
  
  // Actions - Session control
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  tick: () => void; // Called every second by timer
  
  // Actions - Navigation
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: FocusStep) => void;
  
  // Actions - Audio management
  loadCollection: (collectionId: string) => void;
  setCategory: (categoryId: string) => void;
  clearSounds: () => void;
  
  // Actions - Persistence
  reset: () => void;
}

const STORAGE_KEY = 'quietude:focus';

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      // Initial state
      duration: 25 * 60, // 25 minutes default
      selectedSounds: [],
      soundVolumes: {},
      globalVolume: 0.7,
      
      isActive: false,
      isPaused: false,
      remainingTime: 25 * 60,
      startTime: null,
      
      currentStep: 'time',
      selectedCategory: 'nature',
      selectedCollection: null,
      
      loadedSounds: {},
      loadingStates: {},
      
      // Configuration actions
      setDuration: (seconds) => set({ 
        duration: seconds,
        remainingTime: seconds 
      }),
      
      selectSound: (id) => set((state) => ({
        selectedSounds: state.selectedSounds.includes(id) 
          ? state.selectedSounds 
          : [...state.selectedSounds, id],
        soundVolumes: {
          ...state.soundVolumes,
          [id]: state.soundVolumes[id] ?? 0.5
        }
      })),
      
      unselectSound: (id) => set((state) => ({
        selectedSounds: state.selectedSounds.filter(s => s !== id)
      })),
      
      toggleSound: (id) => {
        const state = get();
        if (state.selectedSounds.includes(id)) {
          state.unselectSound(id);
        } else {
          state.selectSound(id);
        }
      },
      
      setSoundVolume: (id, volume) => set((state) => ({
        soundVolumes: {
          ...state.soundVolumes,
          [id]: Math.max(0, Math.min(1, volume))
        }
      })),
      
      setGlobalVolume: (volume) => set({ 
        globalVolume: Math.max(0, Math.min(1, volume)) 
      }),
      
      // Session control actions
      startSession: () => set((state) => ({
        isActive: true,
        isPaused: false,
        startTime: Date.now(),
        remainingTime: state.duration
      })),
      
      pauseSession: () => set({ isPaused: true }),
      
      resumeSession: () => set({ isPaused: false }),
      
      endSession: () => set((state) => ({
        isActive: false,
        isPaused: false,
        remainingTime: state.duration,
        startTime: null,
        currentStep: 'time'
      })),
      
      tick: () => set((state) => {
        if (!state.isActive || state.isPaused) return state;
        
        const newRemaining = state.remainingTime - 1;
        
        if (newRemaining <= 0) {
          // Session complete
          return {
            isActive: false,
            isPaused: false,
            remainingTime: 0
          };
        }
        
        return { remainingTime: newRemaining };
      }),
      
      // Navigation actions
      nextStep: () => set((state) => {
        const steps: FocusStep[] = ['time', 'audio', 'session'];
        const currentIndex = steps.indexOf(state.currentStep);
        const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
        return { currentStep: steps[nextIndex] };
      }),
      
      previousStep: () => set((state) => {
        const steps: FocusStep[] = ['time', 'audio', 'session'];
        const currentIndex = steps.indexOf(state.currentStep);
        const prevIndex = Math.max(currentIndex - 1, 0);
        return { currentStep: steps[prevIndex] };
      }),
      
      setStep: (step) => set({ currentStep: step }),
      
      // Audio management actions
      loadCollection: (collectionId) => set({ 
        selectedCollection: collectionId 
      }),
      
      setCategory: (categoryId) => set({ 
        selectedCategory: categoryId 
      }),
      
      clearSounds: () => set({ 
        selectedSounds: [],
        soundVolumes: {}
      }),
      
      // Reset
      reset: () => set({
        duration: 25 * 60,
        selectedSounds: [],
        soundVolumes: {},
        globalVolume: 0.7,
        isActive: false,
        isPaused: false,
        remainingTime: 25 * 60,
        startTime: null,
        currentStep: 'time',
        selectedCategory: 'nature',
        selectedCollection: null,
        loadedSounds: {},
        loadingStates: {}
      })
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        // Only persist user preferences, not session state
        duration: state.duration,
        selectedSounds: state.selectedSounds,
        soundVolumes: state.soundVolumes,
        globalVolume: state.globalVolume,
        selectedCategory: state.selectedCategory,
        selectedCollection: state.selectedCollection
      })
    }
  )
);
