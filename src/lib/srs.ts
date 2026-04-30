/**
 * Spaced Repetition System (SM-2 Algorithm)
 * 
 * Implementation of the SuperMemo SM-2 algorithm for optimal flashcard review scheduling.
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface ReviewResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO date string
}

/**
 * Quality of recall (0-5):
 * 0 - Complete blackout
 * 1 - Incorrect response, but correct one seemed familiar
 * 2 - Incorrect response, but correct one remembered
 * 3 - Correct response, but required significant difficulty
 * 4 - Correct response, after some hesitation
 * 5 - Perfect response
 */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Calculate next review using SM-2 algorithm
 * 
 * @param quality - Quality of recall (0-5)
 * @param easeFactor - Current ease factor (1.3 - 2.5)
 * @param interval - Current interval in days
 * @param repetitions - Number of successful repetitions
 * @returns Updated review parameters
 */
export function calculateNextReview(
  quality: RecallQuality,
  easeFactor: number,
  interval: number,
  repetitions: number
): ReviewResult {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor stays within bounds
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // If quality < 3, reset repetitions and interval
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetitions = repetitions + 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReviewDate.toISOString(),
  };
}

/**
 * Convert user response to recall quality
 * 
 * @param isCorrect - Whether the answer was correct
 * @param responseTime - Time taken to respond in milliseconds
 * @param difficulty - Card difficulty ('easy' | 'medium' | 'hard')
 * @returns Recall quality (0-5)
 */
export function responseToQuality(
  isCorrect: boolean,
  responseTime: number,
  difficulty: 'easy' | 'medium' | 'hard'
): RecallQuality {
  if (!isCorrect) {
    // Incorrect responses
    return 0;
  }

  // Correct responses - adjust based on response time and difficulty
  const thresholds = {
    easy: { perfect: 3000, good: 6000 },
    medium: { perfect: 5000, good: 10000 },
    hard: { perfect: 8000, good: 15000 },
  };

  const threshold = thresholds[difficulty];

  if (responseTime < threshold.perfect) {
    return 5; // Perfect response
  } else if (responseTime < threshold.good) {
    return 4; // Good response with slight hesitation
  } else {
    return 3; // Correct but required significant difficulty
  }
}

/**
 * Get initial review parameters for a new card
 */
export function getInitialReviewParams(): {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
} {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };
}

/**
 * Check if a card is due for review
 */
export function isCardDue(nextReview: string): boolean {
  const now = new Date();
  const reviewDate = new Date(nextReview);
  return reviewDate <= now;
}

/**
 * Get cards due for review from a list
 */
export function getDueCards<T extends { nextReview: string }>(cards: T[]): T[] {
  return cards.filter(card => isCardDue(card.nextReview));
}

/**
 * Sort cards by priority (due date, then difficulty)
 */
export function sortCardsByPriority<T extends { nextReview: string; difficulty: string }>(
  cards: T[]
): T[] {
  return [...cards].sort((a, b) => {
    // First, sort by due date (earlier first)
    const dateA = new Date(a.nextReview).getTime();
    const dateB = new Date(b.nextReview).getTime();
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Then by difficulty (hard first)
    const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
    return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
           difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
  });
}

/**
 * Calculate optimal study session size based on due cards
 */
export function getOptimalSessionSize(dueCardsCount: number): number {
  if (dueCardsCount <= 10) return dueCardsCount;
  if (dueCardsCount <= 20) return 15;
  if (dueCardsCount <= 50) return 20;
  return 25;
}

/**
 * Get study statistics
 */
export function getStudyStats<T extends {
  status: string;
  timesReviewed: number;
  timesCorrect: number;
  nextReview: string;
}>(cards: T[]): {
  total: number;
  new: number;
  learning: number;
  known: number;
  difficult: number;
  dueToday: number;
  accuracy: number;
  totalReviews: number;
} {
  const now = new Date();
  
  const stats = {
    total: cards.length,
    new: 0,
    learning: 0,
    known: 0,
    difficult: 0,
    dueToday: 0,
    accuracy: 0,
    totalReviews: 0,
  };

  let totalCorrect = 0;
  let totalAttempts = 0;

  cards.forEach(card => {
    // Count by status
    if (card.status === 'new') stats.new++;
    else if (card.status === 'learning') stats.learning++;
    else if (card.status === 'known') stats.known++;
    else if (card.status === 'difficult') stats.difficult++;

    // Count due cards
    if (new Date(card.nextReview) <= now) {
      stats.dueToday++;
    }

    // Accumulate review stats
    stats.totalReviews += card.timesReviewed;
    totalCorrect += card.timesCorrect;
    totalAttempts += card.timesReviewed;
  });

  // Calculate accuracy
  stats.accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

  return stats;
}
