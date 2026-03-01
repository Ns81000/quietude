# Gemini AI Mechanism

[![Back to README](https://img.shields.io/badge/←_Back_to-README-6366F1?style=flat-square)](../README.md)
[![Architecture](https://img.shields.io/badge/→_Architecture-10B981?style=flat-square)](ARCHITECTURE.md)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square)](https://ai.google.dev/)

---

## Table of Contents

- [Overview](#overview)
- [Key Pool Management](#key-pool-management)
- [Prompt Engineering](#prompt-engineering)
- [Response Parsing](#response-parsing)
- [Caching Layer](#caching-layer)
- [Multimodal Processing](#multimodal-processing)
- [Error Handling](#error-handling)
- [API Functions](#api-functions)

---

## Overview

The Gemini AI mechanism is the intelligence core of Quietude, responsible for:

1. **Content Analysis** — Analyzing uploaded study material to identify topics
2. **Quiz Generation** — Creating contextually relevant questions
3. **Notes Generation** — Producing comprehensive study notes
4. **Answer Evaluation** — Evaluating fill-in-blank responses (fuzzy matching)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEMINI AI ENGINE                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     KEY POOL MANAGER                                 │   │
│  │                                                                      │   │
│  │   Key 1    Key 2    Key 3    Key 4    Key 5    Key 6                │   │
│  │   [████]   [████]   [██░░]   [░░░░]   [████]   [████]               │   │
│  │   Active   Active   50%      Exhausted Active   Active              │   │
│  │                                                                      │   │
│  │   • Automatic rotation based on usage                               │   │
│  │   • Instant failover on quota errors (429)                          │   │
│  │   • 24-hour cooldown for exhausted keys                             │   │
│  │   • Health tracking per key                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Prompt    │───▶│   Gemini    │───▶│   Response  │───▶│   Cache     │  │
│  │   Builder   │    │   API Call  │    │   Parser    │    │   Layer     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Pool Management

The key pool manager enables production-grade reliability by supporting multiple API keys with intelligent rotation.

### Configuration

Keys are loaded from environment variables:

```typescript
const API_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
  import.meta.env.VITE_GEMINI_KEY_5,
  import.meta.env.VITE_GEMINI_KEY_6,
].filter(Boolean) as string[];
```

### Key State Structure

Each key maintains its own state:

```typescript
interface KeyState {
  index: number;           // Key position in array
  requestsToday: number;   // Requests made today
  lastUsed: number;        // Timestamp of last use
  lastError: string | null;
  lastErrorTime: number | null;
  consecutiveErrors: number;
  isExhausted: boolean;    // True if quota limit hit
  exhaustedAt: number | null;
  resetAt: number;         // Next midnight UTC
}
```

### Key Selection Algorithm

```
┌───────────────────────────────────────────────────────────────┐
│                    KEY SELECTION FLOW                         │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Filter Keys    │
                    │                 │
                    │  Remove:        │
                    │  • Exhausted    │
                    │  • Too many     │
                    │    errors (≥3)  │
                    │  • At daily     │
                    │    limit        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Sort by        │
                    │  Preference     │
                    │                 │
                    │  1. Fewer       │
                    │     errors      │
                    │  2. Lower       │
                    │     usage       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Select First   │
                    │  Available      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Update Usage   │
                    │  Counter        │
                    └─────────────────┘
```

### Exhaustion Handling

When a key hits quota limits:

```typescript
function markKeyError(index: number, error: string, isQuotaError: boolean): void {
  updateKeyStates(states =>
    states.map(s => {
      if (s.index !== index) return s;
      
      if (isQuotaError) {
        // Mark as exhausted for 24 hours
        return {
          ...s,
          isExhausted: true,
          exhaustedAt: Date.now(),
          consecutiveErrors: s.consecutiveErrors + 1,
        };
      }
      
      return {
        ...s,
        lastError: error,
        consecutiveErrors: s.consecutiveErrors + 1,
      };
    })
  );
}
```

### Daily Reset

Keys automatically reset at midnight UTC:

```typescript
function loadKeyStates(): KeyState[] {
  const states = JSON.parse(stored);
  const now = Date.now();
  
  return states.map(existing => {
    // Reset if past midnight
    if (now >= existing.resetAt) {
      return {
        ...existing,
        requestsToday: 0,
        consecutiveErrors: 0,
        isExhausted: false,
        exhaustedAt: null,
        resetAt: getNextMidnight(),
      };
    }
    return existing;
  });
}
```

---

## Prompt Engineering

Quietude uses carefully crafted prompts for each AI operation to ensure consistent, high-quality responses.

### Analysis Prompt

Used to analyze uploaded content and determine if a study plan is needed:

```typescript
export function buildAnalysisPrompt(): string {
  return `
You are analysing study material uploaded by a student.

Determine:
1. Whether this content needs a structured study plan (multiple topics) or is a single topic.
2. If a study plan is needed, extract an ordered list of topics.
3. Classify the subject, education level, and topic type.

Respond ONLY with valid JSON. No preamble. No markdown fences.

Schema:
{
  "needsStudyPlan": boolean,
  "subject": "string",
  "educationLevel": "High School | Undergraduate | Postgraduate | Professional | Other",
  "topicType": "factual | conceptual | procedural | mixed",
  "topics": [
    {
      "id": number,
      "title": "string — specific, not generic",
      "difficulty": "foundation | intermediate | advanced",
      "estimatedQuestions": number (5–15),
      "summary": "string — one sentence"
    }
  ]
}

If needsStudyPlan is false, return topics as [].
Topics must be ordered foundational to advanced. Maximum 12. Minimum 2 if needsStudyPlan is true.
Topic titles must be specific: not "Introduction" but "Cell Structure and Organelles".
`.trim();
}
```

### Quiz Generation Prompt

Creates questions based on topic and configuration:

```typescript
export function buildQuizPrompt(params: {
  topicTitle: string;
  topicSummary: string;
  questionCount: number;
  types: QuestionType[];
  difficulty: Difficulty;
  isDigDeeper: boolean;
  isRetake: boolean;
  sourceContent?: string;
}): string {
  const difficultyDesc =
    difficulty === "foundation"
      ? "straightforward, factual"
      : difficulty === "intermediate"
      ? "requires understanding and some application"
      : "requires analysis and synthesis";

  return `
You are generating quiz questions for a student studying: ${topicTitle}
Topic summary: ${topicSummary}
${sourceContent ? `\nSource content:\n${sourceContent.slice(0, 8000)}\n` : ""}
${isDigDeeper ? "DIG DEEPER: Focus on application, analysis, synthesis." : ""}
${isRetake ? "RETAKE: Generate different questions. Do not repeat." : ""}

Generate exactly ${questionCount} questions.
Difficulty: ${difficultyDesc}.

IMPORTANT - Question type requirement:
${typeDistribution}
Allowed types: ${types.join(", ")}

Respond ONLY with valid JSON. No preamble. No markdown fences.

Schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq | true_false | fill_blank",
      "text": "question text",
      "options": ["A","B","C","D"],       // MCQ only
      "correct": 0,                        // MCQ: index, T/F: 0 or 1
      "blank_answer": "string",            // fill_blank only
      "explanation": "one to two sentences"
    }
  ]
}

MCQ distractors must be plausible — not obviously wrong.
Fill in the blank: underscore count must match answer length.
`.trim();
}
```

### Notes Generation Prompt

Creates comprehensive study notes for failed quizzes:

```typescript
export function buildNotesPrompt(
  topicTitle: string,
  topicSummary: string,
  sourceContent?: string
): string {
  return `
Generate study notes for a student who scored below 75% on: ${topicTitle}
Topic summary: ${topicSummary}
${sourceContent ? `\nSource content:\n${sourceContent.slice(0, 8000)}\n` : ""}

Rules:
- H1 for topic title, H2 for major sections, H3 for sub-points
- Plain, direct English. No filler. No academic padding.
- At least one concrete example or analogy per major section
- Key terms in <strong> tags — used sparingly
- End with "Key Takeaways": exactly 4–5 bullet points
- No emoji. Use plain hyphens for lists.
- Length: 400–800 words depending on topic complexity.

Respond ONLY with clean HTML. No markdown. No code fences. Start with <h1>.
Allowed tags: h1, h2, h3, p, strong, em, ul, li, ol, blockquote
`.trim();
}
```

### Evaluation Prompt

For fill-in-blank answer checking (used as fallback):

```typescript
export function buildEvalPrompt(
  question: string,
  blankAnswer: string,
  userAnswer: string
): string {
  return `
Fill-in-the-blank evaluation.

Question: ${question}
Correct answer: ${blankAnswer}
Student answer: ${userAnswer}

Accept: minor spelling errors, synonyms with the same meaning, different capitalisation.
Reject: clearly wrong terms, answers that change the meaning.

Respond ONLY with valid JSON:
{ "correct": true | false, "reason": "one short sentence" }
`.trim();
}
```

---

## Response Parsing

All Gemini responses are parsed and validated before use.

### JSON Extraction

Handles various response formats:

```typescript
export function parseJSON<T>(text: string): T {
  // Strip markdown code fences
  let cleaned = text.trim();
  
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    cleaned = cleaned.slice(firstNewline + 1);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // Try to extract JSON from the text
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    throw new Error(`Failed to parse JSON response`);
  }
}
```

### Analysis Response Parser

```typescript
export interface AnalysisResponse {
  needsStudyPlan: boolean;
  subject: string;
  educationLevel: string;
  topicType: string;
  topics: Array<{
    id: number;
    title: string;
    difficulty: "foundation" | "intermediate" | "advanced";
    estimatedQuestions: number;
    summary: string;
  }>;
}

export function parseAnalysisResponse(text: string): AnalysisResponse {
  const data = parseJSON<AnalysisResponse>(text);
  
  // Validate required fields
  if (typeof data.needsStudyPlan !== "boolean") {
    throw new Error("Invalid analysis response: missing needsStudyPlan");
  }
  
  if (data.needsStudyPlan && data.topics.length < 2) {
    throw new Error("Study plan requires at least 2 topics");
  }
  
  // Apply defaults for missing fields
  data.topics?.forEach(topic => {
    if (!["foundation", "intermediate", "advanced"].includes(topic.difficulty)) {
      topic.difficulty = "intermediate";
    }
    if (!topic.estimatedQuestions || topic.estimatedQuestions < 5) {
      topic.estimatedQuestions = 10;
    }
  });
  
  return data;
}
```

### Quiz Response Parser

```typescript
export function parseQuizResponse(text: string): QuizResponse {
  const data = parseJSON<{ questions: Record<string, unknown>[] }>(text);
  
  const validTypes: QuestionType[] = ["mcq", "true_false", "fill_blank"];
  
  const questions: Question[] = data.questions.map((q, index) => {
    const type = q.type as QuestionType;
    
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid question type at index ${index}: ${type}`);
    }
    
    switch (type) {
      case "mcq":
        return {
          id: q.id || `q${index + 1}`,
          type,
          text: q.text as string,
          options: q.options as string[],
          correct: q.correct as number,
          explanation: q.explanation as string,
        };
      
      case "true_false":
        return {
          id: q.id || `q${index + 1}`,
          type,
          text: q.text as string,
          correct: (q.correct as number) as 0 | 1,
          explanation: q.explanation as string,
        };
      
      case "fill_blank":
        return {
          id: q.id || `q${index + 1}`,
          type,
          text: q.text as string,
          blank_answer: q.blank_answer as string,
          explanation: q.explanation as string,
        };
    }
  });
  
  return { questions };
}
```

---

## Caching Layer

Responses are cached in localStorage to minimize API calls and improve performance.

### Cache Structure

```typescript
const CACHE_PREFIX = "quietude_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedItem<T> {
  data: T;
  timestamp: number;
}
```

### Cache Operations

```typescript
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    
    const { data, timestamp } = JSON.parse(raw);
    
    // Check TTL
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full or unavailable
  }
}
```

### What Gets Cached

| Operation | Cached? | Cache Key | Rationale |
|-----------|---------|-----------|-----------|
| Content Analysis | Yes | `analysis_${hash(content)}` | Same content = same topics |
| File Analysis | Yes | `file_${hash(name+size+modified)}` | File metadata as key |
| Quiz Generation | No | — | Users expect fresh questions |
| Notes Generation | Yes | `notes_${hash(title+summary)}` | Notes don't change per topic |
| Answer Evaluation | No | — | Answers vary |

---

## Multimodal Processing

Quietude supports analyzing images, PDFs, and audio files using Gemini's multimodal capabilities.

### Supported File Types

```typescript
export function getSupportedMimeTypes(): string[] {
  return [
    // Images
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
    // PDFs
    "application/pdf",
    // Audio
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    // Text
    "text/plain",
    "text/markdown",
  ];
}
```

### File to Base64 Conversion

```typescript
export async function fileToGenerativePart(
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### File Analysis Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Upload   │────▶│  Check Cache    │────▶│  Cache Hit?     │
│   (PDF/Image/   │     │  (file hash)    │     │                 │
│    Audio)       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                               ┌─────────────────────────┴───────┐
                               │                                 │
                               ▼                                 ▼
                        ┌─────────────────┐              ┌─────────────────┐
                        │   Cache Miss    │              │   Return        │
                        │   Convert to    │              │   Cached        │
                        │   Base64        │              │   Result        │
                        └────────┬────────┘              └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Combined      │
                        │   Extraction +  │
                        │   Analysis      │
                        │   Prompt        │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Gemini API    │
                        │   (multimodal)  │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Parse &       │
                        │   Cache Result  │
                        └─────────────────┘
```

---

## Error Handling

### Safe API Call Wrapper

All Gemini calls go through the `safeGeminiCall` wrapper:

```typescript
export async function safeGeminiCall<T>(
  fn: (model: GenerativeModel) => Promise<T>,
  maxRetries: number = 2,
  timeoutMs: number = 60000,
  modelName: string = "gemini-2.5-flash"
): Promise<T> {
  const triedKeys: number[] = [];
  let lastError: Error | null = null;
  
  while (true) {
    const selected = selectKey(triedKeys);
    
    if (!selected) {
      throw new Error("QUOTA_EXHAUSTED: All API keys failed.");
    }
    
    triedKeys.push(selected.index);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = getClientWithKey(selected.index);
        const model = client.getGenerativeModel({ model: modelName });
        
        const result = await withTimeout(fn(model), timeoutMs);
        
        markKeySuccess(selected.index);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        if (isQuotaError(lastError)) {
          markKeyError(selected.index, lastError.message, true);
          break; // Try next key
        }
        
        if (!isRetryableError(lastError)) {
          throw new Error(`API_ERROR: ${lastError.message}`);
        }
        
        markKeyError(selected.index, lastError.message, false);
        
        if (attempt < maxRetries) {
          await sleep(300 * (attempt + 1));
        }
      }
    }
    
    if (triedKeys.length >= API_KEYS.length) {
      throw lastError || new Error("All API keys exhausted");
    }
  }
}
```

### Error Classification

```typescript
function isQuotaError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("resource exhausted")
  );
}

