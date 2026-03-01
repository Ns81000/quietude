/**
 * Utility to suggest quiz configurations based on user's learning style
 * from onboarding preferences.
 */

import type { QuestionType } from '@/types/quiz';

export interface LearningStyleRecommendation {
  questionTypes: QuestionType[];
  description: string;
  tips: string[];
}

/**
 * Get recommended quiz configuration based on learning style
 * - reading: Fill-in-blank and MCQ for retention
 * - practice: MCQ and True/False for active recall
 * - visual: MCQ with matching questions when available
 * - mixed: All question types equally
 */
export function getRecommendedConfig(
  learnStyle: string | null | undefined
): LearningStyleRecommendation {
  switch (learnStyle) {
    case 'reading':
      return {
        questionTypes: ['fill_blank', 'mcq'],
        description: 'Focus on recall and comprehension',
        tips: [
          'Fill-in-blank tests memory recall',
          'Take notes while reading source material',
          'Review generated notes after each quiz',
        ],
      };
    
    case 'practice':
      return {
        questionTypes: ['mcq', 'true_false', 'fill_blank'],
        description: 'Active recall with all question types',
        tips: [
          'Do multiple quizzes per topic',
          'Use the "Dig Deeper" feature for harder questions',
          'Review wrong answers thoroughly',
        ],
      };
    
    case 'visual':
      return {
        questionTypes: ['mcq', 'true_false'],
        description: 'Visual recognition and pattern matching',
        tips: [
          'Upload diagrams and charts as study material',
          'Use image-based questions when available',
          'Create mental maps of topic relationships',
        ],
      };
    
    case 'mixed':
    default:
      return {
        questionTypes: ['mcq', 'true_false', 'fill_blank'],
        description: 'Balanced mix of all question types',
        tips: [
          'Variety helps reinforce learning',
          'Try different time limits to challenge yourself',
          'Use notes for review between quizzes',
        ],
      };
  }
}

/**
 * Get a study tip based on the current time and user's preferred study time
 */
export function getStudyTip(
  preferredTime: string | null | undefined,
  currentHour: number = new Date().getHours()
): string | null {
  if (!preferredTime) return null;
  
  const isInPreferredTime = checkIfPreferredTime(currentHour, preferredTime);
  
  if (isInPreferredTime) {
    return "You're studying during your peak hours – great choice!";
  }
  
  // Suggest optimal time if not studying during preferred time
  const timeLabels: Record<string, string> = {
    morning: '5am – 11am',
    afternoon: '11am – 4pm',
    evening: '4pm – 10pm',
    night: '10pm – 5am',
  };
  
  return `Your peak study time is ${timeLabels[preferredTime] || preferredTime}. Consider reviewing notes then!`;
}

function checkIfPreferredTime(hour: number, preferredTime: string): boolean {
  const ranges: Record<string, [number, number]> = {
    morning: [5, 11],
    afternoon: [11, 16],
    evening: [16, 22],
    night: [22, 5],
  };
  
  const range = ranges[preferredTime];
  if (!range) return false;
  
  if (preferredTime === 'night') {
    return hour >= 22 || hour < 5;
  }
  return hour >= range[0] && hour < range[1];
}
