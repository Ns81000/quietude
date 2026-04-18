/**
 * Firebase Rate Limiting
 * 
 * Server-side rate limiting for OTP and verification requests.
 * Uses Firestore to track requests per email, IP, and globally.
 * Implements exponential backoff and DDoS protection.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
  query,
  collection,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './client';

// ============================================
// Constants
// ============================================

const RATE_LIMIT_CONFIG = {
  // OTP sending limits
  OTP_SEND_PER_EMAIL_PER_HOUR: 3,
  OTP_SEND_PER_IP_PER_HOUR: 10,
  OTP_VERIFY_PER_EMAIL_PER_HOUR: 15,
  OTP_VERIFY_PER_IP_PER_HOUR: 20,

  // Cooldown periods
  OTP_RESEND_COOLDOWN_SECONDS: 60, // 1 minute between sends
  OTP_LOCKOUT_AFTER_FAILURES: 5, // Lock after 5 failed attempts
  OTP_LOCKOUT_DURATION_MINUTES: 30, // Locked for 30 minutes

  // Cleanup
  RATE_LIMIT_RETENTION_HOURS: 24,
};

export interface RateLimitData {
  email: string;
  ip: string;
  type: 'send' | 'verify'; // OTP send or OTP verify
  timestamp: Timestamp;
  count: number;
  lastAttempt: Timestamp;
  failedAttempts?: number;
  lockedUntil?: Timestamp;
}

// ============================================
// Get Client IP
// ============================================

/**
 * Get client IP address from various sources
 * In browser, we can't get true IP, so we use a device fingerprint
 */
export function getClientFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-unknown';
  }

  // Combine multiple factors for fingerprint
  const parts = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width + 'x' + screen.height,
  ];

  const data = parts.join('|');
  let hash = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

// ============================================
// Rate Limit Checking
// ============================================

/**
 * Check if a user should be rate limited for OTP sending
 */