function isRetryableError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  // Don't retry invalid content, auth errors
  if (message.includes("invalid") || 
      message.includes("400") || 
      message.includes("401") || 
      message.includes("403")) {
    return false;
  }
  return true;
}
```

### Timeout Handling

```typescript
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`TIMEOUT: Request timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
```

---

## API Functions

### High-Level Functions

| Function | Description | Cached |
|----------|-------------|--------|
| `analyzeContent(content)` | Analyze text content for topics | Yes |
| `analyzeFile(file)` | Analyze file with multimodal | Yes |
| `quickAnalyze(content)` | Quick single-topic analysis | Yes |
| `generateQuiz(params)` | Generate quiz questions | No |
| `generateNotes(params)` | Generate study notes | Yes |
| `evaluateAnswer(params)` | Evaluate fill-in-blank | No |
| `processFile(file)` | Extract text from file | No |

### Usage Example

```typescript
import { 
  analyzeContent, 
  generateQuiz, 
  generateNotes,
  hasApiKeys 
} from '@/lib/gemini';

// Check if API is configured
if (!hasApiKeys()) {
  // Fall back to mock data
  return getMockAnalysis(content);
}

// Analyze content
const analysis = await analyzeContent(uploadedText);

// Generate quiz
const questions = await generateQuiz({
  topicTitle: "Cell Biology",
  topicSummary: "Introduction to cellular structures",
  questionCount: 10,
  types: ["mcq", "true_false", "fill_blank"],
  difficulty: "intermediate",
  isDigDeeper: false,
  isRetake: false,
  sourceContent: uploadedText,
});

// Generate notes
const notesHtml = await generateNotes({
  topicTitle: "Cell Biology",
  topicSummary: "Introduction to cellular structures",
  sourceContent: uploadedText,
});
```

