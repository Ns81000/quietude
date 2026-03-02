# Quiz Mechanism

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square)](https://typescriptlang.org)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-brown?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285f4?style=flat-square)](https://ai.google.dev/)

The quiz system in Quietude is an **AI-powered adaptive learning engine** that generates contextual questions from uploaded content. It features multiple question types, intelligent answer matching, progressive difficulty through "dig deeper" functionality, and comprehensive session tracking.

---

## Table of Contents

- [Overview](#overview)
- [Question Types](#question-types)
- [Learning Phases State Machine](#learning-phases-state-machine)
- [Quiz Generation Flow](#quiz-generation-flow)
- [Answer Matching System](#answer-matching-system)
- [Scoring and Progression](#scoring-and-progression)
- [Dig Deeper Feature](#dig-deeper-feature)
- [Session Management](#session-management)
- [Data Structures](#data-structures)

---

## Overview

The quiz mechanism transforms uploaded educational content into interactive assessments:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           QUIZ SYSTEM OVERVIEW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                │
│   │   UPLOADED   │      │   GEMINI     │      │   QUIZ       │                │
│   │   CONTENT    │ ───► │   AI         │ ───► │   SESSION    │                │
│   │   (PDF/URL)  │      │   GENERATION │      │   STATE      │                │
│   └──────────────┘      └──────────────┘      └──────────────┘                │
│                                                      │                         │
│                                                      ▼                         │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                │
│   │   SCORE      │      │   ANSWER     │      │   QUESTION   │                │
│   │   SCREEN     │ ◄─── │   VALIDATION │ ◄─── │   DISPLAY    │                │
│   │   + REVIEW   │      │   + FUZZY    │      │   + TIMER    │                │
│   └──────────────┘      └──────────────┘      └──────────────┘                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Question Types

Quietude supports three distinct question formats, each designed for different cognitive assessment:

### Multiple Choice Questions (MCQ)

```typescript
interface MCQQuestion {
  type: 'mcq';
  question: string;
  options: string[];      // Array of 4 choices
  correctAnswer: string;  // The correct option text
  explanation: string;    // Why the answer is correct
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MCQ QUESTION                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   What is the primary function of mitochondria?                                 │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  ○  A) Store genetic information                                     │      │
│   ├─────────────────────────────────────────────────────────────────────┤      │
│   │  ●  B) Generate ATP through cellular respiration                     │  ◄── │
│   ├─────────────────────────────────────────────────────────────────────┤      │
│   │  ○  C) Synthesize proteins                                           │      │
│   ├─────────────────────────────────────────────────────────────────────┤      │
│   │  ○  D) Break down waste products                                     │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   [Submit Answer]                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### True/False Questions

```typescript
interface TrueFalseQuestion {
  type: 'true-false';
  question: string;
  correctAnswer: 'true' | 'false';
  explanation: string;
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRUE/FALSE QUESTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Statement:                                                                    │
│   "The mitochondria is often called the powerhouse of the cell."               │
│                                                                                 │
│   ┌────────────────────────┐   ┌────────────────────────┐                     │
│   │                        │   │                        │                     │
│   │         TRUE           │   │        FALSE           │                     │
│   │          ●             │   │          ○             │                     │
│   │                        │   │                        │                     │
│   └────────────────────────┘   └────────────────────────┘                     │
│                                                                                 │
│   [Submit Answer]                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Fill-in-the-Blank Questions

```typescript
interface FillBlankQuestion {
  type: 'fill-blank';
  question: string;       // Contains _____ placeholder
  correctAnswer: string;  // Expected word/phrase
  explanation: string;
  acceptableAnswers?: string[];  // Alternative correct answers
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FILL-IN-THE-BLANK QUESTION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Complete the sentence:                                                        │
│                                                                                 │
│   "The process by which cells convert glucose into ATP is called               │
│    _____________ respiration."                                                  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  cellular                                                            │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   [Submit Answer]                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Learning Phases State Machine

The quiz system operates through a comprehensive state machine with **12 distinct phases**:

```typescript
// src/types/quiz.ts
export type LearningPhase =
  | 'idle'              // No active session
  | 'uploading'         // Content being uploaded
  | 'analyzing'         // Gemini analyzing content
  | 'configuring'       // User selecting quiz options
  | 'generating'        // Questions being generated
  | 'ready'             // Quiz prepared, waiting to start
  | 'active'            // Quiz in progress
  | 'paused'            // User paused the session
  | 'reviewing'         // Reviewing answers post-submission
  | 'completed'         // Session finished
  | 'dig-deeper'        // Generating deeper questions
  | 'error';            // Error state
```

### State Transition Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LEARNING PHASE STATE MACHINE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌────────┐                                         │
│                              │  IDLE  │ ◄──────────────────┐                   │
│                              └───┬────┘                    │                   │
│                                  │ uploadContent()         │                   │
│                                  ▼                         │                   │
│                           ┌───────────┐                    │                   │
│                           │ UPLOADING │                    │                   │
│                           └─────┬─────┘                    │                   │
│                                 │ success                  │                   │
│                                 ▼                          │                   │
│                           ┌───────────┐                    │                   │
│                           │ ANALYZING │                    │                   │
│                           └─────┬─────┘                    │                   │
│                                 │ complete                 │                   │
│                                 ▼                          │                   │
│                          ┌─────────────┐                   │                   │
│                          │ CONFIGURING │                   │                   │
│                          └──────┬──────┘                   │                   │
│                                 │ startQuiz()              │                   │
│                                 ▼                          │                   │
│                          ┌─────────────┐                   │                   │
│                          │ GENERATING  │                   │                   │
│                          └──────┬──────┘                   │                   │
│                                 │ questions ready          │                   │
│                                 ▼                          │                   │
│                            ┌─────────┐                     │                   │
│                            │  READY  │                     │                   │
│                            └────┬────┘                     │                   │
│                                 │ beginQuiz()              │                   │
│                                 ▼                          │                   │
│   ┌──────────┐           ┌───────────┐           ┌────────┴───────┐           │
│   │  PAUSED  │ ◄───────► │  ACTIVE   │ ────────► │   REVIEWING    │           │
│   └──────────┘  toggle   └─────┬─────┘  submit   └───────┬────────┘           │
│                                │                         │                     │
│                                │ timeUp/                 │ digDeeper()         │
│                                │ allAnswered             │                     │
│                                ▼                         ▼                     │
│                          ┌───────────┐           ┌─────────────┐              │
│                          │ COMPLETED │ ◄──────── │ DIG-DEEPER  │              │
│                          └─────┬─────┘           └─────────────┘              │
│                                │                                               │
│                                │ reset()                                       │
│                                └───────────────────────────────────────────────┘
│                                                                                 │
│   ┌─────────┐                                                                   │
│   │  ERROR  │ ◄─── Any state can transition here on failure                    │
│   └─────────┘                                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quiz Generation Flow

### Content Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         QUIZ GENERATION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   STEP 1: CONTENT EXTRACTION                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │  PDF Upload ──► pdf.js parsing ──► Text extraction ──► Clean text      │  │
│   │  URL Input  ──► Fetch content  ──► HTML parsing   ──► Plain text       │  │
│   │  Text Input ──► Direct use     ──► Sanitization   ──► Clean text       │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                       │
│                                         ▼                                       │
│   STEP 2: AI ANALYSIS                                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │  analyzeContent(text) ──► Gemini API ──► ContentAnalysis                │  │
│   │                                                                         │  │
│   │  Returns:                                                               │  │
│   │  {                                                                      │  │
│   │    title: "Chapter 5: Cell Biology",                                    │  │
│   │    subject: "Biology",                                                  │  │
│   │    topics: ["mitochondria", "cell respiration", "ATP"],                 │  │
│   │    difficulty: "intermediate",                                          │  │
│   │    estimatedReadTime: 15                                                │  │
│   │  }                                                                      │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                       │
│                                         ▼                                       │
│   STEP 3: QUESTION GENERATION                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │  generateQuiz(text, config) ──► Gemini API ──► Question[]               │  │
│   │                                                                         │  │
│   │  Config:                        Generated:                              │  │
│   │  {                              [                                       │  │
│   │    questionCount: 10,             { type: "mcq", ... },                 │  │
│   │    difficulty: "medium",          { type: "true-false", ... },          │  │
│   │    questionTypes: ["mcq",         { type: "fill-blank", ... },          │  │
│   │      "true-false",                ...                                   │  │
│   │      "fill-blank"]              ]                                       │  │
│   │  }                                                                      │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Quiz Configuration Options

```typescript
interface QuizConfig {
  questionCount: number;        // 5, 10, 15, or 20
  difficulty: DifficultyLevel;  // 'easy' | 'medium' | 'hard'
  questionTypes: QuestionType[]; // Subset of ['mcq', 'true-false', 'fill-blank']
  timeLimit?: number;           // Minutes (optional)
  shuffleQuestions: boolean;    // Randomize order
  showExplanations: boolean;    // Show after each answer
}
```

---

## Answer Matching System

### Fuzzy Matching Algorithm

For fill-in-the-blank questions, Quietude uses a sophisticated fuzzy matching algorithm based on **Levenshtein distance**:

```typescript
// src/lib/answerMatch.ts

export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  acceptableAnswers: string[] = []
): { isCorrect: boolean; matchType: 'exact' | 'fuzzy' | 'acceptable' | 'none' } {
  
  // Normalize both answers
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);
  
  // Check exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, matchType: 'exact' };
  }
  
  // Check acceptable alternatives
  for (const alt of acceptableAnswers) {
    if (normalizedUser === normalize(alt)) {
      return { isCorrect: true, matchType: 'acceptable' };
    }
  }
  
  // Fuzzy match with Levenshtein distance
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  const similarity = 1 - distance / maxLength;
  
  // Accept if similarity is above threshold (85%)
  if (similarity >= 0.85) {
    return { isCorrect: true, matchType: 'fuzzy' };
  }
  
  return { isCorrect: false, matchType: 'none' };
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ');     // Normalize whitespace
}
```

### Levenshtein Distance Implementation

```typescript
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize first column
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  // Initialize first row
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}
```

### Match Decision Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ANSWER MATCHING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   User Input: "celluar"                                                         │
│   Correct Answer: "cellular"                                                    │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   Step 1: Normalize                                                     │  │
│   │   "celluar" → "celluar"                                                 │  │
│   │   "cellular" → "cellular"                                               │  │
│   │                                                                         │  │
│   │   Step 2: Exact Match?                                                  │  │
│   │   "celluar" === "cellular" → FALSE                                      │  │
│   │                                                                         │  │
│   │   Step 3: Acceptable Alternatives?                                      │  │
│   │   ["cell", "cellular respiration"] → No match                           │  │
│   │                                                                         │  │
│   │   Step 4: Fuzzy Match                                                   │  │
│   │   Levenshtein distance: 1 (missing 'l')                                 │  │
│   │   Similarity: 1 - (1/8) = 0.875 = 87.5%                                 │  │
│   │   Threshold: 85%                                                        │  │
│   │   Result: 87.5% >= 85% → CORRECT (fuzzy)                                │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Output: { isCorrect: true, matchType: 'fuzzy' }                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Scoring and Progression

### Score Calculation

```typescript
interface ScoreBreakdown {
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  passed: boolean;        // >= 75%
  timeBonus: number;      // Bonus for quick completion
  streakBonus: number;    // Bonus for consecutive correct
}

function calculateScore(session: QuizSession): ScoreBreakdown {
  const correct = session.answers.filter(a => a.isCorrect).length;
  const total = session.questions.length;
  const percentage = Math.round((correct / total) * 100);
  
  // Time bonus: Up to 10% extra for finishing in half the time
  const timeUsed = session.endTime - session.startTime;
  const timeAllowed = session.config.timeLimit * 60 * 1000;
  const timeBonus = timeAllowed 
    ? Math.max(0, Math.round(((timeAllowed - timeUsed) / timeAllowed) * 10))
    : 0;
  
  // Streak bonus: 2% per consecutive correct answer
  const streakBonus = calculateStreakBonus(session.answers);
  
  return {
    correct,
    incorrect: total - correct,
    total,
    percentage,
    passed: percentage >= 75,
    timeBonus,
    streakBonus
  };
}
```

### Progression Thresholds

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SCORING THRESHOLDS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Score Range        │ Status          │ Visual Indicator │ Action             │
│   ───────────────────┼─────────────────┼──────────────────┼────────────────────│
│   90-100%            │ Excellent       │ Gold star        │ Unlock dig deeper  │
│   75-89%             │ Passed          │ Green checkmark  │ Suggest dig deeper │
│   60-74%             │ Needs Review    │ Yellow warning   │ Review incorrect   │
│   0-59%              │ Try Again       │ Red indicator    │ Encourage retry    │
│                                                                                 │
│   Pass Threshold: 75%                                                           │
│   Dig Deeper Unlock: 75%+                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Dig Deeper Feature

### Concept

The "Dig Deeper" feature generates **more challenging questions** on topics where the user showed weakness:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DIG DEEPER FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                    COMPLETED QUIZ SESSION                          │        │
│   │                                                                    │        │
│   │   Question 1: Correct   ✓                                          │        │
│   │   Question 2: Incorrect ✗  ──────┐                                 │        │
│   │   Question 3: Correct   ✓        │                                 │        │
│   │   Question 4: Incorrect ✗  ──────┼─► Topics for deeper learning    │        │
│   │   Question 5: Correct   ✓        │                                 │        │
│   │   Question 6: Incorrect ✗  ──────┘                                 │        │
│   │                                                                    │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                                    │                                            │
│                                    ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                    DIG DEEPER GENERATION                           │        │
│   │                                                                    │        │
│   │   Input:                                                           │        │
│   │   - Original content                                               │        │
│   │   - Incorrect question topics                                      │        │
│   │   - User's wrong answers                                           │        │
│   │                                                                    │        │
│   │   Output:                                                          │        │
│   │   - 5 new questions on weak topics                                 │        │
│   │   - Increased difficulty                                           │        │
│   │   - Focus on misconceptions                                        │        │
│   │                                                                    │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/lib/gemini/index.ts
export async function generateDigDeeper(
  content: string,
  incorrectQuestions: Question[],
  userAnswers: Answer[]
): Promise<Question[]> {
  
  const weakTopics = incorrectQuestions.map(q => ({
    question: q.question,
    correctAnswer: q.correctAnswer,
    userAnswer: userAnswers.find(a => a.questionId === q.id)?.answer
  }));
  
  const prompt = buildDigDeeperPrompt(content, weakTopics);
  
  const response = await safeGeminiCall(
    () => model.generateContent(prompt),
    'dig-deeper'
  );
  
  return parseQuizResponse(response);
}
```

---

## Session Management

### Quiz Session Structure

```typescript
// src/types/quiz.ts
export interface QuizSession {
  id: string;
  contentId: string;
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  startTime: number;
  endTime?: number;
  phase: LearningPhase;
  score?: ScoreBreakdown;
  digDeeperSessions: string[];  // IDs of follow-up sessions
}

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;  // milliseconds
  matchType?: 'exact' | 'fuzzy' | 'acceptable';
}
```

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SESSION LIFECYCLE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   CREATE SESSION                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  const session = useQuizStore.getState().createSession({            │      │
│   │    contentId: 'abc123',                                             │      │
│   │    config: { questionCount: 10, difficulty: 'medium', ... }         │      │
│   │  });                                                                │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   START QUIZ                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  useQuizStore.getState().startQuiz();                               │      │
│   │  // Sets phase to 'active', records startTime                       │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   ANSWER QUESTION                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  useQuizStore.getState().answerQuestion(questionId, userAnswer);    │      │
│   │  // Validates answer, stores result, advances to next               │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   SUBMIT QUIZ                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  useQuizStore.getState().submitQuiz();                              │      │
│   │  // Calculates score, sets phase to 'reviewing'                     │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   COMPLETE SESSION                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  useQuizStore.getState().completeSession();                         │      │
│   │  // Sets phase to 'completed', syncs to Firebase                     │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Persistence and Sync

Quiz sessions are persisted locally and synchronized with Firebase:

```typescript
// src/store/quiz.ts
export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // ... state and actions
      
      completeSession: async () => {
        const session = get().currentSession;
        if (!session) return;
        
        // Update local state
        set({
          currentSession: { ...session, phase: 'completed' },
          sessions: [...get().sessions, session]
        });
        
        // Sync to Firebase
        await syncQuizSession(session);
      }
    }),
    {
      name: 'quietude-quiz',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession
      })
    }
  )
);
```

---

## Data Structures

### Complete Type Definitions

```typescript
// src/types/quiz.ts

export type QuestionType = 'mcq' | 'true-false' | 'fill-blank';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];           // MCQ only
  correctAnswer: string;
  explanation: string;
  acceptableAnswers?: string[]; // Fill-blank alternatives
  topic?: string;               // For dig-deeper targeting
  difficulty: DifficultyLevel;
}

export interface QuizConfig {
  questionCount: number;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  timeLimit?: number;
  shuffleQuestions: boolean;
  showExplanations: boolean;
}

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  matchType?: 'exact' | 'fuzzy' | 'acceptable';
  timestamp: number;
}

export interface QuizSession {
  id: string;
  contentId: string;
  contentTitle: string;
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  startTime: number;
  endTime?: number;
  phase: LearningPhase;
  score?: ScoreBreakdown;
  digDeeperSessions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ScoreBreakdown {
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  passed: boolean;
  timeBonus: number;
  streakBonus: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

---

## Summary

The Quietude quiz mechanism provides a **comprehensive learning assessment system**:

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| 3 Question Types | MCQ, True/False, Fill-blank | Diverse assessment |
| 12 Learning Phases | Zustand state machine | Predictable flow |
| Fuzzy Matching | Levenshtein distance | Typo tolerance |
| 75% Pass Threshold | Score calculation | Clear goals |
| Dig Deeper | Weakness targeting | Adaptive learning |
| Session Persistence | localStorage + Firebase | Progress saving |

---

**Related Documentation:**
- [Gemini Mechanism](./GEMINI_MECHANISM.md) - AI question generation
- [Architecture](./ARCHITECTURE.md) - System overview
- [PWA Features](./PWA_FEATURES.md) - Offline capabilities

---

<div align="center">
  <sub>Intelligent assessment for meaningful learning</sub>
</div>
