/**
 * Firestore Database Operations
 * 
 * CRUD operations for learning paths, quiz sessions, and notes.
 * Uses subcollections under /users/{userId}/ for data isolation.
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './client';
import {
  type FirestoreLearningPath,
  type FirestoreQuizSession,
  type FirestoreNote,
  type AppLearningPath,
  type AppQuizSession,
  type AppNote,
  firestorePathToApp,
  appPathToFirestore,
  firestoreSessionToApp,
  appSessionToFirestore,
  firestoreNoteToApp,
  appNoteToFirestore,
  stringToTimestamp,
} from './types';

// ============================================
// Learning Paths
// ============================================

/**
 * Get all learning paths for a user
 */
export async function getLearningPaths(userId: string): Promise<AppLearningPath[]> {
  if (!isFirebaseConfigured()) return [];
  
  try {
    const db = getFirebaseDb();
    const pathsRef = collection(db, 'users', userId, 'learningPaths');
    const q = query(pathsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => 
      firestorePathToApp(doc.id, userId, doc.data() as FirestoreLearningPath)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get learning paths:', err);
    return [];
  }
}

/**
 * Get a single learning path
 */
export async function getLearningPath(userId: string, pathId: string): Promise<AppLearningPath | null> {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const db = getFirebaseDb();
    const pathRef = doc(db, 'users', userId, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);
    
    if (!pathSnap.exists()) return null;
    
    return firestorePathToApp(pathId, userId, pathSnap.data() as FirestoreLearningPath);
  } catch (err) {
    console.error('[Firestore] Failed to get learning path:', err);
    return null;
  }
}

/**
 * Create or update a learning path
 */
export async function saveLearningPath(userId: string, path: AppLearningPath): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  
  try {
    const db = getFirebaseDb();
    const pathRef = doc(db, 'users', userId, 'learningPaths', path.id);
    
    const firestoreData = appPathToFirestore(path);
    
    // Check if exists to set createdAt only on first save
    const existing = await getDoc(pathRef);
    if (!existing.exists()) {
      (firestoreData as any).createdAt = stringToTimestamp(path.created_at);
    }
    
    await setDoc(pathRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save learning path:', err);
    return false;
  }
}

/**
 * Delete a learning path and all related data
 */
export async function deleteLearningPath(userId: string, pathId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !pathId) return false;
  
  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    
    // Delete the path
    const pathRef = doc(db, 'users', userId, 'learningPaths', pathId);
    batch.delete(pathRef);
    
    // Delete related quiz sessions
    const sessionsRef = collection(db, 'users', userId, 'quizSessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    sessionsSnapshot.docs.forEach(sessionDoc => {
      const data = sessionDoc.data() as FirestoreQuizSession;
      if (data.pathId === pathId) {
        batch.delete(sessionDoc.ref);
      }
    });
    
    // Delete related notes
    const notesRef = collection(db, 'users', userId, 'notes');
    const notesSnapshot = await getDocs(notesRef);
    notesSnapshot.docs.forEach(noteDoc => {
      // Notes don't have pathId directly, but we could check by topicId
      // For now, just delete the path
    });
    
    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete learning path:', err);
    return false;
  }
}

// ============================================
// Quiz Sessions
// ============================================

/**
 * Get all quiz sessions for a user
 */
export async function getQuizSessions(userId: string): Promise<AppQuizSession[]> {
  if (!isFirebaseConfigured()) return [];
  
  try {
    const db = getFirebaseDb();
    const sessionsRef = collection(db, 'users', userId, 'quizSessions');
    const q = query(sessionsRef, orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    console.log('[Firestore] getQuizSessions:', { userId, count: snapshot.docs.length });
    
    return snapshot.docs.map(doc => 
      firestoreSessionToApp(doc.id, userId, doc.data() as FirestoreQuizSession)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get quiz sessions:', err);
    return [];
  }
}

/**
 * Get a single quiz session
 */
export async function getQuizSession(userId: string, sessionId: string): Promise<AppQuizSession | null> {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, 'users', userId, 'quizSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) return null;
    
    return firestoreSessionToApp(sessionId, userId, sessionSnap.data() as FirestoreQuizSession);
  } catch (err) {
    console.error('[Firestore] Failed to get quiz session:', err);
    return null;
  }
}

/**
 * Create or update a quiz session
 */
export async function saveQuizSession(userId: string, session: AppQuizSession): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, 'users', userId, 'quizSessions', session.id);
    
    const firestoreData = appSessionToFirestore(session);
    
    // Check if exists to set startedAt only on first save
    const existing = await getDoc(sessionRef);
    if (!existing.exists()) {
      (firestoreData as any).startedAt = stringToTimestamp(session.started_at);
    }
    
    await setDoc(sessionRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save quiz session:', err);
    return false;
  }
}

/**
 * Delete a quiz session
 */
export async function deleteQuizSession(userId: string, sessionId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !sessionId) return false;
  
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, 'users', userId, 'quizSessions', sessionId);
    await deleteDoc(sessionRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete quiz session:', err);
    return false;
  }
}

// ============================================
// Notes
// ============================================

/**
 * Get all notes for a user
 */
export async function getNotes(userId: string): Promise<AppNote[]> {
  if (!isFirebaseConfigured()) return [];
  
  try {
    const db = getFirebaseDb();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => 
      firestoreNoteToApp(doc.id, doc.data() as FirestoreNote)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get notes:', err);
    return [];
  }
}

/**
 * Get a single note
 */
export async function getNote(userId: string, noteId: string): Promise<AppNote | null> {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const db = getFirebaseDb();
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (!noteSnap.exists()) return null;
    
    return firestoreNoteToApp(noteId, noteSnap.data() as FirestoreNote);
  } catch (err) {
    console.error('[Firestore] Failed to get note:', err);
    return null;
  }
}

/**
 * Create or update a note
 */
export async function saveNote(userId: string, note: AppNote): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  
  try {
    const db = getFirebaseDb();
    const noteRef = doc(db, 'users', userId, 'notes', note.id);
    
    const firestoreData = appNoteToFirestore(note);
    
    // Check if exists to set createdAt only on first save
    const existing = await getDoc(noteRef);
    if (!existing.exists()) {
      (firestoreData as any).createdAt = stringToTimestamp(note.created_at);
    }
    
    await setDoc(noteRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save note:', err);
    return false;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !noteId) return false;
  
  try {
    const db = getFirebaseDb();
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete note:', err);
    return false;
  }
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Fetch all user data (paths, sessions, notes) in parallel
 */
export async function fetchAllUserData(userId: string): Promise<{
  paths: AppLearningPath[];
  sessions: AppQuizSession[];
  notes: AppNote[];
} | null> {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const [paths, sessions, notes] = await Promise.all([
      getLearningPaths(userId),
      getQuizSessions(userId),
      getNotes(userId),
    ]);
    
    return { paths, sessions, notes };
  } catch (err) {
    console.error('[Firestore] Failed to fetch all user data:', err);
    return null;
  }
}
