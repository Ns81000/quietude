import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LearningPhase,
  LearningPath,
  Topic,
  QuizConfig,
  QuestionType,
  Answer,
} from '@/types/quiz';
import { usePathsStore } from './paths';

// Extended Question types for the quiz store
export interface MCQQuestion {
  id: string;
  type: 'mcq';
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface TrueFalseQuestion {
  id: string;
  type: 'true_false';
  text: string;
  correct: 0 | 1;
  explanation: string;
}

export interface FillBlankQuestion {
  id: string;
  type: 'fill_blank';
  text: string;
  blank_answer: string;
  explanation: string;
}

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | FillBlankQuestion;

export interface QuizSession {
  id: string;
  user_id: string;
  topic_id: string;
  path_id: string;
  subject?: string; // Subject from learning path
  is_dig_deeper: boolean;
  is_retake: boolean;
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  score: number | null;
  total: number;
  score_pct: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_secs: number | null;
}

interface QuizStore {
  // Data - learningPath is now a computed getter from paths store
  currentTopic: Topic | null;
  currentSession: QuizSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  pendingAnswers: Answer[]; // Auto-saved before submission
  
  // Quiz configuration
  config: QuizConfig;
  
  // State
  phase: LearningPhase;
  isLoading: boolean;
  error: string | null;
  
  // Quiz timer state
  questionStartTime: number | null;
  
  // Actions
  setPhase: (phase: LearningPhase) => void;
  setLearningPath: (path: LearningPath) => void;
  switchToPath: (pathId: string) => void;
  selectTopic: (topic: Topic) => void;
  
  // Configuration
  setConfig: (config: Partial<QuizConfig>) => void;
  
  // Quiz flow
  startQuiz: (session: QuizSession, questions: Question[]) => void;
  answerQuestion: (answer: Answer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  
  // Auto-save
  savePendingAnswers: () => void;
  loadPendingAnswers: () => Answer[] | null;
  clearPendingAnswers: () => void;
  
  // Results
  submitQuiz: () => Promise<void>;
  generateNotes: () => Promise<void>;
  startDigDeeper: () => Promise<void>;
  startRetake: () => void;
  
  // Reset
  reset: () => void;
  resetQuizState: () => void;
  
  // Computed - these access paths store
  get learningPath(): LearningPath | null;
}

const DEFAULT_CONFIG: QuizConfig = {
  count: 10,
  timeLimit: null,
  types: ['mcq', 'true_false', 'fill_blank'],
  difficulty: 'intermediate',
};

const PENDING_ANSWERS_KEY = 'quietude:quiz:draft';

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      // Initial state - learningPath is now accessed via getter
      currentTopic: null,
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      pendingAnswers: [],
      config: DEFAULT_CONFIG,
      phase: 'IDLE',
      isLoading: false,
      error: null,
      questionStartTime: null,

      // Computed getter for learningPath from paths store
      get learningPath() {
        return usePathsStore.getState().getActivePath();
      },

      setPhase: (phase) => set({ phase, error: null }),

      setLearningPath: (path) => {
        // Add to paths store and set as active
        const pathsStore = usePathsStore.getState();
        // Check if path already exists
        const existing = pathsStore.getPathById(path.id);
        if (existing) {
          pathsStore.setActivePath(path.id);
        } else {
          pathsStore.addPath(path);
        }
        set({
          phase: path.needs_study_plan ? 'TOPIC_MAP_READY' : 'TOPIC_SELECTED',
        });
      },

      switchToPath: (pathId) => {
        const pathsStore = usePathsStore.getState();
        const path = pathsStore.getPathById(pathId);
        if (path) {
          pathsStore.setActivePath(pathId);
          set({
            currentTopic: null,
            currentSession: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            phase: path.needs_study_plan ? 'TOPIC_MAP_READY' : 'TOPIC_SELECTED',
          });
        }
      },

      selectTopic: (topic) =>
        set({
          currentTopic: topic,
          phase: 'CONFIGURING',
        }),

      setConfig: (config) =>
        set((state) => ({
          config: { ...state.config, ...config },
        })),

      startQuiz: (session, questions) =>
        set({
          currentSession: session,
          questions,
          currentQuestionIndex: 0,
          answers: [],
          phase: 'QUIZ_ACTIVE',
          questionStartTime: Date.now(),
        }),

