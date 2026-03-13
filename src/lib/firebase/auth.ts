/**
 * Firebase Authentication
 * 
 * Handles user authentication using Firebase Auth with Email Link (Magic Link).
 * Also supports keeping the current EmailJS OTP flow as an alternative.
 */

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, getDocFromServer, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from './client';
import type { FirestoreUser, AppUser } from './types';
import { firestoreUserToApp } from './types';
import emailjs from '@emailjs/browser';

// ============================================
// Constants
// ============================================

const EMAIL_FOR_SIGN_IN_KEY = 'quietude:emailForSignIn';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Action code settings for magic link
const getActionCodeSettings = () => ({
  // URL to redirect back to after clicking the link
  url: `${window.location.origin}/verify`,
  handleCodeInApp: true,
});

// ============================================
// Magic Link Authentication (Option A)
// ============================================

/**
 * Send magic link to user's email
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }

  try {
    const auth = getFirebaseAuth();
    await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
    
    // Save email to localStorage so we can complete sign-in after redirect
    localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
    
    console.log('[Firebase Auth] Magic link sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase Auth] Failed to send magic link:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send sign-in link' 
    };
  }
}

/**
 * Complete sign-in with magic link
 * Call this on the /verify page when user clicks the link
 */
export async function handleMagicLinkSignIn(): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  isNewUser?: boolean;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }

  try {
    const auth = getFirebaseAuth();
    const url = window.location.href;

    // Check if the URL is a valid sign-in link
    if (!isSignInWithEmailLink(auth, url)) {
      return { success: false, error: 'Invalid sign-in link' };
    }

    // Get the email from localStorage (saved when we sent the link)
    let email = localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
    
    if (!email) {
      // If email is not in localStorage (different browser/device), prompt user
      // For now, we'll return an error - the UI should handle this
      return { success: false, error: 'Please enter your email to complete sign-in' };
    }

    // Complete the sign-in
    const result = await signInWithEmailLink(auth, email, url);
    
    // Clear the stored email
    localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);

    // Check if user profile exists, create if not
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);

    let isNewUser = false;
    if (!userSnap.exists()) {
      // Create new user profile
      isNewUser = true;
      await setDoc(userRef, {
        email: result.user.email,
        name: null,
        studyField: null,
        learnStyle: null,
        studyTime: null,
        isOnboarded: false,
        themeMood: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } satisfies FirestoreUser);
    }

    console.log('[Firebase Auth] Sign-in successful:', result.user.uid);
    return {
      success: true,
      userId: result.user.uid,
      email: result.user.email || email,
      isNewUser,
    };
  } catch (error: any) {
    console.error('[Firebase Auth] Sign-in failed:', error);
    return { 
      success: false, 
      error: error.message || 'Sign-in failed' 
    };
  }
}

// ============================================
// Custom OTP Authentication (Option B)
// Keeps existing EmailJS flow with Firebase backend
// ============================================

function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

