import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningPath } from '@/types/quiz';

interface PathsStore {
  paths: LearningPath[];
  activePathId: string | null;

  // Actions
  addPath: (path: LearningPath) => void;
  updatePath: (id: string, updates: Partial<LearningPath>) => void;
  deletePath: (id: string) => void;
  setActivePath: (id: string | null) => void;
  archivePath: (id: string) => void;
  clearAll: () => void;

  // Getters
  getActivePath: () => LearningPath | null;
  getPathById: (id: string) => LearningPath | undefined;
  getActivePaths: () => LearningPath[];
  getArchivedPaths: () => LearningPath[];
}

export const usePathsStore = create<PathsStore>()(
  persist(
    (set, get) => ({
      paths: [],
      activePathId: null,

      addPath: (path) =>
        set((state) => ({
          paths: [path, ...state.paths],
          activePathId: path.id,
        })),

      updatePath: (id, updates) =>
        set((state) => ({
          paths: state.paths.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePath: (id) =>
        set((state) => {
          const newPaths = state.paths.filter((p) => p.id !== id);
          // If deleting active path, set new active to first remaining path
          const newActiveId =
            state.activePathId === id
              ? newPaths.find((p) => p.status === 'active')?.id || null
              : state.activePathId;
          return {
            paths: newPaths,
            activePathId: newActiveId,
          };
        }),

      setActivePath: (id) => set({ activePathId: id }),

      archivePath: (id) =>
        set((state) => ({
          paths: state.paths.map((p) =>
            p.id === id ? { ...p, status: 'archived' as const } : p
          ),
          // If archiving active path, switch to another active one
          activePathId:
            state.activePathId === id
              ? state.paths.find((p) => p.id !== id && p.status === 'active')?.id || null
              : state.activePathId,
        })),

      getActivePath: () => {
        const { paths, activePathId } = get();
        if (!activePathId) return null;
        return paths.find((p) => p.id === activePathId) || null;
      },

      getPathById: (id) => {
        const { paths } = get();
        return paths.find((p) => p.id === id);
      },

      getActivePaths: () => {
        const { paths } = get();
        return paths.filter((p) => p.status === 'active');
      },

      getArchivedPaths: () => {
        const { paths } = get();
        return paths.filter((p) => p.status === 'archived');
      },

      clearAll: () => set({ paths: [], activePathId: null }),
    }),
    {
      name: 'quietude:paths',
    }
  )
);

// Selectors - use these for reactive components
export const selectPathCount = (state: PathsStore) => state.paths.length;
export const selectActivePathCount = (state: PathsStore) =>
  state.paths.filter((p) => p.status === 'active').length;

// Reactive selector for active learning path
export const selectActivePath = (state: PathsStore) => {
  if (!state.activePathId) return null;
  return state.paths.find((p) => p.id === state.activePathId) || null;
};
