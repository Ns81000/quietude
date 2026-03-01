# State Management

[![Zustand](https://img.shields.io/badge/Zustand-5.0-brown?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square)](https://typescriptlang.org)
[![localStorage](https://img.shields.io/badge/Persistence-localStorage-orange?style=flat-square)](https://developer.mozilla.org/docs/Web/API/Window/localStorage)

Quietude uses **Zustand** for state management, providing a lightweight, unopinionated approach with built-in persistence. The application maintains **7 specialized stores**, each handling a distinct domain of application state.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Store Catalog](#store-catalog)
- [Auth Store](#auth-store)
- [Quiz Store](#quiz-store)
- [Notes Store](#notes-store)
- [Sessions Store](#sessions-store)
- [Paths Store](#paths-store)
- [UI Store](#ui-store)
- [User Store](#user-store)
- [Persistence Strategy](#persistence-strategy)
- [Selector Patterns](#selector-patterns)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ZUSTAND STORE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌──────────────────┐                               │
│                              │   React Tree     │                               │
│                              └────────┬─────────┘                               │
│                                       │                                         │
│                    ┌──────────────────┼──────────────────┐                     │
│                    │                  │                  │                     │
│           ┌────────┴────────┐  ┌──────┴──────┐  ┌───────┴───────┐             │
│           │   useAuthStore  │  │ useUIStore  │  │ useUserStore  │             │
│           └─────────────────┘  └─────────────┘  └───────────────┘             │
│                                                                                 │
│           ┌─────────────────┐  ┌─────────────┐  ┌───────────────┐             │
│           │  useQuizStore   │  │useNotesStore│  │usePathsStore  │             │
│           └─────────────────┘  └─────────────┘  └───────────────┘             │
│                                                                                 │
│                              ┌───────────────────┐                              │
│                              │ useSessionsStore  │                              │
│                              └───────────────────┘                              │
│                                       │                                         │
│                    ┌──────────────────┼──────────────────┐                     │
│                    │                  │                  │                     │
│           ┌────────┴────────┐  ┌──────┴──────┐  ┌───────┴───────┐             │
│           │   localStorage  │  │  IndexedDB  │  │   Supabase    │             │
│           │   (persist)     │  │  (offline)  │  │   (sync)      │             │
│           └─────────────────┘  └─────────────┘  └───────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Store Catalog

| Store | File | Purpose | Persisted |
|-------|------|---------|-----------|
| Auth | [auth.ts](../src/store/auth.ts) | Authentication state and OTP flow | Yes |
| Quiz | [quiz.ts](../src/store/quiz.ts) | Quiz sessions and learning phases | Yes |
| Notes | [notes.ts](../src/store/notes.ts) | Generated notes and content | Yes |
| Sessions | [sessions.ts](../src/store/sessions.ts) | User activity sessions | Yes |
| Paths | [paths.ts](../src/store/paths.ts) | Learning paths and roadmaps | Yes |
| UI | [ui.ts](../src/store/ui.ts) | Theme, mood, and UI preferences | Partial |
| User | [user.ts](../src/store/user.ts) | User profile and preferences | Yes |

---

## Auth Store

### Purpose
Manages the complete authentication lifecycle including OTP generation, verification, and session management.

### State Shape

```typescript
// src/store/auth.ts
interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User data
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  } | null;
  
  // Session management
  sessionToken: string | null;
  sessionExpiry: number | null;
  
  // OTP flow state
  otpSent: boolean;
  otpEmail: string | null;
  otpExpiry: number | null;
  
  // Actions
  sendOTP: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}
```

### Key Actions

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      sessionToken: null,
      sessionExpiry: null,
      otpSent: false,
      otpEmail: null,
      otpExpiry: null,

      sendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await sendOTPEmail(email);
          if (result.success) {
            set({
              otpSent: true,
              otpEmail: email,
              otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
              isLoading: false
            });
            return true;
          }
          throw new Error(result.error);
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      verifyOTP: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await verifyOTPCode(email, code);
          if (result.success) {
            set({
              isAuthenticated: true,
              user: result.user,
              sessionToken: result.token,
              sessionExpiry: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
              otpSent: false,
              otpEmail: null,
              otpExpiry: null,
              isLoading: false
            });
            return true;
          }
          throw new Error(result.error);
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          sessionToken: null,
          sessionExpiry: null,
          otpSent: false,
          otpEmail: null,
          otpExpiry: null
        });
      },

      refreshSession: async () => {
        const { sessionToken, sessionExpiry } = get();
        if (!sessionToken || !sessionExpiry) return false;
        
        // Check if session is still valid
        if (Date.now() > sessionExpiry) {
          get().logout();
          return false;
        }
        
        // Refresh if expiring within 1 day
        if (sessionExpiry - Date.now() < 24 * 60 * 60 * 1000) {
          try {
            const newToken = await refreshAuthToken(sessionToken);
            set({
              sessionToken: newToken,
              sessionExpiry: Date.now() + 3 * 24 * 60 * 60 * 1000
            });
          } catch {
            // Token refresh failed, logout
            get().logout();
            return false;
          }
        }
        return true;
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'quietude-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        sessionToken: state.sessionToken,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
);
```

---

## Quiz Store

### Purpose
Manages quiz sessions, learning phases, questions, answers, and scoring throughout the quiz lifecycle.

### State Shape

```typescript
// src/store/quiz.ts
interface QuizState {
  // Current session
  currentSession: QuizSession | null;
  phase: LearningPhase;
  
  // Session history
  sessions: QuizSession[];
  
  // Uploaded content
  content: {
    id: string;
    text: string;
    title: string;
    analysis?: ContentAnalysis;
  } | null;
  
  // Configuration
  config: QuizConfig;
  
  // Actions
  uploadContent: (content: string, title?: string) => void;
  analyzeContent: () => Promise<void>;
  setConfig: (config: Partial<QuizConfig>) => void;
  generateQuestions: () => Promise<void>;
  startQuiz: () => void;
  answerQuestion: (questionId: string, answer: string) => void;
  submitQuiz: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  digDeeper: () => Promise<void>;
  reset: () => void;
}
```

### Phase Transitions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         QUIZ STORE PHASE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   uploadContent()     analyzeContent()   setConfig()    generateQuestions()    │
│         │                   │                │                │                 │
│         ▼                   ▼                ▼                ▼                 │
│   ┌──────────┐      ┌───────────┐     ┌───────────┐    ┌───────────┐          │
│   │ uploading│ ───► │ analyzing │ ──► │configuring│ ─► │generating │          │
│   └──────────┘      └───────────┘     └───────────┘    └───────────┘          │
│                                                              │                  │
│   startQuiz()        pauseQuiz()      submitQuiz()          │                  │
│         │                │                │                  ▼                  │
│         ▼                ▼                ▼           ┌───────────┐            │
│   ┌──────────┐      ┌──────────┐    ┌───────────┐   │   ready   │            │
│   │  active  │ ◄──► │  paused  │    │ reviewing │   └───────────┘            │
│   └────┬─────┘      └──────────┘    └─────┬─────┘                             │
│        │                                   │                                    │
│        │            digDeeper()           │         completeSession()          │
│        │                │                 │                │                    │
│        ▼                ▼                 ▼                ▼                    │
│   ┌──────────────────────────────────────────────────────────────┐            │
│   │                        completed                              │            │
│   └──────────────────────────────────────────────────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Notes Store

### Purpose
Stores AI-generated notes, summaries, and flashcards derived from uploaded content.

### State Shape

```typescript
// src/store/notes.ts
interface NotesState {
  // Notes collection
  notes: Note[];
  
  // Currently viewed note
  activeNote: Note | null;
  
  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  
  // Actions
  generateNotes: (content: string, contentId: string) => Promise<Note>;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  searchNotes: (query: string) => Note[];
  exportNotes: (ids: string[], format: 'pdf' | 'markdown') => Promise<Blob>;
}

interface Note {
  id: string;
  contentId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

### Implementation

```typescript
export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNote: null,
      isGenerating: false,
      generationProgress: 0,

      generateNotes: async (content: string, contentId: string) => {
        set({ isGenerating: true, generationProgress: 0 });
        
        try {
          // Generate summary
          set({ generationProgress: 25 });
          const summary = await generateSummary(content);
          
          // Extract key points
          set({ generationProgress: 50 });
          const keyPoints = await extractKeyPoints(content);
          
          // Generate flashcards
          set({ generationProgress: 75 });
          const flashcards = await generateFlashcards(content);
          
          const note: Note = {
            id: crypto.randomUUID(),
            contentId,
            title: summary.title,
            summary: summary.text,
            keyPoints,
            flashcards,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: summary.suggestedTags
          };
          
          set((state) => ({
            notes: [...state.notes, note],
            activeNote: note,
            isGenerating: false,
            generationProgress: 100
          }));
          
          return note;
        } catch (error) {
          set({ isGenerating: false, generationProgress: 0 });
          throw error;
        }
      },

      searchNotes: (query: string) => {
        const { notes } = get();
        const lowerQuery = query.toLowerCase();
        
        return notes.filter(note =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.summary.toLowerCase().includes(lowerQuery) ||
          note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      },

      // ... other actions
    }),
    {
      name: 'quietude-notes',
      partialize: (state) => ({ notes: state.notes })
    }
  )
);
```

---

## Sessions Store

### Purpose
Tracks user activity sessions for analytics and the "continue where you left off" feature.

### State Shape

```typescript
// src/store/sessions.ts
interface SessionsState {
  // Activity tracking
  currentSessionId: string | null;
  sessions: ActivitySession[];
  
  // Recent activity
  recentContent: RecentContent[];
  
  // Actions
  startSession: () => void;
  endSession: () => void;
  recordActivity: (activity: Activity) => void;
  getRecentSessions: (limit?: number) => ActivitySession[];
  getSessionStats: () => SessionStats;
}

interface ActivitySession {
  id: string;
  startTime: number;
  endTime?: number;
  activities: Activity[];
  duration: number;
}

interface Activity {
  type: 'quiz_start' | 'quiz_complete' | 'note_view' | 'content_upload';
  timestamp: number;
  metadata: Record<string, unknown>;
}

interface RecentContent {
  id: string;
  title: string;
  type: 'quiz' | 'notes' | 'path';
  lastAccessed: number;
  progress: number;
}
```

---

## Paths Store

### Purpose
Manages learning paths, topic roadmaps, and progress tracking through educational content.

### State Shape

```typescript
// src/store/paths.ts
interface PathsState {
  // Learning paths
  paths: LearningPath[];
  activePath: LearningPath | null;
  
  // Topic progress
  topicProgress: Map<string, TopicProgress>;
  
  // Actions
  createPath: (subject: string, topics: string[]) => Promise<LearningPath>;
  updateProgress: (pathId: string, topicId: string, progress: number) => void;
  setActivePath: (pathId: string | null) => void;
  getPathProgress: (pathId: string) => number;
  suggestNextTopic: (pathId: string) => string | null;
}

interface LearningPath {
  id: string;
  title: string;
  subject: string;
  topics: Topic[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  quizIds: string[];
  noteIds: string[];
}

interface TopicProgress {
  topicId: string;
  quizzesCompleted: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: number;
}
```

---

## UI Store

### Purpose
Manages user interface state including theme, mood, sidebar visibility, and transient UI preferences.

### State Shape

```typescript
// src/store/ui.ts
interface UIState {
  // Theme system
  theme: TimedTheme;
  mood: MoodTheme | null;
  
  // Layout state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modal state
  activeModal: string | null;
  modalData: Record<string, unknown>;
  
  // Toast notifications
  toasts: Toast[];
  
  // Actions
  setTheme: (theme: TimedTheme) => void;
  setMood: (mood: MoodTheme | null) => void;
  toggleSidebar: () => void;
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}
```

### Partial Persistence

```typescript
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'afternoon',
      mood: null,
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: {},
      toasts: [],

      setMood: (mood) => set({ mood }),
      
      addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        
        // Auto-remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 5000);
        
        return id;
      },

      // ... other actions
    }),
    {
      name: 'quietude-ui',
      // Only persist mood preference, not transient state
      partialize: (state) => ({
        mood: state.mood,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);
```

---

## User Store

### Purpose
Stores user profile information, preferences, and onboarding state.

### State Shape

```typescript
// src/store/user.ts
interface UserState {
  // Profile
  profile: UserProfile | null;
  
  // Preferences
  preferences: UserPreferences;
  
  // Onboarding
  onboardingComplete: boolean;
  onboardingStep: number;
  
  // Learning style
  learningStyle: LearningStyle | null;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  setLearningStyle: (style: LearningStyle) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: number;
}

interface UserPreferences {
  defaultDifficulty: DifficultyLevel;
  defaultQuestionCount: number;
  autoPlayAudio: boolean;
  showExplanations: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    reminderTime?: string;
  };
}

interface LearningStyle {
  type: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  strengths: string[];
  recommendations: string[];
}
```

---

## Persistence Strategy

### localStorage Configuration

```typescript
// Zustand persist middleware configuration
persist(
  (set, get) => ({
    // ... store implementation
  }),
  {
    name: 'store-key',           // localStorage key
    storage: createJSONStorage(() => localStorage),
    
    // Selective persistence
    partialize: (state) => ({
      // Only include fields to persist
      importantData: state.importantData
    }),
    
    // Migration for schema changes
    version: 1,
    migrate: (persistedState, version) => {
      if (version === 0) {
        // Migrate from v0 to v1
        return { ...persistedState, newField: defaultValue };
      }
      return persistedState;
    },
    
    // Merge strategy
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    })
  }
)
```

### Storage Keys

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOCALSTORAGE KEYS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Key                      │ Content                    │ Size Estimate         │
│   ─────────────────────────┼────────────────────────────┼───────────────────── │
│   quietude-auth            │ User auth state            │ ~500 bytes            │
│   quietude-quiz            │ Quiz sessions              │ ~50KB (max)           │
│   quietude-notes           │ Generated notes            │ ~100KB (max)          │
│   quietude-sessions        │ Activity history           │ ~20KB                 │
│   quietude-paths           │ Learning paths             │ ~30KB                 │
│   quietude-ui              │ Theme preferences          │ ~200 bytes            │
│   quietude-user            │ User profile               │ ~2KB                  │
│                                                                                 │
│   Total Estimated: ~200KB (well under 5MB localStorage limit)                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Selector Patterns

### Basic Selectors

```typescript
// Select single value
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Select derived value
const questionCount = useQuizStore((state) => state.currentSession?.questions.length ?? 0);

// Select action
const logout = useAuthStore((state) => state.logout);
```

### Optimized Selectors

```typescript
// Shallow equality for object selections
import { shallow } from 'zustand/shallow';

const { user, isLoading } = useAuthStore(
  (state) => ({ user: state.user, isLoading: state.isLoading }),
  shallow
);

// Memoized computed values
const correctAnswers = useQuizStore(
  (state) => state.currentSession?.answers.filter(a => a.isCorrect).length ?? 0
);
```

### Selector Factory Pattern

```typescript
// Create reusable selectors
const selectNoteById = (id: string) => (state: NotesState) =>
  state.notes.find(note => note.id === id);

// Usage
const note = useNotesStore(selectNoteById('abc123'));
```

### Cross-Store Composition

```typescript
// Combine data from multiple stores
function useQuizWithUser() {
  const session = useQuizStore((state) => state.currentSession);
  const user = useUserStore((state) => state.profile);
  
  return {
    session,
    userName: user?.name ?? 'Guest',
    isPersonalized: !!user
  };
}
```

---

## Summary

Quietude's state management architecture provides:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Domain Separation | 7 specialized stores | Clear responsibilities |
| Type Safety | Full TypeScript | Compile-time checks |
| Persistence | Zustand persist middleware | Data survives refresh |
| Selective Sync | partialize option | Efficient storage |
| Optimized Renders | Shallow selectors | Performance |
| Cross-Store Access | Direct imports | Flexible composition |

---

**Related Documentation:**
- [Architecture Overview](./ARCHITECTURE.md) - System design patterns
- [Quiz Mechanism](./QUIZ_MECHANISM.md) - Quiz store in action
- [Sync Mechanism](./SYNC_MECHANISM.md) - Store synchronization

---

<div align="center">
  <sub>Predictable state for reliable learning experiences</sub>
</div>
