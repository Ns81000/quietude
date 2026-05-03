import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // planned duration in seconds
  actualDuration: number; // actual time spent
  soundIds: string[];
  completed: boolean;
  interrupted: boolean;
}

interface FocusHistoryStore {
  sessions: FocusSession[];
  currentSessionId: string | null;
  
  // Actions
  startSession: (duration: number, soundIds: string[]) => string;
  endSession: (sessionId: string, completed: boolean) => void;
  getSessions: (limit?: number) => FocusSession[];
  getSessionStats: () => {
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    averageDuration: number;
    completionRate: number;
  };
  clearHistory: () => void;
}

export const useFocusHistoryStore = create<FocusHistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      
      startSession: (duration, soundIds) => {
        const sessionId = `session-${Date.now()}`;
        const newSession: FocusSession = {
          id: sessionId,
          startTime: Date.now(),
          endTime: 0,
          duration,
          actualDuration: 0,
          soundIds,
          completed: false,
          interrupted: false
        };
        
        set(state => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: sessionId
        }));
        
        return sessionId;
      },
      
      endSession: (sessionId, completed) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  endTime: Date.now(),
                  actualDuration: Math.floor((Date.now() - session.startTime) / 1000),
                  completed,
                  interrupted: !completed
                }
              : session
          ),
          currentSessionId: null
        }));
      },
      
      getSessions: (limit) => {
        const sessions = get().sessions;
        const sorted = [...sessions].sort((a, b) => b.startTime - a.startTime);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      
      getSessionStats: () => {
        const sessions = get().sessions.filter(s => s.endTime > 0);
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.completed).length;
        const totalMinutes = sessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60;
        const averageDuration = totalSessions > 0 
          ? sessions.reduce((sum, s) => sum + s.actualDuration, 0) / totalSessions / 60
          : 0;
        const completionRate = totalSessions > 0 
          ? (completedSessions / totalSessions) * 100
          : 0;
        
        return {
          totalSessions,
          completedSessions,
          totalMinutes: Math.round(totalMinutes),
          averageDuration: Math.round(averageDuration),
          completionRate: Math.round(completionRate)
        };
      },
      
      clearHistory: () => set({ sessions: [], currentSessionId: null })
    }),
    {
      name: 'quietude:focus-history'
    }
  )
);