      answerQuestion: (answer) =>
        set((state) => {
          const existingIndex = state.answers.findIndex(
            (a) => a.question_id === answer.question_id
          );
          const newAnswers =
            existingIndex >= 0
              ? state.answers.map((a, i) => (i === existingIndex ? answer : a))
              : [...state.answers, answer];
          
          return {
            answers: newAnswers,
            questionStartTime: Date.now(),
          };
        }),

      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.min(
            state.currentQuestionIndex + 1,
            state.questions.length - 1
          ),
          questionStartTime: Date.now(),
        })),

      previousQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
          questionStartTime: Date.now(),
        })),

      savePendingAnswers: () => {
        const { answers, currentSession, currentTopic, currentQuestionIndex } = get();
        if (answers.length > 0 && currentSession) {
          const draft = {
            sessionId: currentSession.id,
            topicId: currentTopic?.id,
            topicTitle: currentTopic?.title,
            answers,
            questionIndex: currentQuestionIndex,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(PENDING_ANSWERS_KEY, JSON.stringify(draft));
        }
      },

      loadPendingAnswers: () => {
        try {
          const stored = localStorage.getItem(PENDING_ANSWERS_KEY);
          if (stored) {
            const draft = JSON.parse(stored);
            return draft.answers || null;
          }
        } catch {
          // Ignore parse errors
        }
        return null;
      },

      clearPendingAnswers: () => {
        localStorage.removeItem(PENDING_ANSWERS_KEY);
        set({ pendingAnswers: [] });
      },

      submitQuiz: async () => {
        const { answers, questions, currentSession } = get();
        set({ phase: 'QUIZ_SUBMITTING', isLoading: true });

        try {
          // Calculate score locally for now (no backend)
          const correctCount = answers.filter((a) => a.correct).length;
          const total = questions.length;
          const scorePct = Math.round((correctCount / total) * 100);
          const passed = scorePct >= 75;

          // Update session state
          set({
            currentSession: currentSession
              ? {
                  ...currentSession,
                  answers,
                  score: correctCount,
                  score_pct: scorePct,
                  passed,
                  submitted_at: new Date().toISOString(),
                }
              : null,
            phase: passed ? 'QUIZ_RESULT_PASS' : 'QUIZ_RESULT_FAIL',
            isLoading: false,
          });

          // Clear pending answers on successful submit
          get().clearPendingAnswers();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit quiz',
            isLoading: false,
          });
        }
      },

      generateNotes: async () => {
        // Note: This action is deprecated - notes are generated directly in Quiz.tsx
        // using the handleGenerateNotes function which calls the Gemini API.
        // Keeping this stub to prevent errors if called from elsewhere.
        set({ phase: 'NOTES_GENERATING', isLoading: true });
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          set({ phase: 'NOTES_READY', isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate notes',
            isLoading: false,
            phase: 'QUIZ_RESULT_FAIL',
          });
        }
      },

      startDigDeeper: async () => {
        const { currentTopic, learningPath, config, currentSession } = get();
        if (!currentTopic || !learningPath) {
          set({ error: 'No topic selected for dig deeper' });
          return;
        }

        set({ phase: 'QUIZ_GENERATING', isLoading: true });
        try {
          // Dig deeper will generate harder questions on the same topic
          // The actual quiz generation happens in Quiz.tsx handleBegin
          // This just resets the state to allow configuring a new harder quiz
          set({
            phase: 'CONFIGURING',
            currentSession: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            isLoading: false,
            // Keep config but could increase difficulty here
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start dig deeper',
            isLoading: false,
            phase: 'QUIZ_RESULT_PASS',
          });
        }
      },

      startRetake: () => {
        set({
          phase: 'CONFIGURING',
          currentQuestionIndex: 0,
          answers: [],
          currentSession: null,
        });
      },

      reset: () => {
        // Reset quiz state but don't touch paths store
        // Old subjects are preserved in paths store
        set({
          currentTopic: null,
          currentSession: null,
          questions: [],
          currentQuestionIndex: 0,
          answers: [],
          pendingAnswers: [],
          config: DEFAULT_CONFIG,
          phase: 'IDLE',
          isLoading: false,
          error: null,
          questionStartTime: null,
        });
      },

      resetQuizState: () =>
        set({
          currentSession: null,
          questions: [],
          currentQuestionIndex: 0,
          answers: [],
          phase: 'CONFIGURING',
          questionStartTime: null,
        }),
    }),
    {
      name: 'quietude:quiz',
      partialize: (state) => ({
        config: state.config,
        // learningPath is now stored in paths store, not here
        // Don't persist quiz session state — use pendingAnswers for crash recovery
      }),
    }
  )
);

// Selectors
export const selectCurrentQuestion = (state: QuizStore) =>
  state.questions[state.currentQuestionIndex] || null;

export const selectProgress = (state: QuizStore) => ({
  current: state.currentQuestionIndex + 1,
  total: state.questions.length,
  percentage: state.questions.length
    ? Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100)
    : 0,
});

export const selectAnsweredCount = (state: QuizStore) => state.answers.length;

export const selectIsLastQuestion = (state: QuizStore) =>
  state.currentQuestionIndex === state.questions.length - 1;

export const selectCanSubmit = (state: QuizStore) =>
  state.answers.length === state.questions.length;
