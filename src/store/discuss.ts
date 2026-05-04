import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DiscussionBlock {
  id: string;
  type: 'text' | 'yes_no' | 'choice' | 'text_input' | 'confidence' | 'fill_blank' | 'true_false' | 'rating' | 'sorting' | 'summary';
  content?: string;
  question?: string;
  statement?: string;
  options?: string[];
  correctAnswer?: number | boolean | string; // Store correct answer for validation
  blankSentence?: string;
  blankAnswer?: string;
  sortItems?: string[];
  correctOrder?: number[];
  summaryData?: {
    strengths: string[];
    areasToExplore: string[];
    closingThought: string;
  };
  userAnswer?: string | number | boolean;
  isAnswered: boolean;
  timestamp: string;
}

export interface Discussion {
  id: string;
  topicId: string;
  pathId: string;
  subject: string;
  topicTitle: string;
  blocks: DiscussionBlock[];
  createdAt: string;
  completedAt: string | null;
}

interface DiscussStore {
  discussions: Discussion[];
  setDiscussions: (discussions: Discussion[]) => void;
  addDiscussion: (d: Discussion) => void;
  updateDiscussion: (id: string, updates: Partial<Discussion>) => void;
  updateBlocks: (id: string, blocks: DiscussionBlock[]) => void;
  deleteDiscussion: (id: string) => void;
  clearAll: () => void;
}

export const useDiscussStore = create<DiscussStore>()(
  persist(
    (set, get) => ({
      discussions: [],

      setDiscussions: (discussions) => set({ discussions }),

      addDiscussion: (d) => {
        set((s) => ({ discussions: [d, ...s.discussions] }));
      },

      updateDiscussion: (id, updates) => {
        set((s) => ({
          discussions: s.discussions.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      updateBlocks: (id, blocks) => {
        set((s) => ({
          discussions: s.discussions.map((d) =>
            d.id === id ? { ...d, blocks } : d
          ),
        }));
      },

      deleteDiscussion: (id) => {
        set((s) => ({
          discussions: s.discussions.filter((d) => d.id !== id),
        }));
      },

      clearAll: () => set({ discussions: [] }),
    }),
    {
      name: 'quietude:discussions',
    }
  )
);
