/**
 * Flashcard Types
 * 
 * Type definitions for the flashcard system
 */

export type FlashcardDifficulty = 'easy' | 'medium' | 'hard';
export type FlashcardStatus = 'new' | 'learning' | 'known' | 'difficult';
export type PracticeMode = 'classic' | 'speed' | 'spaced';

/**
 * Individual flashcard
 */
export interface Flashcard {
  id: string;
  deckId: string;
  topicId: string;
  pathId: string;
  
  // Content
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  tags: string[];
  
  // Difficulty & Status
  difficulty: FlashcardDifficulty;
  status: FlashcardStatus;
  
  // Spaced Repetition (SM-2 Algorithm)
  easeFactor: number; // 1.3 - 2.5
  interval: number; // days until next review
  repetitions: number; // number of successful reviews
  nextReview: string; // ISO date string
  lastReviewed: string | null; // ISO date string
  
  // Statistics
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  averageResponseTime: number; // milliseconds
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: 'ai' | 'user';
  relatedCards: string[]; // IDs of related cards
}

/**
 * Flashcard deck (collection of cards for a topic)
 */
export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  topicId: string;
  pathId: string;
  subject: string;
  
  // Settings
  settings: {
    cardsPerSession: number;
    showHints: boolean;
    autoFlip: boolean;
    autoFlipDelay: number; // seconds
    shuffleOnStart: boolean;
    soundEnabled: boolean;
  };
  
  // Statistics
  stats: {
    totalCards: number;
    knownCards: number;
    learningCards: number;
    newCards: number;
    difficultCards: number;
    lastPracticed: string | null;
    totalReviews: number;
    averageScore: number;
    streak: number; // consecutive days practiced
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Practice session for tracking progress
 */
export interface FlashcardSession {
  id: string;
  deckId: string;
  userId: string;
  mode: PracticeMode;
  
  // Session data
  cardsReviewed: number;
  cardsCorrect: number;
  cardsWrong: number;
  totalTime: number; // seconds
  
  // Card results
  results: Array<{
    cardId: string;
    correct: boolean;
    responseTime: number; // milliseconds
    rating: 1 | 2 | 3 | 4 | 5; // user's self-rating
  }>;
  
  // Metadata
  startedAt: string;
  completedAt: string | null;
}

/**
 * Review item for spaced repetition
 */
export interface ReviewItem {
  cardId: string;
  deckId: string;
  dueDate: string;
  priority: number; // 1-5, higher = more urgent
}
