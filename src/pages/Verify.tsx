import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { getUserProfile } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { fetchAllUserData, clearSyncQueue } from '@/lib/firebase/sync';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { useUIStore } from '@/store/ui';
import { 
  setKnownUserWithBackup, 
  getKnownUserWithFallback,
  setKnownUserSync as setKnownUser,
  getKnownUserSync as getKnownUser 
} from '@/components/auth/AuthProvider';
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
    
    // IMPORTANT: Capture previous userId BEFORE verifyOTP changes it
    const previousUserId = useAuthStore.getState().userId;
    
    try {
      const result = await verifyOTP(email, fullCode);
      
      if (result.success) {
        // Set flag BEFORE any state changes to prevent PublicRoute redirect race
        sessionStorage.setItem('quietude:login-in-progress', 'true');
        
        setVerifyStatus('success');
        
        // ACCOUNT SWITCH DETECTION: Clear all local data if different user is logging in
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
        // Fall back to known_user if server fails
        let isOnboarded = useUserStore.getState().isOnboarded;
        let destination: '/dashboard' | '/onboarding' = '/onboarding';
        
        // Get known user as fallback (unique per email)
        const knownUser = getKnownUser(email);
        const isKnownOnboardedUser = knownUser !== null; // If we have a known user, they've logged in before
        
        // Debug: Check all known_user keys in localStorage
        const allKnownUserKeys = Object.keys(localStorage).filter(k => k.startsWith('quietude:known_user:'));
        console.log('[Verify] Checking onboarding status:', { 
          email, 
          localIsOnboarded: isOnboarded,
          knownUserExists: knownUser !== null,
          knownUser,
          allKnownUserKeys,
          expectedKey: `quietude:known_user:${email}`
        });
        
        if (isFirebaseConfigured() && result.userId) {
          try {
            setVerifyStatus('syncing');
            const serverProfile = await getUserProfile(result.userId);
            
            console.log('[Verify] Server profile:', { 
              exists: serverProfile !== null,
              isOnboarded: serverProfile?.isOnboarded,
              name: serverProfile?.name
            });
            
            if (serverProfile?.isOnboarded) {
              isOnboarded = true;
              setProfile({ 
                isOnboarded: true,
                name: serverProfile.name || null,
                studyField: serverProfile.studyField || null,
                learnStyle: serverProfile.learnStyle || null,
                studyTime: serverProfile.studyTime || null,
              });
              // Update known_user to reflect server-confirmed onboarding status
              // Use backup version for multi-layer storage (localStorage + IndexedDB)
              if (result.userId && email) {
                setKnownUserWithBackup(email, {
                  email,
                  name: serverProfile.name || undefined,
                  lastLogin: new Date().toISOString(),
                });
              }
            } else if (isKnownOnboardedUser) {
              // Server didn't confirm but we know this user was onboarded before
              // Trust the local backup
              console.log('[Verify] Using known_user fallback for onboarding status');
              isOnboarded = true;
              setProfile({ isOnboarded: true });
            }
            
            // Apply theme mood from server profile
            if (serverProfile?.themeMood) {
              useUIStore.getState().setMood(serverProfile.themeMood as any);
            }
            
            // Pre-fetch user data before navigating to dashboard
            if (isOnboarded) {
              destination = '/dashboard';
              console.log('[Verify] Fetching user data from server...');
              const serverData = await fetchAllUserData(result.userId);
              console.log('[Verify] Server data fetched:', {
                paths: serverData?.paths?.length ?? 0,
                sessions: serverData?.sessions?.length ?? 0,
                notes: serverData?.notes?.length ?? 0,
              });
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
          } catch (err) {
            // Server failed - use known_user as fallback
            console.warn('[Verify] Server profile fetch failed, checking known_user:', err);
            if (isKnownOnboardedUser) {
              console.log('[Verify] Using known_user fallback after server failure');
              isOnboarded = true;
              setProfile({ isOnboarded: true });
            }
          }
        } else if (isKnownOnboardedUser) {
          // Firebase not configured but we have local backup
          isOnboarded = true;
          setProfile({ isOnboarded: true });
        }
        
        if (isOnboarded) {
          destination = '/dashboard';
        }
        
        // Save known user for future fallback (after successful login)
        // Use backup version for multi-layer storage (localStorage + IndexedDB)
        if (result.userId && email) {
          setKnownUserWithBackup(email, {
            email,
            lastLogin: new Date().toISOString(),
          });
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
