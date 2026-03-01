/**
 * Fuzzy answer matching utilities
 * For fill-in-blank and short answer questions
 */

// Common articles and filler words to ignore
const IGNORE_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'of', 'to', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with'
]);

/**
 * Normalize an answer string for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 * - Remove common articles
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    // Remove punctuation except hyphens in compound words
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove common articles and filler words from answer
 */
export function removeArticles(answer: string): string {
  return answer
    .split(' ')
    .filter(word => !IGNORE_WORDS.has(word.toLowerCase()))
    .join(' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two answers match with fuzzy logic
 * 
 * @param userAnswer - The user's input
 * @param correctAnswer - The expected correct answer
 * @param threshold - Max edit distance for typos (default: 2)
 * @returns true if answers are considered matching
 */
export function fuzzyMatch(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 2
): boolean {
  // Normalize both answers
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Exact match after normalization
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Match ignoring articles
  const userNoArticles = removeArticles(normalizedUser);
  const correctNoArticles = removeArticles(normalizedCorrect);
  if (userNoArticles === correctNoArticles) {
    return true;
  }

  // Check if user answer is contained in correct (for partial matches)
  if (
    normalizedCorrect.includes(normalizedUser) ||
    correctNoArticles.includes(userNoArticles)
  ) {
    // Only accept if the user answer is substantial (at least 60% of correct answer length)
    if (normalizedUser.length >= normalizedCorrect.length * 0.6) {
      return true;
    }
  }

  // Check for typos using Levenshtein distance
  // Only allow typos for answers that are at least 4 characters
  if (normalizedUser.length >= 4 && normalizedCorrect.length >= 4) {
    const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
    // Scale threshold based on answer length
    const dynamicThreshold = Math.min(threshold, Math.floor(normalizedCorrect.length / 4));
    if (distance <= dynamicThreshold) {
      return true;
    }
  }

  // Check for alternative formats (e.g., "10" vs "ten", "CO2" vs "carbon dioxide")
  // This is a simple heuristic - could be expanded
  const userWords = normalizedUser.split(' ');
  const correctWords = normalizedCorrect.split(' ');
  
  // If one is a single word and matches any word in the other
  if (userWords.length === 1 && correctWords.includes(userWords[0])) {
    return true;
  }
  if (correctWords.length === 1 && userWords.includes(correctWords[0])) {
    return true;
  }

  return false;
}

/**
 * Check multiple acceptable answers
 */
export function matchAnyAnswer(
  userAnswer: string,
  acceptableAnswers: string[],
  threshold: number = 2
): boolean {
  return acceptableAnswers.some(answer => fuzzyMatch(userAnswer, answer, threshold));
}

/**
 * Check if an answer is close enough to potentially be a synonym or alternative phrasing.
 * Used to decide whether to call semantic evaluation API.
 * Returns true if the answer might be semantically correct (worth checking).
 */
export function isPotentiallySemanticallyCorrect(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  
  // Too short to be meaningful - likely wrong
  if (normalizedUser.length < 2) return false;
  
  // Empty answer
  if (!normalizedUser) return false;
  
  // Check if lengths are reasonably similar (within 3x)
  const lengthRatio = normalizedUser.length / normalizedCorrect.length;
  if (lengthRatio < 0.25 || lengthRatio > 4) return false;
  
  // Check if they share significant characters (at least 30% overlap)
  const userChars = new Set(normalizedUser.replace(/\s/g, '').split(''));
  const correctChars = new Set(normalizedCorrect.replace(/\s/g, '').split(''));
  let overlap = 0;
  for (const char of userChars) {
    if (correctChars.has(char)) overlap++;
  }
  const overlapRatio = overlap / Math.max(userChars.size, correctChars.size);
  if (overlapRatio < 0.3) return false;
  
  // Check if edit distance is within a reasonable range (not completely different)
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const maxReasonableDistance = Math.max(normalizedCorrect.length * 0.6, 5);
  if (distance > maxReasonableDistance) return false;
  
  // Passed all checks - worth doing semantic evaluation
  return true;
}
