import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flashcard, FlashcardDeck, FlashcardSession } from '@/types/flashcard';

interface FlashcardsStore {
  decks: FlashcardDeck[];
  cards: Flashcard[];
  currentSession: FlashcardSession | null;
  isGenerating: boolean;
  error: string | null;

  // Deck actions
  addDeck: (deck: FlashcardDeck) => void;
  updateDeck: (id: string, updates: Partial<FlashcardDeck>) => void;
  deleteDeck: (id: string) => void;
  getDeckById: (id: string) => FlashcardDeck | undefined;
  getDecksByTopic: (topicId: string) => FlashcardDeck[];
  getDecksByPath: (pathId: string) => FlashcardDeck[];

  // Card actions
  addCard: (card: Flashcard) => void;
  addCards: (cards: Flashcard[]) => void;
  updateCard: (id: string, updates: Partial<Flashcard>) => void;
  deleteCard: (id: string) => void;
  getCardById: (id: string) => Flashcard | undefined;
  getCardsByDeck: (deckId: string) => Flashcard[];
  getDueCards: (deckId: string) => Flashcard[];

  // Session actions
  startSession: (session: FlashcardSession) => void;
  updateSession: (updates: Partial<FlashcardSession>) => void;
  endSession: () => void;

  // State actions
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

export const useFlashcardsStore = create<FlashcardsStore>()(
  persist(
    (set, get) => ({
      decks: [],
      cards: [],
      currentSession: null,
      isGenerating: false,
      error: null,

      // Deck actions
      addDeck: (deck) =>
        set((state) => ({
          decks: [deck, ...state.decks],
        })),

      updateDeck: (id, updates) =>
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),

      deleteDeck: (id) =>
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
          cards: state.cards.filter((c) => c.deckId !== id),
        })),

      getDeckById: (id) => {
        const { decks } = get();
        return decks.find((d) => d.id === id);
      },

      getDecksByTopic: (topicId) => {
        const { decks } = get();
        return decks.filter((d) => d.topicId === topicId);
      },

      getDecksByPath: (pathId) => {
        const { decks } = get();
        return decks.filter((d) => d.pathId === pathId);
      },

      // Card actions
      addCard: (card) =>
        set((state) => ({
          cards: [card, ...state.cards],
        })),

      addCards: (cards) =>
        set((state) => ({
          cards: [...cards, ...state.cards],
        })),

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),

      getCardById: (id) => {
        const { cards } = get();
        return cards.find((c) => c.id === id);
      },

      getCardsByDeck: (deckId) => {
        const { cards } = get();
        return cards.filter((c) => c.deckId === deckId);
      },

      getDueCards: (deckId) => {
        const { cards } = get();
        const now = new Date().toISOString();
        return cards.filter(
          (c) => c.deckId === deckId && c.nextReview <= now
        );
      },

      // Session actions
      startSession: (session) => set({ currentSession: session }),

      updateSession: (updates) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...updates }
            : null,
        })),

      endSession: () => set({ currentSession: null }),

      // State actions
      setGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),
      clearAll: () =>
        set({
          decks: [],
          cards: [],
          currentSession: null,
          isGenerating: false,
          error: null,
        }),
    }),
    {
      name: 'quietude:flashcards',
    }
  )
);

// Selectors
export const selectDeckCount = (state: FlashcardsStore) => state.decks.length;
export const selectCardCount = (state: FlashcardsStore) => state.cards.length;
export const selectDueCardCount = (state: FlashcardsStore) => {
  const now = new Date().toISOString();
  return state.cards.filter((c) => c.nextReview <= now).length;
};
