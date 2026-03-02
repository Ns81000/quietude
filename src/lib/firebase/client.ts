/**
 * Firebase Client Configuration
 * 
 * Initializes Firebase app with Firestore and Auth.
 * Uses environment variables for configuration.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  type Auth 
} from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore 
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we have valid configuration
const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  !firebaseConfig.apiKey.includes('placeholder')
);

if (!hasValidConfig) {
  console.warn(
    '[Firebase] Missing or invalid environment variables. Running in offline-only mode.',
    '\nSet VITE_FIREBASE_* variables in your .env file.'
  );
}

// Initialize Firebase app (singleton)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (hasValidConfig) {
  // Check if app already initialized (for HMR)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  
  // Initialize Firestore with persistent local cache (new API, replaces deprecated enableIndexedDbPersistence)
  // This enables offline persistence with multi-tab support
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  
  console.log('[Firebase] Initialized with offline persistence (multi-tab)');
  
  // Set auth persistence to local storage (survives browser close)
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase] Failed to set auth persistence:', err);
  });
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check your environment variables.');
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not configured. Check your environment variables.');
  }
  return db;
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return hasValidConfig && app !== null;
}

/**
 * Check connection to Firebase (auth check)
 */
export async function checkConnection(): Promise<boolean> {
  if (!isFirebaseConfigured() || !auth) return false;
  
  try {
    // Auth state check is instant if we have cached auth
    await auth.authStateReady();
    return true;
  } catch (err) {
    console.error('[Firebase] Connection check failed:', err);
    return false;
  }
}

// Export instances for direct access (use with caution)
export { app, auth, db };
