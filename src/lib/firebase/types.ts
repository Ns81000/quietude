/**
 * Firebase TypeScript Types
 * 
 * Defines types for Firestore documents that map to the app's data models.
 * Uses camelCase field names (Firebase convention).
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================
// Firestore Document Types (as stored in DB)
// ============================================

/**
 * User profile document
 * Path: /users/{userId}
 */
export interface FirestoreUser {
  email: string;
  name: string | null;
  studyField: string | null;
  learnStyle: string | null;
  studyTime: string | null;
  isOnboarded: boolean;
  themeMood: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Learning path document
 * Path: /users/{userId}/learningPaths/{pathId}
 */
export interface FirestoreLearningPath {
  title: string | null;
  subject: string;
  educationLevel: string | null;
  topicType: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceText: string | null;
  sourceFileName: string | null;
  topicMap: Record<string, unknown> | null;
  topics: Array<{
    id: string;
    pathId: string;
    title: string;
    difficulty: string;
    estimatedQuestions: number;
    orderIndex: number;
    isLocked: boolean;
    summary: string;
    sourceContent?: string;
  }>;
  needsStudyPlan: boolean;
  status: 'active' | 'completed' | 'archived';
  currentTopicId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Quiz session document
 * Path: /users/{userId}/quizSessions/{sessionId}
 */
export interface FirestoreQuizSession {
  topicId: string;
  pathId: string;
  subject: string | null;
  isDigDeeper: boolean;
  isRetake: boolean;
  config: {
    count: number;
    timeLimit: number | null;
    types: string[];
    difficulty: string;
  };
  questions: Array<{
    id: string;
    type: string;
    text: string;
    options?: string[];
    correct?: number;
    blankAnswer?: string;
    explanation: string;
  }>;
  answers: Array<{
    questionId: string;
    selected: number | string | null;
    isCorrect: boolean;
  }>;
  score: number | null;
  total: number;
  scorePct: number | null;
  passed: boolean | null;
  startedAt: Timestamp;
  submittedAt: Timestamp | null;
  timeTakenSecs: number | null;
}

/**
 * Note document
 * Path: /users/{userId}/notes/{noteId}
 */
export interface FirestoreNote {
  topicId: string;
  topicTitle: string;
  subject: string;
  contentHtml: string;
  sessionId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// App Types (as used in frontend)
// These mirror the existing app types
// ============================================

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  studyField: string | null;
  learnStyle: string | null;
  studyTime: string | null;
  isOnboarded: boolean;
  themeMood: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppLearningPath {
  id: string;
  user_id: string;
  title?: string;
  subject: string;
  education_level: string;
  topic_type: string;
  source_type?: string;
  source_url?: string | null;
  source_text?: string;
  source_file_name?: string;
  topic_map?: { needsStudyPlan: boolean; topics: Array<unknown> };
  topics?: Array<{
    id: string;
    path_id: string;
    title: string;
    difficulty: string;
    estimated_questions: number;
    order_index: number;
    is_locked: boolean;
    summary: string;
    source_content?: string;
  }>;
  needs_study_plan: boolean;
  status: 'active' | 'completed' | 'archived';
  current_topic_id?: string | null;
  created_at: string;
}

export interface AppQuizSession {
  id: string;
  user_id: string;
  topic_id: string;
  path_id: string;
  subject?: string;
  is_dig_deeper: boolean;
  is_retake: boolean;
  config: {
    count: number;
    timeLimit: number | null;
    types: string[];
    difficulty: string;
  };
  questions: Array<unknown>;
  answers: Array<unknown>;
  score: number | null;
  total: number;
  score_pct: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_secs: number | null;
}

export interface AppNote {
  id: string;
  topic_id: string;
  topic_title: string;
  subject: string;
  content_html: string;
  session_id?: string;
  created_at: string;
}

// ============================================
// Converter Functions
// ============================================

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

/**
 * Convert Firestore timestamp to ISO string
 */
export function timestampToString(timestamp: Timestamp | null): string {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
}

/**
 * Convert ISO string to Firestore timestamp
 */
export function stringToTimestamp(dateString: string): Timestamp {
  return FirebaseTimestamp.fromDate(new Date(dateString));
}

/**
 * Convert Firestore user to app user
 */
export function firestoreUserToApp(id: string, data: FirestoreUser): AppUser {
  return {
    id,
    email: data.email,
    name: data.name,
    studyField: data.studyField,
    learnStyle: data.learnStyle,
    studyTime: data.studyTime,
    isOnboarded: data.isOnboarded,
    themeMood: data.themeMood,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

/**
 * Convert Firestore learning path to app learning path
 */
export function firestorePathToApp(id: string, userId: string, data: FirestoreLearningPath): AppLearningPath {
  return {
    id,
    user_id: userId,
    title: data.title || undefined,
    subject: data.subject,
    education_level: data.educationLevel || '',
    topic_type: data.topicType || '',
    source_type: data.sourceType || undefined,
    source_url: data.sourceUrl,
    source_text: data.sourceText || undefined,
    source_file_name: data.sourceFileName || undefined,
    topic_map: data.topicMap as any,
    topics: (data.topics || []).map(t => ({
      id: t.id,
      path_id: t.pathId,
      title: t.title,
      difficulty: t.difficulty,
      estimated_questions: t.estimatedQuestions,
      order_index: t.orderIndex,
      is_locked: t.isLocked,
      summary: t.summary,
      source_content: t.sourceContent,
    })),
    needs_study_plan: data.needsStudyPlan,
    status: data.status,
    current_topic_id: data.currentTopicId,
    created_at: timestampToString(data.createdAt),
  };
}

/**
 * Convert app learning path to Firestore format
 */
export function appPathToFirestore(path: AppLearningPath): Omit<FirestoreLearningPath, 'createdAt'> & { createdAt?: Timestamp; updatedAt: Timestamp } {
  return {
    title: path.title || null,
    subject: path.subject,
    educationLevel: path.education_level || null,
    topicType: path.topic_type || null,
    sourceType: path.source_type || null,
    sourceUrl: path.source_url || null,
    sourceText: path.source_text || null,
    sourceFileName: path.source_file_name || null,
    topicMap: path.topic_map as any || null,
    topics: (path.topics || []).map(t => ({
      id: t.id,
      pathId: t.path_id,
      title: t.title,
      difficulty: t.difficulty,
      estimatedQuestions: t.estimated_questions,
      orderIndex: t.order_index,
      isLocked: t.is_locked,
      summary: t.summary,
      sourceContent: t.source_content,
    })),
    needsStudyPlan: path.needs_study_plan,
    status: path.status,
    currentTopicId: path.current_topic_id || null,
    updatedAt: FirebaseTimestamp.now(),
  };
}

/**
 * Convert Firestore quiz session to app format
 */
export function firestoreSessionToApp(id: string, userId: string, data: FirestoreQuizSession): AppQuizSession {
  return {
    id,
    user_id: userId,
    topic_id: data.topicId,
    path_id: data.pathId,
    subject: data.subject || '',
    is_dig_deeper: data.isDigDeeper,
    is_retake: data.isRetake,
    config: data.config as any,
    questions: data.questions as any,
    answers: data.answers as any,
    score: data.score,
    total: data.total,
    score_pct: data.scorePct,
    passed: data.passed,
    started_at: timestampToString(data.startedAt),
    submitted_at: data.submittedAt ? timestampToString(data.submittedAt) : null,
    time_taken_secs: data.timeTakenSecs,
  };
}

/**
 * Convert app quiz session to Firestore format
 */
export function appSessionToFirestore(session: AppQuizSession): Omit<FirestoreQuizSession, 'startedAt'> & { startedAt?: Timestamp } {
  return {
    topicId: session.topic_id,
    pathId: session.path_id,
    subject: session.subject || null,
    isDigDeeper: session.is_dig_deeper,
    isRetake: session.is_retake,
    config: session.config as any,
    questions: session.questions as any,
    answers: session.answers as any,
    score: session.score,
    total: session.total,
    scorePct: session.score_pct,
    passed: session.passed,
    submittedAt: session.submitted_at ? stringToTimestamp(session.submitted_at) : null,
    timeTakenSecs: session.time_taken_secs,
  };
}

/**
 * Convert Firestore note to app format
 */
export function firestoreNoteToApp(id: string, data: FirestoreNote): AppNote {
  return {
    id,
    topic_id: data.topicId,
    topic_title: data.topicTitle,
    subject: data.subject,
    content_html: data.contentHtml,
    session_id: data.sessionId || undefined,
    created_at: timestampToString(data.createdAt),
  };
}

/**
 * Convert app note to Firestore format
 */
export function appNoteToFirestore(note: AppNote): Omit<FirestoreNote, 'createdAt'> & { createdAt?: Timestamp; updatedAt: Timestamp } {
  return {
    topicId: note.topic_id,
    topicTitle: note.topic_title,
    subject: note.subject,
    contentHtml: note.content_html,
    sessionId: note.session_id || null,
    updatedAt: FirebaseTimestamp.now(),
  };
}