function hashOTP(otp: string, email: string): string {
  const data = `${otp}:${email}:${import.meta.env.VITE_OTP_SALT || 'quietude-salt'}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Send OTP via EmailJS (same as before, but stores in localStorage only)
 */
export async function sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
  const otp = generateSecureOTP();
  const otpHash = hashOTP(otp, email);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Store OTP locally (Firebase doesn't need server-side OTP storage)
  localStorage.setItem('quietude:pending_otp', JSON.stringify({
    email,
    hash: otpHash,
    expiresAt,
    attempts: 0,
  }));

  // Also save email for sign-in
  localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      await emailjs.send(serviceId, templateId, {
        to_email: email,
        otp_code: otp,
        app_name: 'Quietude',
        expiry_minutes: OTP_EXPIRY_MINUTES,
      }, publicKey);
      
      return { success: true };
    } catch (err) {
      console.error('[Auth] EmailJS failed:', err);
      return { success: false, error: 'Failed to send verification email. Please try again.' };
    }
  }

  // Demo mode - log OTP to console
  console.log(`[Auth] Demo mode - OTP for ${email}: ${otp}`);
  return { success: true };
}

/**
 * Verify OTP and create/sign-in user
 */
export async function verifyOTP(email: string, otp: string): Promise<{
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase is not configured' };
  }

  const submittedHash = hashOTP(otp, email);
  
  // Validate against local stored OTP
  const stored = localStorage.getItem('quietude:pending_otp');
  if (!stored) {
    return { success: false, error: 'No verification code found. Please request a new one.' };
  }

  try {
    const pending = JSON.parse(stored);
    
    if (pending.email !== email) {
      return { success: false, error: 'Email mismatch. Please request a new code.' };
    }
    
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      return { success: false, error: 'Too many attempts. Please request a new code.' };
    }

    if (new Date(pending.expiresAt) < new Date()) {
      return { success: false, error: 'Code expired. Please request a new one.' };
    }

    pending.attempts++;
    localStorage.setItem('quietude:pending_otp', JSON.stringify(pending));

    if (pending.hash !== submittedHash) {
      return { success: false, error: 'Invalid verification code.' };
    }

    // OTP is valid - now we need to authenticate with Firebase
    // Since we're using custom OTP, we'll use custom token or just create/update user directly
    // For simplicity, we'll check if user exists in Firestore and create if not
    
    const db = getFirebaseDb();
    
    // Generate a consistent userId from email
    const userId = await getOrCreateUserId(email);
    
    // Clear OTP
    localStorage.removeItem('quietude:pending_otp');
    
    // Store session locally
    localStorage.setItem('quietude:session', JSON.stringify({
      userId,
      email,
      createdAt: new Date().toISOString(),
    }));

    console.log('[Firebase Auth] OTP verified for:', email);
    
    // Check if new user
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const isNewUser = !userSnap.exists();
    
    if (isNewUser) {
      await setDoc(userRef, {
        email,
        name: null,
        studyField: null,
        learnStyle: null,
        studyTime: null,
        isOnboarded: false,
        themeMood: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } satisfies FirestoreUser);
    }

    return { success: true, userId, isNewUser };
  } catch (error) {
    console.error('[Auth] OTP verification failed:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Generate consistent user ID from email
 */
async function getOrCreateUserId(email: string): Promise<string> {
  // Use a hash of the email as a consistent ID
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Take first 28 chars and format as UUID-like string
  return `${hashHex.slice(0, 8)}-${hashHex.slice(8, 12)}-${hashHex.slice(12, 16)}-${hashHex.slice(16, 20)}-${hashHex.slice(20, 32)}`;
}

// ============================================
// Session Management
// ============================================

export interface StoredSession {
  userId: string;
  email: string;
  createdAt: string;
}

/**
 * Get stored session from localStorage
 */
export function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem('quietude:session');
    if (!stored) return null;
    return JSON.parse(stored) as StoredSession;
  } catch {
    return null;
  }
}

/**
 * Validate current session
 */
export async function validateSession(): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
}> {
  // Check local session
  const session = getStoredSession();
  if (session) {
    return { valid: true, userId: session.userId, email: session.email };
  }
  
  // Check Firebase Auth state
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        return { valid: true, userId: user.uid, email: user.email || undefined };
      }
    } catch {
      // Auth not ready
    }
  }
  
  return { valid: false };
}

/**
 * Sign out user
 */
export async function logout(): Promise<void> {
  // Clear local session
  localStorage.removeItem('quietude:session');
  localStorage.removeItem('quietude:pending_otp');
  localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  
  // Sign out from Firebase if using magic link
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out error:', err);
    }
  }
}

// ============================================
// User Profile Operations
// ============================================

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<AppUser | null> {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', userId);
    
    // Try to get fresh data from server first to avoid stale cache issues
    // This is critical for onboarding status which may have just been updated
    let userSnap;
    try {
      userSnap = await getDocFromServer(userRef);
      console.log('[Firebase] Got user profile from server');
    } catch (serverErr) {
      // Server fetch failed (offline or blocked), fall back to cache
      console.log('[Firebase] Server fetch failed, using cache:', serverErr);
      userSnap = await getDoc(userRef);
    }
    
    if (!userSnap.exists()) return null;
    
    return firestoreUserToApp(userId, userSnap.data() as FirestoreUser);
  } catch (err) {
    console.error('[Firebase] Failed to get user profile:', err);
    return null;
  }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<AppUser, 'id' | 'email' | 'createdAt'>>
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', userId);
    
    // Convert app format to Firestore format
    const firestoreUpdates: Partial<FirestoreUser> = {
      updatedAt: Timestamp.now(),
    };
    
    if (updates.name !== undefined) firestoreUpdates.name = updates.name;
    if (updates.studyField !== undefined) firestoreUpdates.studyField = updates.studyField;
    if (updates.learnStyle !== undefined) firestoreUpdates.learnStyle = updates.learnStyle;
    if (updates.studyTime !== undefined) firestoreUpdates.studyTime = updates.studyTime;
    if (updates.isOnboarded !== undefined) firestoreUpdates.isOnboarded = updates.isOnboarded;
    if (updates.themeMood !== undefined) firestoreUpdates.themeMood = updates.themeMood;
    
    await updateDoc(userRef, firestoreUpdates);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to update user profile:', err);
    return false;
  }
}

// ============================================
// Auth State Observer
// ============================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    // Return no-op unsubscribe
    return () => {};
  }
  
  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured()) return null;
  
  try {
    const auth = getFirebaseAuth();
    return auth.currentUser;
  } catch {
    return null;
  }
}
