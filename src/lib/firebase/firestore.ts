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
import { useAuthStore } from '@/store/auth';
import {
  type FirestoreLearningPath,
  type FirestoreQuizSession,
  type FirestoreNote,
  type FirestoreDiscussion,
  type AppLearningPath,
  type AppQuizSession,
  type AppNote,
  type AppDiscussion,
  firestorePathToApp,
  appPathToFirestore,
  firestoreSessionToApp,
  appSessionToFirestore,
  firestoreNoteToApp,
  appNoteToFirestore,
  firestoreDiscussionToApp,
  appDiscussionToFirestore,
  stringToTimestamp,
} from './types';

// ============================================
// Learning Paths
// ============================================

function canAccessUserData(userId: string): boolean {
  const currentUserId = useAuthStore.getState().userId;
  return !!currentUserId && currentUserId === userId;
}

/**
 * Get all learning paths for a user
 */
export async function getLearningPaths(userId: string): Promise<AppLearningPath[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return null;
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
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
  if (!isFirebaseConfigured() || !userId || !pathId || !canAccessUserData(userId)) return false;
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const sessionsRef = collection(db, 'users', userId, 'quizSessions');
    const q = query(sessionsRef, orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return null;
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
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
  if (!isFirebaseConfigured() || !userId || !sessionId || !canAccessUserData(userId)) return false;
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return null;
  
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
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
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
  if (!isFirebaseConfigured() || !userId || !noteId || !canAccessUserData(userId)) return false;
  
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
// Flashcard Decks
// ============================================

/**
 * Get all flashcard decks for a user
 */
export async function getFlashcardDecks(userId: string): Promise<import('./types').AppFlashcardDeck[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const decksRef = collection(db, 'users', userId, 'flashcardDecks');
    const q = query(decksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const { firestoreDeckToApp } = await import('./types');
    return snapshot.docs.map(doc => 
      firestoreDeckToApp(doc.id, doc.data() as import('./types').FirestoreFlashcardDeck)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get flashcard decks:', err);
    return [];
  }
}

/**
 * Get a single flashcard deck
 */
export async function getFlashcardDeck(userId: string, deckId: string): Promise<import('./types').AppFlashcardDeck | null> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return null;
  
  try {
    const db = getFirebaseDb();
    const deckRef = doc(db, 'users', userId, 'flashcardDecks', deckId);
    const deckSnap = await getDoc(deckRef);
    
    if (!deckSnap.exists()) return null;
    
    const { firestoreDeckToApp } = await import('./types');
    return firestoreDeckToApp(deckId, deckSnap.data() as import('./types').FirestoreFlashcardDeck);
  } catch (err) {
    console.error('[Firestore] Failed to get flashcard deck:', err);
    return null;
  }
}

/**
 * Get flashcard decks by topic
 */
export async function getFlashcardDecksByTopic(userId: string, topicId: string): Promise<import('./types').AppFlashcardDeck[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const decksRef = collection(db, 'users', userId, 'flashcardDecks');
    const snapshot = await getDocs(decksRef);
    
    const { firestoreDeckToApp } = await import('./types');
    return snapshot.docs
      .map(doc => firestoreDeckToApp(doc.id, doc.data() as import('./types').FirestoreFlashcardDeck))
      .filter(deck => deck.topicId === topicId);
  } catch (err) {
    console.error('[Firestore] Failed to get flashcard decks by topic:', err);
    return [];
  }
}

/**
 * Create or update a flashcard deck
 */
export async function saveFlashcardDeck(userId: string, deck: import('./types').AppFlashcardDeck): Promise<boolean> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const deckRef = doc(db, 'users', userId, 'flashcardDecks', deck.id);
    
    const { appDeckToFirestore, stringToTimestamp } = await import('./types');
    const firestoreData = appDeckToFirestore(deck);
    
    // Check if exists to set createdAt only on first save
    const existing = await getDoc(deckRef);
    if (!existing.exists()) {
      (firestoreData as any).createdAt = stringToTimestamp(deck.createdAt);
    }
    
    await setDoc(deckRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save flashcard deck:', err);
    return false;
  }
}

/**
 * Delete a flashcard deck and all its cards
 */
export async function deleteFlashcardDeck(userId: string, deckId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !deckId || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    
    // Delete the deck
    const deckRef = doc(db, 'users', userId, 'flashcardDecks', deckId);
    batch.delete(deckRef);
    
    // Delete all cards in the deck
    const cardsRef = collection(db, 'users', userId, 'flashcards');
    const cardsSnapshot = await getDocs(cardsRef);
    cardsSnapshot.docs.forEach(cardDoc => {
      const data = cardDoc.data() as import('./types').FirestoreFlashcard;
      if (data.deckId === deckId) {
        batch.delete(cardDoc.ref);
      }
    });
    
    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete flashcard deck:', err);
    return false;
  }
}

// ============================================
// Flashcards
// ============================================

/**
 * Get all flashcards for a user
 */