### Mock Fallbacks

When no API keys are configured, the system provides mock data:

```typescript
export function getMockQuestions(count: number, types: QuestionType[]): Question[] {
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    
    switch (type) {
      case "mcq":
        questions.push({
          id: `q${i + 1}`,
          type: "mcq",
          text: `Sample question ${i + 1}: What is the correct answer?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct: Math.floor(Math.random() * 4),
          explanation: "This is the explanation for the correct answer.",
        });
        break;
      // ... other types
    }
  }
  
  return questions;
}
```

---

## Quota Management

### Checking Quota Status

```typescript
export function getQuotaStatus(): {
  available: number;
  total: number;
  keysTotal: number;
  keysAvailable: number;
  keysExhausted: number;
  details: Array<{
    index: number;
    requests: number;
    isExhausted: boolean;
    hasErrors: boolean;
  }>;
} {
  const states = getKeyStates();
  const totalCapacity = API_KEYS.length * DAILY_LIMIT;
  const used = states.reduce((sum, s) => sum + s.requestsToday, 0);
  
  return {
    available: totalCapacity - used,
    total: totalCapacity,
    keysTotal: API_KEYS.length,
    keysAvailable: states.filter(s => !s.isExhausted).length,
    keysExhausted: states.filter(s => s.isExhausted).length,
    details: states.map(s => ({
      index: s.index,
      requests: s.requestsToday,
      isExhausted: s.isExhausted,
      hasErrors: s.consecutiveErrors > 0,
    })),
  };
}
```

### Clearing Quota Cache

For debugging or after adding new keys:

```typescript
export function clearQuotaCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    keyStatesCache = null;
    console.log("[Gemini] Key states cache cleared");
  } catch {
    // Ignore
  }
}
```

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [Architecture](ARCHITECTURE.md) | System design overview |
| [Quiz Mechanism](QUIZ_MECHANISM.md) | Quiz flow and question handling |
| [State Management](STATE_MANAGEMENT.md) | Zustand store patterns |

---

[![Back to Top](https://img.shields.io/badge/↑_Back_to_Top-6366F1?style=flat-square)](#gemini-ai-mechanism)
