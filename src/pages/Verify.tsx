import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { getUserProfile } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchAllUserData, clearSyncQueue } from '@/lib/supabase/sync';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { useUIStore } from '@/store/ui';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Spinner component for consistency
function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return (
    <svg 
      className={`${sizeClasses} animate-spin ${className}`} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeOpacity="0.25"
      />
      <path 
        d="M12 2a10 10 0 0 1 10 10" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function VerifyPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'syncing'>('idle');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const verifyLockRef = useRef(false);
  const navigate = useNavigate();
  
  const { verifyOTP, sendOTP, error, clearError } = useAuthStore();
  const { email, setProfile } = useUserStore();

  // Redirect to login if email is missing (e.g., direct navigation to /verify)
  useEffect(() => {
    if (!email) {
      toast.error('Please enter your email first');
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    if (next.every((d) => d !== '')) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputsRef.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (fullCode: string) => {
    // Root-cause fix: prevent multiple concurrent verifications (e.g. fast auto-fill)
    if (fullCode.length !== 6 || !email) return;
    if (verifyLockRef.current) return;
    verifyLockRef.current = true;
    
    setIsVerifying(true);
    setVerifyStatus('verifying');
    clearError();
    
    try {
      const result = await verifyOTP(email, fullCode);
      
      if (result.success) {
        // Set flag BEFORE any state changes to prevent PublicRoute redirect race
        sessionStorage.setItem('quietude:login-in-progress', 'true');
        
        setVerifyStatus('success');
        
        // ACCOUNT SWITCH DETECTION: Clear all local data if different user is logging in
        const previousUserId = useAuthStore.getState().userId;
        if (previousUserId && previousUserId !== result.userId) {
          console.log('[Verify] Account switch detected, clearing local data');
          useUserStore.getState().clear();
          usePathsStore.getState().clearAll();
          useSessionsStore.getState().clearAll();
          useNotesStore.getState().clearAll();
          // Clear sync queue to prevent old user's pending operations
          await clearSyncQueue();
        }
        
        setProfile({ isAuthenticated: true });
        
        // Check server profile first to determine if user has completed onboarding
        let isOnboarded = useUserStore.getState().isOnboarded;
        let destination: '/dashboard' | '/onboarding' = '/onboarding';
        
        if (isSupabaseConfigured() && result.userId) {
          try {
            setVerifyStatus('syncing');
            const serverProfile = await getUserProfile(result.userId);
            
            if (serverProfile?.is_onboarded) {
              isOnboarded = true;
              setProfile({ 
                isOnboarded: true,
                name: serverProfile.name || null,
                studyField: serverProfile.study_field || null,
                learnStyle: serverProfile.learn_style || null,
                studyTime: serverProfile.study_time || null,
              });
            }
            
            // Apply theme mood from server profile
            if (serverProfile?.theme_mood) {
              useUIStore.getState().setMood(serverProfile.theme_mood as any);
            }
            
            // Pre-fetch user data before navigating to dashboard
            if (isOnboarded) {
              destination = '/dashboard';
              const serverData = await fetchAllUserData(result.userId);
              if (serverData) {
                // Replace local data with server data to prevent duplicates
                const pathsStore = usePathsStore.getState();
                const sessionsStore = useSessionsStore.getState();
                const notesStore = useNotesStore.getState();
                
                // Merge paths: add missing, update existing with server data
                serverData.paths.forEach(serverPath => {
                  const localPath = pathsStore.paths.find(p => p.id === serverPath.id);
                  if (!localPath) {
                    pathsStore.addPath(serverPath);
                  } else {
                    pathsStore.updatePath(serverPath.id, serverPath);
                  }
                });
                
                // Sync sessions — add missing, update stale ones
                serverData.sessions.forEach(session => {
                  const local = sessionsStore.sessions.find(s => s.id === session.id);
                  if (!local) {
                    sessionsStore.addSession(session);
                  } else if (session.submitted_at && !local.submitted_at) {
                    sessionsStore.updateSession(session.id, session);
                  }
                });
                
                // Add only missing notes
                serverData.notes.forEach(note => {
                  if (!notesStore.notes.some(n => n.id === note.id)) {
                    notesStore.addNote(note);
                  }
                });
                
                // Mark sync as already done so AuthProvider doesn't re-sync
                sessionStorage.setItem('quietude:sync-done', 'true');
              }
            }
          } catch {
            // Fall back to local state
          }
        }
        
        if (isOnboarded) {
          destination = '/dashboard';
        }
        
        toast.success('Welcome to Quietude!');
        // Navigate immediately - data is already loaded
        // Clear login flag right before navigating
        sessionStorage.removeItem('quietude:login-in-progress');
        navigate(destination, { replace: true });
        // Don't reset any state - we're navigating away
      } else {
        verifyLockRef.current = false;
        setVerifyStatus('idle');
        setIsVerifying(false);
        setCode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
        toast.error('Verification failed', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (err) {
      verifyLockRef.current = false;
      setVerifyStatus('idle');
      setIsVerifying(false);
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      toast.error('Something went wrong');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    
    try {
      const result = await sendOTP(email);
      if (result.success) {
        toast.success('New code sent!');
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      } else {
        toast.error('Failed to resend code');
      }
    } catch {
      toast.error('Failed to resend code');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Show full-screen loading when verifying or syncing
  if (verifyStatus === 'verifying' || verifyStatus === 'success' || verifyStatus === 'syncing') {
    const statusText = verifyStatus === 'verifying' 
      ? 'Verifying...' 
      : verifyStatus === 'syncing' 
        ? 'Loading your data...' 
        : 'Success!';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" className="text-accent" />
          <span className="text-sm text-text-soft">{statusText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-text-soft hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h1 className="font-display text-3xl text-text mb-2 tracking-tight">
          Check your email
        </h1>
        <p className="text-text-soft text-base mb-8">
          We sent a 6-digit code to{' '}
          <span className="text-text font-medium">{email || 'your email'}</span>
        </p>

        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifyStatus !== 'idle' || isVerifying}
              className="w-12 h-14 text-center text-xl font-medium rounded-lg bg-surface border border-border
                         text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                         transition-all duration-150 disabled:opacity-50"
            />
          ))}
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-text-soft mb-4">
            <Spinner size="sm" className="text-accent" />
            Verifying...
          </div>
        )}

        {error && (
          <p className="text-sm text-incorrect text-center mb-4">{error}</p>
        )}

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-text-muted text-center">
            Code expires in 10 minutes.
          </p>
          
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 
                       disabled:text-text-muted disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive a code? Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