export async function getFlashcards(userId: string): Promise<import('./types').AppFlashcard[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const cardsRef = collection(db, 'users', userId, 'flashcards');
    const q = query(cardsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const { firestoreCardToApp } = await import('./types');
    return snapshot.docs.map(doc => 
      firestoreCardToApp(doc.id, doc.data() as import('./types').FirestoreFlashcard)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get flashcards:', err);
    return [];
  }
}

/**
 * Get flashcards by deck
 */
export async function getFlashcardsByDeck(userId: string, deckId: string): Promise<import('./types').AppFlashcard[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const cardsRef = collection(db, 'users', userId, 'flashcards');
    const snapshot = await getDocs(cardsRef);
    
    const { firestoreCardToApp } = await import('./types');
    return snapshot.docs
      .map(doc => firestoreCardToApp(doc.id, doc.data() as import('./types').FirestoreFlashcard))
      .filter(card => card.deckId === deckId);
  } catch (err) {
    console.error('[Firestore] Failed to get flashcards by deck:', err);
    return [];
  }
}

/**
 * Get due flashcards for spaced repetition
 */
export async function getDueFlashcards(userId: string, deckId: string): Promise<import('./types').AppFlashcard[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const cards = await getFlashcardsByDeck(userId, deckId);
    const now = new Date().toISOString();
    return cards.filter(card => card.nextReview <= now);
  } catch (err) {
    console.error('[Firestore] Failed to get due flashcards:', err);
    return [];
  }
}

/**
 * Save a single flashcard
 */
export async function saveFlashcard(userId: string, card: import('./types').AppFlashcard): Promise<boolean> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const cardRef = doc(db, 'users', userId, 'flashcards', card.id);
    
    const { appCardToFirestore, stringToTimestamp } = await import('./types');
    const firestoreData = appCardToFirestore(card);
    
    // Check if exists to set createdAt only on first save
    const existing = await getDoc(cardRef);
    if (!existing.exists()) {
      (firestoreData as any).createdAt = stringToTimestamp(card.createdAt);
    }
    
    await setDoc(cardRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save flashcard:', err);
    return false;
  }
}

/**
 * Save multiple flashcards in a batch
 */
export async function saveFlashcardsBatch(userId: string, cards: import('./types').AppFlashcard[]): Promise<boolean> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId) || cards.length === 0) return false;
  
  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    const { appCardToFirestore, stringToTimestamp } = await import('./types');
    
    // Batch operations directly without getDoc to prevent massive network rate-limiting.
    // The timestamp merge strategy relies on the client's original createdAt string.
    for (const card of cards) {
      const cardRef = doc(db, 'users', userId, 'flashcards', card.id);
      const firestoreData = appCardToFirestore(card);
      (firestoreData as any).createdAt = stringToTimestamp(card.createdAt);
      
      batch.set(cardRef, firestoreData, { merge: true });
    }
    
    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save flashcards batch:', err);
    return false;
  }
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(userId: string, cardId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !cardId || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const cardRef = doc(db, 'users', userId, 'flashcards', cardId);
    await deleteDoc(cardRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete flashcard:', err);
    return false;
  }
}

// ============================================
// Discussions
// ============================================

/**
 * Get all discussions for a user
 */
export async function getDiscussions(userId: string): Promise<AppDiscussion[]> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return [];
  
  try {
    const db = getFirebaseDb();
    const discussionsRef = collection(db, 'users', userId, 'discussions');
    const q = query(discussionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => 
      firestoreDiscussionToApp(doc.id, doc.data() as FirestoreDiscussion)
    );
  } catch (err) {
    console.error('[Firestore] Failed to get discussions:', err);
    return [];
  }
}

/**
 * Create or update a discussion
 */
export async function saveDiscussion(userId: string, discussion: AppDiscussion): Promise<boolean> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const discussionRef = doc(db, 'users', userId, 'discussions', discussion.id);
    
    const firestoreData = appDiscussionToFirestore(discussion);
    
    const existing = await getDoc(discussionRef);
    if (!existing.exists()) {
      (firestoreData as any).createdAt = stringToTimestamp(discussion.createdAt);
    }
    
    await setDoc(discussionRef, firestoreData, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save discussion:', err);
    return false;
  }
}

/**
 * Delete a discussion
 */
export async function deleteDiscussion(userId: string, discussionId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !userId || !discussionId || !canAccessUserData(userId)) return false;
  
  try {
    const db = getFirebaseDb();
    const discussionRef = doc(db, 'users', userId, 'discussions', discussionId);
    await deleteDoc(discussionRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete discussion:', err);
    return false;
  }
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Fetch all user data (paths, sessions, notes, flashcards, discussions) in parallel
 */
export async function fetchAllUserData(userId: string): Promise<{
  paths: AppLearningPath[];
  sessions: AppQuizSession[];
  notes: AppNote[];
  discussions: AppDiscussion[];
  flashcardDecks: import('./types').AppFlashcardDeck[];
  flashcards: import('./types').AppFlashcard[];
} | null> {
  if (!isFirebaseConfigured() || !canAccessUserData(userId)) return null;
  
  try {
    const [paths, sessions, notes, discussions, flashcardDecks, flashcards] = await Promise.all([
      getLearningPaths(userId),
      getQuizSessions(userId),
      getNotes(userId),
      getDiscussions(userId),
      getFlashcardDecks(userId),
      getFlashcards(userId),
    ]);
    
    return { paths, sessions, notes, discussions, flashcardDecks, flashcards };
  } catch (err) {
    console.error('[Firestore] Failed to fetch all user data:', err);
    return null;
  }
}
