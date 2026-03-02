# Architecture Overview

[![Back to README](https://img.shields.io/badge/←_Back_to-README-6366F1?style=flat-square)](../README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square)](https://react.dev/)

---

## Table of Contents

- [System Overview](#system-overview)
- [Layer Architecture](#layer-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow Patterns](#data-flow-patterns)
- [File Structure](#file-structure)
- [Key Design Decisions](#key-design-decisions)

---

## System Overview

Quietude follows a **layered architecture** pattern with clear separation of concerns. The application is built as a client-side React SPA with optional backend synchronization through Firebase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Landing  │ │Dashboard │ │  Learn   │ │   Quiz   │ │  Stats   │ ...     │
│  │   Page   │ │   Page   │ │   Page   │ │   Page   │ │   Page   │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │            │            │            │            │                 │
│       └────────────┴────────────┴────────────┴────────────┘                 │
│                                   │                                         │
│                     ┌─────────────┴─────────────┐                           │
│                     │    UI Component Library   │                           │
│                     │   (shadcn/ui + Radix UI)  │                           │
│                     └───────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STATE LAYER (Zustand)                            │
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │  Quiz   │ │  Notes  │ │Sessions │ │  Paths  │ │   UI    │  │
│  │  Store  │ │  Store  │ │  Store  │ │  Store  │ │  Store  │ │  Store  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │          │          │          │          │          │             │
│       └──────────┴──────────┴──────────┴──────────┴──────────┘             │
│                               │                                             │
│                    ┌──────────┴──────────┐                                  │
│                    │  Persist Middleware │                                  │
│                    │    (localStorage)   │                                  │
│                    └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                    │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │    Gemini AI Engine   │  │   Firebase Client      │  │   PWA Services  │ │
│  │                       │  │                       │  │                 │ │
│  │  • Key Pool Manager   │  │  • Auth Service       │  │  • SW Register  │ │
│  │  • Prompt Builder     │  │  • Firestore Sync     │  │  • Offline DB   │ │
│  │  • Response Parsers   │  │  • Data Fetcher       │  │  • Cache Mgmt   │ │
│  │  • Cache Layer        │  │                       │  │                 │ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE LAYER                                   │
│                                                                             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │    localStorage   │  │     IndexedDB     │  │      Firebase     │       │
│  │                   │  │    (idb-keyval)   │  │    (Firestore)    │       │
│  │  • Auth state     │  │                   │  │                   │       │
│  │  • User prefs     │  │  • Sync queue     │  │  • User profiles  │       │
│  │  • Theme mood     │  │  • Offline cache  │  │  • Learning paths │       │
│  │  • Quiz drafts    │  │  • Large data     │  │  • Quiz sessions  │       │
│  └───────────────────┘  └───────────────────┘  │  • Notes          │       │
│                                                 └───────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer

The presentation layer consists of **Pages** and **Components** organized by feature domain.

#### Pages

| Page | Path | Description |
|------|------|-------------|
| `Landing` | `/` | Authentication entry point |
| `Verify` | `/verify` | OTP verification |
| `Onboarding` | `/onboarding` | User profile setup |
| `Dashboard` | `/dashboard` | Main hub with upload |
| `Learn` | `/learn/:pathId` | Topic roadmap view |
| `Quiz` | `/quiz` | Quiz taking interface |
| `Notes` | `/notes` | Generated notes browser |
| `Stats` | `/stats` | Learning analytics |

#### Component Organization

```
components/
├── auth/               # Authentication flows
│   ├── AuthProvider.tsx       # Context and sync
│   ├── ProtectedRoute.tsx     # Route guards
│   └── SyncIndicator.tsx      # Sync status UI
│
├── layout/             # Application shell
│   ├── Shell.tsx              # Main layout wrapper
│   ├── TopNav.tsx             # Navigation header
│   ├── BottomNav.tsx          # Mobile navigation
│   ├── ThemeProvider.tsx      # Theme context
│   └── MoodControl.tsx        # Mood selector
│
├── quiz/               # Quiz-specific components
│   ├── ConfigScreen.tsx       # Quiz configuration
│   ├── QuestionCard.tsx       # Question display
│   ├── MCQOptions.tsx         # Multiple choice
│   ├── TrueFalseOptions.tsx   # True/false
│   ├── FillBlankInput.tsx     # Fill in blank
│   ├── QuizProgressBar.tsx    # Progress indicator
│   ├── QuizTimer.tsx          # Countdown timer
│   ├── ScoreScreen.tsx        # Results display
│   └── ResumeBar.tsx          # Crash recovery
│
├── upload/             # Content upload
│   ├── DropZone.tsx           # Drag and drop
│   ├── PasteArea.tsx          # Text paste
│   └── UploadProgress.tsx     # Progress indicator
│
└── ui/                 # shadcn/ui primitives
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ... (40+ components)
```

### 2. State Layer

The state layer uses **Zustand** for global state management with the persist middleware for automatic localStorage synchronization.

#### Store Responsibilities

| Store | File | Responsibility |
|-------|------|----------------|
| `useAuthStore` | `store/auth.ts` | Authentication state, OTP flow, session management |
| `useQuizStore` | `store/quiz.ts` | Quiz lifecycle, questions, answers, phases |
| `useNotesStore` | `store/notes.ts` | Generated notes, CRUD operations |
| `useSessionsStore` | `store/sessions.ts` | Quiz history, statistics aggregation |
| `usePathsStore` | `store/paths.ts` | Learning paths, topic organization |
| `useUserStore` | `store/user.ts` | User profile, preferences |
| `useUIStore` | `store/ui.ts` | Theme mood, UI state |

#### Store Interaction Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component (e.g., Quiz.tsx)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │ useQuiz   │       │ usePaths  │       │useSessions│
    │   Store   │◀─────▶│   Store   │◀─────▶│   Store   │
    └───────────┘       └───────────┘       └───────────┘
          │                   │                   │
          │                   │                   │
          ▼                   ▼                   ▼
    ┌─────────────────────────────────────────────────────┐
    │                 localStorage (persist)              │
    │                                                     │
    │  quietude:quiz    quietude:paths   quietude:sessions│
    └─────────────────────────────────────────────────────┘
```

### 3. Service Layer

The service layer provides reusable business logic abstracted from the UI.

#### Gemini AI Engine (`lib/gemini/`)

```
gemini/
├── client.ts      # Key pool manager, API calls, retry logic
├── prompts.ts     # Prompt templates for all AI operations
├── parsers.ts     # Response parsing and validation
└── index.ts       # High-level API functions with caching
```

**Key Capabilities:**
- Multi-key rotation with 24h exhaustion cooldown
- Automatic failover on quota errors
- Response caching for repeated requests
- Multimodal file processing (PDF, images, audio)

#### Firebase Client (`lib/firebase/`)

```
firebase/
├── client.ts          # Firebase client configuration
├── auth.ts            # OTP and session management
├── firestore.ts       # Firestore CRUD operations
├── sync.ts            # Offline-first sync
├── types.ts           # TypeScript types
└── index.ts           # Re-exports
```

#### PWA Services (`lib/pwa/`)

```
pwa/
├── sw-register.ts     # Service worker registration
└── offline-storage.ts # IndexedDB utilities
```

### 4. Persistence Layer

Data is persisted at multiple levels for reliability:

| Storage | Use Case | Size Limit |
|---------|----------|------------|
| localStorage | Zustand stores, auth tokens, preferences | ~5-10 MB |
| IndexedDB | Offline cache, large data | ~50+ MB |
| Firebase | Long-term storage, cross-device sync | Unlimited |

---

## Data Flow Patterns

### Content Upload Flow

```
User uploads file
        │
        ▼
┌───────────────────┐
│    DropZone       │ Accept PDF, Image, Audio, Text
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Gemini Analysis  │ analyzeContent() or analyzeFile()
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Parse Response   │ parseAnalysisResponse()
└────────┬──────────┘
         │
         ├──── needsStudyPlan: true ────▶ Generate topic map
         │
         └──── needsStudyPlan: false ───▶ Single topic quiz
         │
         ▼
┌───────────────────┐
│  Create Path      │ usePathsStore.addPath()
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Sync to Firebase │ syncLearningPath()
└───────────────────┘
```

### Quiz Session Flow

```
User starts quiz
        │
        ▼
┌───────────────────┐
│  ConfigScreen     │ Select question count, types, timer
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  generateQuiz()   │ Gemini API call or mock fallback
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  startQuiz()      │ Initialize session in store
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Answer    Timer
  Question   Tick
    │         │
    ▼         ▼
┌───────────────────┐
│  answerQuestion() │ Store answer, check correct
└────────┬──────────┘
         │
         ▼ (repeat for all questions)
         │
┌───────────────────┐
│  submitQuiz()     │ Calculate score, determine pass/fail
└────────┬──────────┘
         │
         ├──── score >= 75% ────▶ Pass: Unlock next topic
         │
         └──── score < 75% ─────▶ Fail: Generate notes option
         │
         ▼
┌───────────────────┐
│  addSession()     │ Save to history store
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Sync to Firebase │ syncQuizSession()
└───────────────────┘
```

### Offline Sync Flow

```
┌───────────────────────────────────────────────────────────────┐
│                      ONLINE MODE                              │
│                                                               │
│  User Action ──▶ Store Update ──▶ addToSyncQueue() ──▶ Sync  │
│                                         │                     │
│                                         ▼                     │
│                               processSyncQueue()              │
│                                         │                     │
│                                         ▼                     │
│                               Firestore set/delete            │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     OFFLINE MODE                              │
│                                                               │
│  User Action ──▶ Store Update ──▶ addToSyncQueue() ──▶ Queue │
│                                         │                     │
│                                         ▼                     │
│                              IndexedDB (idb-keyval)           │
│                                         │                     │
│                         (When online again...)                │
│                                         │                     │
│                                         ▼                     │
│                               processSyncQueue()              │
│                                         │                     │
│                                         ▼                     │
│                               Firestore set/delete            │
└───────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
quietude/
├── public/
│   ├── robots.txt              # SEO configuration
│   └── site.webmanifest        # PWA manifest
│
├── src/
│   ├── App.tsx                 # Root component with routing
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles and themes
│   ├── vite-env.d.ts           # Vite type declarations
│   │
│   ├── components/             # UI components (see above)
│   ├── hooks/                  # Custom hooks
│   │   ├── use-mobile.tsx      # Responsive detection
│   │   └── use-toast.ts        # Toast notifications
│   │
│   ├── lib/                    # Core utilities
│   │   ├── utils.ts            # General utilities
│   │   ├── theme.ts            # Theme management
│   │   ├── answerMatch.ts      # Fuzzy answer matching
│   │   ├── dataExport.ts       # Data export utilities
│   │   ├── pdfExport.ts        # PDF generation
│   │   ├── learningStyle.ts    # Learning style utils
│   │   ├── gemini/             # AI integration
│   │   ├── pwa/                # PWA utilities
│   │   └── firebase/           # Firebase utilities
│   │
│   ├── pages/                  # Route pages
│   │   ├── Landing.tsx
│   │   ├── Verify.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Learn.tsx
│   │   ├── Quiz.tsx
│   │   ├── Notes.tsx
│   │   ├── Stats.tsx
│   │   └── NotFound.tsx
│   │
│   ├── store/                  # Zustand stores
│   │   ├── auth.ts
│   │   ├── quiz.ts
│   │   ├── notes.ts
│   │   ├── sessions.ts
│   │   ├── paths.ts
│   │   ├── user.ts
│   │   └── ui.ts
│   │
│   ├── test/                   # Test utilities
│   │   ├── setup.ts
│   │   └── example.test.ts
│   │
│   └── types/                  # TypeScript definitions
│       └── quiz.ts
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── GEMINI_MECHANISM.md
│   ├── THEME_SYSTEM.md
│   ├── QUIZ_MECHANISM.md
│   └── PWA_FEATURES.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Key Design Decisions

### 1. Offline-First Architecture

**Decision:** Prioritize local state with optional cloud sync.

**Rationale:** 
- Users can study anywhere without internet
- Reduces API latency for better UX
- Graceful degradation when Firebase is unavailable

**Implementation:**
- Zustand stores persist to localStorage immediately
- Firestore handles offline persistence automatically
- IndexedDB stores larger offline data

### 2. Multi-Key API Pool

**Decision:** Support 1-6+ Gemini API keys with automatic rotation.

**Rationale:**
- Free tier limits can be quickly exhausted
- Production apps need reliability
- Zero-downtime key switching

**Implementation:**
- Key state tracked per key (usage, errors, exhaustion)
- Automatic failover on 429/quota errors
- 24-hour cooldown for exhausted keys

### 3. Component-Based Theming

**Decision:** Use CSS custom properties for theme switching.

**Rationale:**
- No JavaScript re-render on theme change
- Native browser performance
- Easy to add new themes

**Implementation:**
- Theme variables defined in `index.css`
- `data-theme` and `data-mood` attributes on root
- Time-based auto-switching with mood overrides

### 4. Lazy Loading Pages

**Decision:** Code-split all page components.

**Rationale:**
- Faster initial load time
- Better Core Web Vitals
- Only load what's needed

**Implementation:**
- `React.lazy()` for all page imports
- `Suspense` with loading fallback
- Vite handles chunk splitting

### 5. Type-Safe State

**Decision:** Use TypeScript strict mode with Zustand.

**Rationale:**
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code

**Implementation:**
- All stores fully typed
- Interface definitions in `types/quiz.ts`
- Database types generated from schema

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [Gemini Mechanism](GEMINI_MECHANISM.md) | AI integration details |
| [Quiz Mechanism](QUIZ_MECHANISM.md) | Quiz flow and scoring |
| [Theme System](THEME_SYSTEM.md) | CSS theming and moods |
| [PWA Features](PWA_FEATURES.md) | Offline and PWA support |

---

[![Back to Top](https://img.shields.io/badge/↑_Back_to_Top-6366F1?style=flat-square)](#architecture-overview)
