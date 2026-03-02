import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizSession } from './quiz';

interface SessionsStore {
  sessions: QuizSession[];
  
  // Actions
  addSession: (session: QuizSession) => void;
  updateSession: (id: string, updates: Partial<QuizSession>) => void;
  deleteSession: (id: string) => void;
  deleteSessionsByPathId: (pathId: string) => void;
  clearAllSessions: () => void;
  clearAll: () => void;
  importSessions: (sessions: QuizSession[]) => void;
  
  // Getters
  getSessionsBySubject: () => Record<string, QuizSession[]>;
  getSessionsByTopic: (topicId: string) => QuizSession[];
  getSessionsByPathId: (pathId: string) => QuizSession[];
  getRecentSessions: (limit?: number) => QuizSession[];
  getRecentSessionsForPath: (pathId: string, limit?: number) => QuizSession[];
  getPassedSessions: () => QuizSession[];
  getIncompleteSessions: () => QuizSession[];
  getSessionById: (id: string) => QuizSession | undefined;
  
  // Stats
  getStats: () => {
    totalSessions: number;
    completedSessions: number;
    passedSessions: number;
    averageScore: number;
    totalTimeMinutes: number;
    subjectBreakdown: Record<string, { count: number; avgScore: number }>;
  };
  getStatsForPath: (pathId: string) => {
    totalSessions: number;
    completedSessions: number;
    passedSessions: number;
    averageScore: number;
    totalTimeMinutes: number;
  };
}

export const useSessionsStore = create<SessionsStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      deleteSessionsByPathId: (pathId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.path_id !== pathId),
        })),

      clearAllSessions: () => set({ sessions: [] }),

      clearAll: () => set({ sessions: [] }),

      importSessions: (sessions) =>
        set((state) => {
          // Merge imported sessions, avoiding duplicates by id
          const existingIds = new Set(state.sessions.map((s) => s.id));
          const newSessions = sessions.filter((s) => !existingIds.has(s.id));
          return { sessions: [...state.sessions, ...newSessions] };
        }),

      getSessionsBySubject: () => {
        const { sessions } = get();
        // Group by subject stored in session
        return sessions.reduce<Record<string, QuizSession[]>>((acc, session) => {
          // Use subject from session, fallback to 'General'
          const subject = (session as any).subject || 'General';
          if (!acc[subject]) {
            acc[subject] = [];
          }
          acc[subject].push(session);
          return acc;
        }, {});
      },

      getSessionsByTopic: (topicId) => {
        const { sessions } = get();
        return sessions.filter((s) => s.topic_id === topicId);
      },

      getSessionsByPathId: (pathId) => {
        const { sessions } = get();
        return sessions.filter((s) => s.path_id === pathId);
      },

      getRecentSessions: (limit = 10) => {
        const { sessions } = get();
        return sessions.slice(0, limit);
      },

      getRecentSessionsForPath: (pathId, limit = 10) => {
        const { sessions } = get();
        return sessions
          .filter((s) => s.path_id === pathId)
          .slice(0, limit);
      },

      getPassedSessions: () => {
        const { sessions } = get();
        return sessions.filter((s) => s.passed === true);
      },

      getIncompleteSessions: () => {
        const { sessions } = get();
        return sessions.filter((s) => s.submitted_at === null);
      },

      getSessionById: (id) => {
        const { sessions } = get();
        return sessions.find((s) => s.id === id);
      },

      getStats: () => {
        const { sessions } = get();
        const completed = sessions.filter((s) => s.submitted_at !== null);
        const passed = completed.filter((s) => s.passed === true);
        
        const totalScore = completed.reduce(
          (sum, s) => sum + (s.score_pct || 0),
          0
        );
        const avgScore = completed.length > 0 ? totalScore / completed.length : 0;
        
        const totalTime = completed.reduce(
          (sum, s) => sum + (s.time_taken_secs || 0),
          0
        );

        // Subject breakdown
        const subjectBreakdown: Record<string, { count: number; avgScore: number }> = {};
        completed.forEach((session) => {
          const subject = (session as any).subject || 'General';
          if (!subjectBreakdown[subject]) {
            subjectBreakdown[subject] = { count: 0, avgScore: 0 };
          }
          subjectBreakdown[subject].count++;
          subjectBreakdown[subject].avgScore += session.score_pct || 0;
        });
        
        // Calculate averages
        Object.keys(subjectBreakdown).forEach((subject) => {
          const data = subjectBreakdown[subject];
          data.avgScore = data.count > 0 ? data.avgScore / data.count : 0;
        });

        return {
          totalSessions: sessions.length,
          completedSessions: completed.length,
          passedSessions: passed.length,
          averageScore: Math.round(avgScore),
          totalTimeMinutes: Math.round(totalTime / 60),
          subjectBreakdown,
        };
      },

      getStatsForPath: (pathId) => {
        const { sessions } = get();
        const pathSessions = sessions.filter((s) => s.path_id === pathId);
        const completed = pathSessions.filter((s) => s.submitted_at !== null);
        const passed = completed.filter((s) => s.passed === true);
        
        const totalScore = completed.reduce(
          (sum, s) => sum + (s.score_pct || 0),
          0
        );
        const avgScore = completed.length > 0 ? totalScore / completed.length : 0;
        
        const totalTime = completed.reduce(
          (sum, s) => sum + (s.time_taken_secs || 0),
          0
        );

        return {
          totalSessions: pathSessions.length,
          completedSessions: completed.length,
          passedSessions: passed.length,
          averageScore: Math.round(avgScore),
          totalTimeMinutes: Math.round(totalTime / 60),
        };
      },
    }),
    {
      name: 'quietude:sessions',
    }
  )
);

// Selectors
export const selectSessionCount = (state: SessionsStore) => state.sessions.length;
export const selectCompletedCount = (state: SessionsStore) =>
  state.sessions.filter((s) => s.submitted_at !== null).length;
