/**
 * Firebase Module Exports
 * 
 * Central export for all Firebase functionality.
 * Import from '@/lib/firebase' for clean imports.
 */

// Client initialization
export {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from './client';

// Types
export type {
  FirestoreUser,
  FirestoreLearningPath,
  FirestoreQuizSession,
  FirestoreNote,
  AppUser,
  AppLearningPath,
  AppQuizSession,
  AppNote,
} from './types';

// Type converters
export {
  firestoreUserToApp,
  firestorePathToApp,
  appPathToFirestore,
  firestoreSessionToApp,
  appSessionToFirestore,
  firestoreNoteToApp,
  appNoteToFirestore,
} from './types';

// Authentication
export {
  // Magic Link
  sendMagicLink,
  handleMagicLinkSignIn,
  
  // Custom OTP
  sendOTP,
  verifyOTP,
  
  // Session management
  getStoredSession,
  validateSession,
  logout,
  
  // Profile
  getUserProfile,
  updateUserProfile,
} from './auth';

// Firestore CRUD
export {
  // Learning Paths
  getLearningPaths,
  saveLearningPath,
  deleteLearningPath,
  
  // Quiz Sessions
  getQuizSessions,
  saveQuizSession,
  deleteQuizSession,
  
  // Notes
  getNotes,
  saveNote,
  deleteNote,
  
  // Bulk operations
  fetchAllUserData,
} from './firestore';

// Sync
export {
  type SyncStatus,
  subscribeSyncStatus,
  clearAllIndexedDB,
  clearSyncQueue,
  syncLearningPath,
  syncQuizSession,
  syncNote,
  syncDelete,
  removeFromSyncQueueByPathId,
  forceSync,
  processSyncQueue,
  getLastSyncTime,
  getPendingSyncCount,
} from './sync';