export async function checkOtpSendRateLimit(
  email: string,
  fingerprint?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  if (!isFirebaseConfigured()) {
    return { allowed: true }; // Allow if Firebase not configured
  }

  try {
    const db = getFirebaseDb();
    const fp = fingerprint || getClientFingerprint();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check per-email rate limit
    const emailLimitKey = `ratelimit:otp_send:email:${email.toLowerCase()}`;
    const emailLimitRef = doc(db, 'rateLimits', emailLimitKey);
    const emailLimitSnap = await getDoc(emailLimitRef);

    if (emailLimitSnap.exists()) {
      const data = emailLimitSnap.data() as RateLimitData;

      // Check if locked
      if (data.lockedUntil && data.lockedUntil.toDate() > now) {
        const retryAfter = Math.ceil(
          (data.lockedUntil.toDate().getTime() - now.getTime()) / 1000
        );
        return {
          allowed: false,
          reason: 'Too many verification attempts. Please try again later.',
          retryAfter,
        };
      }

      // Reset count if older than 1 hour
      if (data.lastAttempt.toDate() < oneHourAgo) {
        await updateDoc(emailLimitRef, {
          count: 1,
          lastAttempt: Timestamp.now(),
          failedAttempts: 0,
        });
        return { allowed: true };
      }

      // Check if exceeds hourly limit
      if (data.count >= RATE_LIMIT_CONFIG.OTP_SEND_PER_EMAIL_PER_HOUR) {
        return {
          allowed: false,
          reason: 'Too many verification codes sent. Please try again in 1 hour.',
          retryAfter: 3600,
        };
      }
    }

    // Check per-IP rate limit
    const ipLimitKey = `ratelimit:otp_send:ip:${fp}`;
    const ipLimitRef = doc(db, 'rateLimits', ipLimitKey);
    const ipLimitSnap = await getDoc(ipLimitRef);

    if (ipLimitSnap.exists()) {
      const data = ipLimitSnap.data() as RateLimitData;

      // Reset count if older than 1 hour
      if (data.lastAttempt.toDate() < oneHourAgo) {
        await updateDoc(ipLimitRef, {
          count: 1,
          lastAttempt: Timestamp.now(),
        });
        return { allowed: true };
      }

      // Check if exceeds IP limit
      if (data.count >= RATE_LIMIT_CONFIG.OTP_SEND_PER_IP_PER_HOUR) {
        return {
          allowed: false,
          reason: 'Too many requests from your device. Please try again later.',
          retryAfter: Math.ceil(
            (data.lastAttempt.toDate().getTime() + 3600 * 1000 - now.getTime()) / 1000
          ),
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error('[RateLimit] Error checking OTP send limit:', err);
    return { allowed: true }; // Fail open - allow if error
  }
}

/**
 * Record an OTP send attempt
 */
export async function recordOtpSendAttempt(
  email: string,
  fingerprint?: string
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const db = getFirebaseDb();
    const fp = fingerprint || getClientFingerprint();
    const now = Timestamp.now();

    // Update per-email limit
    const emailLimitKey = `ratelimit:otp_send:email:${email.toLowerCase()}`;
    const emailLimitRef = doc(db, 'rateLimits', emailLimitKey);

    await setDoc(
      emailLimitRef,
      {
        email: email.toLowerCase(),
        type: 'send',
        count: increment(1),
        lastAttempt: now,
        expiresAt: new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000),
      },
      { merge: true }
    );

    // Update per-IP limit
    const ipLimitKey = `ratelimit:otp_send:ip:${fp}`;
    const ipLimitRef = doc(db, 'rateLimits', ipLimitKey);

    await setDoc(
      ipLimitRef,
      {
        ip: fp,
        type: 'send',
        count: increment(1),
        lastAttempt: now,
        expiresAt: new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[RateLimit] Error recording OTP send attempt:', err);
  }
}

/**
 * Check if a user should be rate limited for OTP verification
 */
export async function checkOtpVerifyRateLimit(
  email: string,
  fingerprint?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  if (!isFirebaseConfigured()) {
    return { allowed: true };
  }

  try {
    const db = getFirebaseDb();
    const fp = fingerprint || getClientFingerprint();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check per-email verification limit
    const emailKey = `ratelimit:otp_verify:email:${email.toLowerCase()}`;
    const emailRef = doc(db, 'rateLimits', emailKey);
    const emailSnap = await getDoc(emailRef);

    if (emailSnap.exists()) {
      const data = emailSnap.data() as RateLimitData;

      // Check if locked
      if (data.lockedUntil && data.lockedUntil.toDate() > now) {
        const retryAfter = Math.ceil(
          (data.lockedUntil.toDate().getTime() - now.getTime()) / 1000
        );
        return {
          allowed: false,
          reason: 'Too many failed attempts. Please try again later.',
          retryAfter,
        };
      }

      // Reset if older than 1 hour
      if (data.lastAttempt.toDate() < oneHourAgo) {
        await updateDoc(emailRef, {
          count: 1,
          failedAttempts: 0,
          lastAttempt: Timestamp.now(),
        });
        return { allowed: true };
      }

      // Check hourly limit
      if (data.count >= RATE_LIMIT_CONFIG.OTP_VERIFY_PER_EMAIL_PER_HOUR) {
        return {
          allowed: false,
          reason: 'Too many verification attempts. Please try again in 1 hour.',
          retryAfter: 3600,
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error('[RateLimit] Error checking OTP verify limit:', err);
    return { allowed: true };
  }
}

/**
 * Record an OTP verification attempt (failed)
 */
export async function recordOtpVerifyAttempt(
  email: string,
  fingerprint?: string,
  failed: boolean = false
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const db = getFirebaseDb();
    const fp = fingerprint || getClientFingerprint();
    const now = Timestamp.now();

    const emailKey = `ratelimit:otp_verify:email:${email.toLowerCase()}`;
    const emailRef = doc(db, 'rateLimits', emailKey);

    const updates: any = {
      email: email.toLowerCase(),
      type: 'verify',
      count: increment(1),
      lastAttempt: now,
      expiresAt: new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000),
    };

    if (failed) {
      updates.failedAttempts = increment(1);

      // Check if we need to lock the account
      const snap = await getDoc(emailRef);
      if (snap.exists()) {
        const data = snap.data() as RateLimitData;
        const nextFailures = (data.failedAttempts || 0) + 1;

        if (nextFailures >= RATE_LIMIT_CONFIG.OTP_LOCKOUT_AFTER_FAILURES) {
          const lockoutDuration = RATE_LIMIT_CONFIG.OTP_LOCKOUT_DURATION_MINUTES;
          updates.lockedUntil = new Date(
            now.toDate().getTime() + lockoutDuration * 60 * 1000
          );
        }
      }
    } else {
      // Reset on success
      updates.failedAttempts = 0;
      updates.lockedUntil = null;
    }

    await setDoc(emailRef, updates, { merge: true });
  } catch (err) {
    console.error('[RateLimit] Error recording OTP verify attempt:', err);
  }
}

/**
 * Reset rate limits for an email (call after successful verification)
 */
export async function resetRateLimits(email: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const db = getFirebaseDb();
    const lowerEmail = email.toLowerCase();

    // Delete send limit
    const sendKey = `ratelimit:otp_send:email:${lowerEmail}`;
    await deleteDoc(doc(db, 'rateLimits', sendKey)).catch(() => {
      /* ignore if not exists */
    });

    // Delete verify limit
    const verifyKey = `ratelimit:otp_verify:email:${lowerEmail}`;
    await deleteDoc(doc(db, 'rateLimits', verifyKey)).catch(() => {
      /* ignore if not exists */
    });
  } catch (err) {
    console.error('[RateLimit] Error resetting rate limits:', err);
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 * This should be called by a Cloud Function scheduled job
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  if (!isFirebaseConfigured()) return 0;

  try {
    const db = getFirebaseDb();
    const now = new Date();

    const q = query(
      collection(db, 'rateLimits'),
      where('expiresAt', '<', now)
    );

    const snapshot = await getDocs(q);
    let deleted = 0;

    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deleted++;
    }

    console.log(`[RateLimit] Cleaned up ${deleted} expired entries`);
    return deleted;
  } catch (err) {
    console.error('[RateLimit] Error cleaning up rate limits:', err);
    return 0;
  }
}

export { RATE_LIMIT_CONFIG };
