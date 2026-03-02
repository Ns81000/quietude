import { getSupabase, isSupabaseConfigured } from './client';
import { withRetry } from './retry';
import type { Profile } from './database.types';
import emailjs from '@emailjs/browser';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const SESSION_EXPIRY_DAYS = 3;

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

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
  const otp = generateSecureOTP();
  const otpHash = hashOTP(otp, email);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      await supabase.from('otp_codes').delete().eq('email', email);
      
      const { error: insertError } = await supabase.from('otp_codes').insert({
        email,
        code_hash: otpHash,
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      });

      if (insertError) {
        console.error('[Auth] Failed to store OTP:', insertError);
      }
    } catch (err) {
      console.warn('[Auth] Supabase OTP storage failed, using local storage', err);
    }
  }

  localStorage.setItem('quietude:pending_otp', JSON.stringify({
    email,
    hash: otpHash,
    expiresAt,
    attempts: 0,
  }));

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

  console.log(`[Auth] Demo mode - OTP for ${email}: ${otp}`);
  return { success: true };
}

export async function verifyOTP(email: string, otp: string): Promise<{
  success: boolean;
  userId?: string;
  sessionToken?: string;
  error?: string;
}> {
  const submittedHash = hashOTP(otp, email);
  let isValid = false;
  let userId: string | undefined;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .single();

      if (!fetchError && otpRecord) {
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
          return { success: false, error: 'Too many attempts. Please request a new code.' };
        }

        if (new Date(otpRecord.expires_at) < new Date()) {
          return { success: false, error: 'Code expired. Please request a new one.' };
        }

        await supabase
          .from('otp_codes')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('id', otpRecord.id);

        if (otpRecord.code_hash === submittedHash) {
          isValid = true;
          
          await supabase
            .from('otp_codes')
            .update({ verified: true })
            .eq('id', otpRecord.id);

          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (existingUser) {
            userId = existingUser.id;
          } else {
            const newUserId = crypto.randomUUID();
            const { error: createError } = await supabase.from('profiles').insert({
              id: newUserId,
              email,
              is_onboarded: false,
            });
            
            if (!createError) {
              userId = newUserId;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Auth] Supabase verification failed, falling back to local', err);
    }
  }

  if (!isValid) {
    const stored = localStorage.getItem('quietude:pending_otp');
    if (stored) {
      try {
        const pending = JSON.parse(stored);
        if (pending.email === email) {
          if (pending.attempts >= MAX_OTP_ATTEMPTS) {
            return { success: false, error: 'Too many attempts. Please request a new code.' };
          }

          if (new Date(pending.expiresAt) < new Date()) {
            return { success: false, error: 'Code expired. Please request a new one.' };
          }

          pending.attempts++;
          localStorage.setItem('quietude:pending_otp', JSON.stringify(pending));

          if (pending.hash === submittedHash) {
            isValid = true;
            
            // Try to get or create a server user ID instead of using local-
            if (!userId && isSupabaseConfigured()) {
              try {
                const supabase = getSupabase();
                const { data: existingUser } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('email', email)
                  .single();

                if (existingUser) {
                  userId = existingUser.id;
                } else {
                  // Create new user on server
                  const newUserId = crypto.randomUUID();
                  const { error: createError } = await supabase.from('profiles').insert({
                    id: newUserId,
                    email,
                    is_onboarded: false,
                  });
                  
                  if (!createError) {
                    userId = newUserId;
                  }
                }
              } catch (err) {
                console.warn('[Auth] Failed to create server user from local fallback:', err);
              }
            }
            
            // Only use local- prefix as absolute last resort when truly offline
            userId = userId || `local-${crypto.randomUUID()}`;
            localStorage.removeItem('quietude:pending_otp');
          }
        }
      } catch {
        // Invalid stored data
      }
    }
  }

  if (!isValid) {
    return { success: false, error: 'Invalid verification code.' };
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  if (isSupabaseConfigured() && userId) {
    try {
      const supabase = getSupabase();
      await supabase.from('user_sessions').insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        device_info: navigator.userAgent,
      });
    } catch (err) {
      console.warn('[Auth] Failed to create server session', err);
    }
  }

  localStorage.setItem('quietude:session', JSON.stringify({
    userId,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    email,
  }));

  return { success: true, userId, sessionToken };
}

export interface StoredSession {
  userId: string;
  sessionToken: string;
  expiresAt: string;
  email: string;
}

export function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem('quietude:session');
    if (!stored) return null;
    
    const session = JSON.parse(stored) as StoredSession;
    
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('quietude:session');
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

export async function validateSession(): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  needsRefresh?: boolean;
}> {
  const session = getStoredSession();
  if (!session) {
    return { valid: false };
  }

  const expiresAt = new Date(session.expiresAt);
  const now = new Date();
  const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilExpiry < 0) {
    localStorage.removeItem('quietude:session');
    return { valid: false };
  }

  const needsRefresh = hoursUntilExpiry < 24;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      const { data: serverSession, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', session.sessionToken)
        .single();

      if (error || !serverSession) {
        // Only invalidate if we got a clear "not found" response, not a network/CORS error
        // PGRST116 = "not found" which means session was explicitly deleted/doesn't exist
        if (navigator.onLine && error?.code === 'PGRST116') {
          localStorage.removeItem('quietude:session');
          return { valid: false };
        }
        // For other errors (network, CORS, etc.) - trust the local session
        return { valid: true, userId: session.userId, email: session.email, needsRefresh };
      }

      if (new Date(serverSession.expires_at) < now) {
        localStorage.removeItem('quietude:session');
        return { valid: false };
      }

      await supabase
        .from('user_sessions')
        .update({ last_active_at: now.toISOString() })
        .eq('id', serverSession.id);

    } catch {
      return { valid: true, userId: session.userId, email: session.email, needsRefresh };
    }
  }

  return { valid: true, userId: session.userId, email: session.email, needsRefresh };
}

export async function refreshSession(): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;

  const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const newToken = generateSessionToken();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', session.sessionToken);

      await supabase.from('user_sessions').insert({
        user_id: session.userId,
        session_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        device_info: navigator.userAgent,
      });
    } catch (err) {
      console.warn('[Auth] Failed to refresh server session', err);
    }
  }

  localStorage.setItem('quietude:session', JSON.stringify({
    ...session,
    sessionToken: newToken,
    expiresAt: newExpiresAt.toISOString(),
  }));

  return true;
}

export async function logout(): Promise<void> {
  const session = getStoredSession();

  if (session && isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', session.sessionToken);
    } catch (err) {
      console.warn('[Auth] Failed to delete server session', err);
    }
  }

  localStorage.removeItem('quietude:session');
  localStorage.removeItem('quietude:pending_otp');
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Use retry mechanism for resilient fetching
    return await withRetry(async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }, { maxRetries: 3, baseDelayMs: 500 });
  } catch (err) {
    console.warn('[Auth] getUserProfile failed after retries:', err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at'>>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // Use retry mechanism for resilient updates
    return await withRetry(async () => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    }, { maxRetries: 2, baseDelayMs: 500 });
  } catch (err) {
    console.warn('[Auth] updateUserProfile failed after retries:', err);
    return false;
  }
}
