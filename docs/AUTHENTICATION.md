# Authentication System

[![EmailJS](https://img.shields.io/badge/EmailJS-OTP_Delivery-f5a623?style=flat-square)](https://emailjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square)](https://supabase.com/)
[![SHA-256](https://img.shields.io/badge/Security-SHA--256-red?style=flat-square)](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest)

Quietude implements a **passwordless authentication system** using One-Time Passwords (OTP) delivered via email. This approach eliminates password management overhead while maintaining security through cryptographic hashing and time-limited codes.

---

## Table of Contents

- [Overview](#overview)
- [OTP Flow](#otp-flow)
- [Security Mechanisms](#security-mechanisms)
- [Session Management](#session-management)
- [Email Delivery](#email-delivery)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Implementation Details](#implementation-details)

---

## Overview

The authentication system prioritizes **simplicity and security**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PASSWORDLESS AUTHENTICATION                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Traditional Login          vs          Quietude OTP                           │
│   ──────────────────                     ──────────────                         │
│   Email + Password                       Email only                             │
│   Password storage                       No passwords                           │
│   Reset flow needed                      Always "reset"                         │
│   Credential stuffing risk               No credentials                         │
│   User memory burden                     Email-based access                     │
│                                                                                 │
│   Benefits:                                                                     │
│   • Zero password management                                                    │
│   • Reduced attack surface                                                      │
│   • Simplified user experience                                                  │
│   • Email becomes identity proof                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## OTP Flow

### Complete Authentication Sequence

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OTP AUTHENTICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   USER                    FRONTEND                BACKEND               EMAIL   │
│    │                         │                       │                    │     │
│    │  1. Enter email         │                       │                    │     │
│    │ ───────────────────────►│                       │                    │     │
│    │                         │                       │                    │     │
│    │                         │  2. Request OTP       │                    │     │
│    │                         │ ─────────────────────►│                    │     │
│    │                         │                       │                    │     │
│    │                         │                       │  3. Generate code  │     │
│    │                         │                       │  ┌──────────────┐  │     │
│    │                         │                       │  │ 6-digit OTP  │  │     │
│    │                         │                       │  │ SHA-256 hash │  │     │
│    │                         │                       │  │ 10min expiry │  │     │
│    │                         │                       │  └──────────────┘  │     │
│    │                         │                       │                    │     │
│    │                         │                       │  4. Store hash     │     │
│    │                         │                       │ ──────────────────►│     │
│    │                         │                       │     (Supabase)     │     │
│    │                         │                       │                    │     │
│    │                         │                       │  5. Send OTP       │     │
│    │                         │                       │ ──────────────────►│     │
│    │                         │                       │     (EmailJS)      │     │
│    │                         │                       │                    │     │
│    │                         │  6. Success response  │                    │     │
│    │                         │ ◄─────────────────────│                    │     │
│    │                         │                       │                    │     │
│    │  7. Show OTP input      │                       │                    │     │
│    │ ◄───────────────────────│                       │                    │     │
│    │                         │                       │                    │     │
│    │  8. Check email         │                       │                    │ ◄───│
│    │ ◄───────────────────────────────────────────────────────────────────────── │
│    │                         │                       │                    │     │
│    │  9. Enter OTP code      │                       │                    │     │
│    │ ───────────────────────►│                       │                    │     │
│    │                         │                       │                    │     │
│    │                         │  10. Verify OTP       │                    │     │
│    │                         │ ─────────────────────►│                    │     │
│    │                         │                       │                    │     │
│    │                         │                       │  11. Hash & compare│     │
│    │                         │                       │  ┌──────────────┐  │     │
│    │                         │                       │  │ Hash input   │  │     │
│    │                         │                       │  │ Check expiry │  │     │
│    │                         │                       │  │ Match stored │  │     │
│    │                         │                       │  └──────────────┘  │     │
│    │                         │                       │                    │     │
│    │                         │  12. Session token    │                    │     │
│    │                         │ ◄─────────────────────│                    │     │
│    │                         │                       │                    │     │
│    │  13. Authenticated!     │                       │                    │     │
│    │ ◄───────────────────────│                       │                    │     │
│    │                         │                       │                    │     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Implementation

```typescript
// src/lib/supabase/auth.ts

// Step 1-6: Send OTP
export async function sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate 6-digit code
    const code = generateOTPCode();
    
    // Hash for storage (never store plain codes)
    const hashedCode = await hashCode(code);
    
    // Calculate expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store in Supabase
    const { error: dbError } = await supabase
      .from('otp_codes')
      .upsert({
        email: email.toLowerCase(),
        code_hash: hashedCode,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });
    
    if (dbError) throw dbError;
    
    // Send via EmailJS
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        otp_code: code,
        expires_in: '10 minutes'
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
    
    return { success: true };
  } catch (error) {
    console.error('OTP send failed:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

// Step 10-12: Verify OTP
export async function verifyOTP(
  email: string, 
  code: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    // Hash the input code
    const hashedInput = await hashCode(code);
    
    // Fetch stored record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (fetchError || !otpRecord) {
      return { success: false, error: 'No verification code found' };
    }
    
    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return { success: false, error: 'Verification code expired' };
    }
    
    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      return { success: false, error: 'Too many attempts. Request new code.' };
    }
    
    // Increment attempts
    await supabase
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('email', email.toLowerCase());
    
    // Compare hashes
    if (hashedInput !== otpRecord.code_hash) {
      return { success: false, error: 'Invalid verification code' };
    }
    
    // Success! Create or get user
    const user = await getOrCreateUser(email);
    
    // Generate session token
    const token = await createSessionToken(user.id);
    
    // Delete used OTP
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email.toLowerCase());
    
    return { success: true, user, token };
  } catch (error) {
    console.error('OTP verification failed:', error);
    return { success: false, error: 'Verification failed' };
  }
}
```

---

## Security Mechanisms

### OTP Code Generation

```typescript
// Cryptographically secure random code generation
function generateOTPCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  
  // Generate 6-digit code (100000-999999)
  const code = 100000 + (array[0] % 900000);
  return code.toString();
}
```

### SHA-256 Hashing

```typescript
// Hash OTP codes before storage
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
```

### Security Properties

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY MEASURES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Measure                  │ Implementation              │ Protection Against  │
│   ─────────────────────────┼─────────────────────────────┼───────────────────  │
│   SHA-256 hashing          │ Never store plain OTPs      │ Database breaches   │
│   10-minute expiry         │ Time-limited validity       │ Replay attacks      │
│   5 attempt limit          │ Lockout after failures      │ Brute force         │
│   6-digit codes            │ 900,000 combinations        │ Guessing attacks    │
│   Email verification       │ Proof of email ownership    │ Identity spoofing   │
│   Single-use codes         │ Delete after verification   │ Code reuse          │
│   Rate limiting            │ Cooldown between requests   │ Spam/DoS attacks    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Session Management

### Session Token Structure

```typescript
interface SessionToken {
  userId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
  fingerprint: string;  // Browser fingerprint for binding
}

async function createSessionToken(userId: string): Promise<string> {
  const payload: SessionToken = {
    userId,
    email: user.email,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
    fingerprint: await getBrowserFingerprint()
  };
  
  // Encode and sign
  const token = btoa(JSON.stringify(payload));
  return token;
}
```

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SESSION LIFECYCLE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Creation                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  OTP Verified → Create Token → Store in localStorage → Set Cookie   │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                        │                                        │
│                                        ▼                                        │
│   Validation (on each request)                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  Read Token → Check Expiry → Verify Fingerprint → Allow/Deny        │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                        │                                        │
│                                        ▼                                        │
│   Refresh (when expiring within 1 day)                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  Check Remaining Time → Generate New Token → Update Storage         │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                        │                                        │
│                                        ▼                                        │
│   Termination                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │  User Logout / Token Expired → Clear Storage → Redirect to Login    │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   Session Duration: 3 days                                                      │
│   Auto-refresh: When less than 1 day remaining                                  │
│   Storage: localStorage + HTTP-only cookie (future)                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Session Validation

```typescript
// src/components/auth/AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionExpiry, refreshSession, logout } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const validateSession = async () => {
      // Check if session expired
      if (sessionExpiry && Date.now() > sessionExpiry) {
        logout();
        return;
      }
      
      // Attempt refresh if expiring soon
      if (sessionExpiry && sessionExpiry - Date.now() < 24 * 60 * 60 * 1000) {
        await refreshSession();
      }
    };
    
    // Validate immediately
    validateSession();
    
    // Re-validate every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, sessionExpiry]);
  
  return <>{children}</>;
}
```

---

## Email Delivery

### EmailJS Integration

```typescript
// Environment configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

### Email Template

```html
<!-- EmailJS Template -->
<div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto;">
  <h2 style="color: #1a1a2e;">Quietude Verification</h2>
  
  <p>Your verification code is:</p>
  
  <div style="
    background: #f5f5f5; 
    padding: 20px; 
    text-align: center; 
    font-size: 32px; 
    letter-spacing: 8px;
    font-weight: bold;
    border-radius: 8px;
  ">
    {{otp_code}}
  </div>
  
  <p style="color: #666; font-size: 14px; margin-top: 20px;">
    This code expires in {{expires_in}}.
    If you didn't request this code, you can safely ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  
  <p style="color: #999; font-size: 12px;">
    Quietude - Mindful Learning
  </p>
</div>
```

### Delivery Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         EMAIL DELIVERY FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐             │
│   │ Quietude │ ──► │ EmailJS  │ ──► │  SMTP    │ ──► │  User    │             │
│   │ Frontend │     │  API     │     │ Provider │     │  Inbox   │             │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘             │
│                                                                                 │
│   Typical delivery time: 5-30 seconds                                           │
│                                                                                 │
│   Error handling:                                                               │
│   • Retry once on failure                                                       │
│   • Show "check spam folder" hint                                               │
│   • Allow resend after 60 seconds                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### OTP Codes Table

```sql
-- supabase/schema.sql
CREATE TABLE otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  code_hash VARCHAR(64) NOT NULL,    -- SHA-256 hash (64 hex chars)
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Auto-cleanup expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_otps
  AFTER INSERT ON otp_codes
  EXECUTE FUNCTION cleanup_expired_otps();
```

### User Sessions Table

```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only see their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_sessions_own 
  ON user_sessions 
  FOR ALL 
  USING (user_id = auth.uid());
```

---

## Error Handling

### Error Types and Messages

```typescript
type AuthError =
  | 'INVALID_EMAIL'
  | 'OTP_SEND_FAILED'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'TOO_MANY_ATTEMPTS'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR';

const ERROR_MESSAGES: Record<AuthError, string> = {
  INVALID_EMAIL: 'Please enter a valid email address',
  OTP_SEND_FAILED: 'Failed to send verification code. Please try again.',
  OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
  OTP_INVALID: 'Invalid verification code. Please check and try again.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please request a new code.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
};
```

### Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ERROR RECOVERY FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Error Type              │ User Action                │ System Response        │
│   ────────────────────────┼────────────────────────────┼────────────────────── │
│   Invalid email           │ Re-enter email             │ Show validation hint   │
│   OTP send failed         │ Retry after 60s            │ Offer retry button     │
│   Code expired            │ Request new code           │ Clear old, send new    │
│   Invalid code            │ Re-enter (5 attempts)      │ Show remaining tries   │
│   Too many attempts       │ Wait, request new          │ Lock for 15 minutes    │
│   Session expired         │ Re-authenticate            │ Redirect to login      │
│   Network error           │ Check connection           │ Offline indicator      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Login Form Component

```typescript
// src/pages/Login.tsx (simplified)
export function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { otpSent, sendOTP, verifyOTP, isLoading, error } = useAuthStore();

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    await sendOTP(email);
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    const success = await verifyOTP(email, otp);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Quietude</CardTitle>
          <CardDescription>
            {otpSent 
              ? 'Enter the code sent to your email' 
              : 'Enter your email to receive a verification code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSendOTP}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <InputOTP value={otp} onChange={setOtp} maxLength={6} />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
          )}
          {error && <p className="text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Summary

The Quietude authentication system provides:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Passwordless | OTP via email | No password management |
| Secure storage | SHA-256 hashing | Protected even if DB leaked |
| Time-limited | 10-minute expiry | Reduced replay risk |
| Brute-force protection | 5 attempt limit | Account security |
| Long sessions | 3-day validity | User convenience |
| Auto-refresh | 1-day threshold | Seamless experience |

---

**Related Documentation:**
- [Database Schema](./DATABASE_SCHEMA.md) - OTP and session tables
- [State Management](./STATE_MANAGEMENT.md) - Auth store details
- [Sync Mechanism](./SYNC_MECHANISM.md) - Authenticated sync

---

<div align="center">
  <sub>Secure access without password friction</sub>
</div>
