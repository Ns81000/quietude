import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { useAuthContext, getKnownUserSync as getKnownUser } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userId, email } = useAuthStore();
  const { isOnboarded } = useUserStore();
  const { isInitialized } = useAuthContext();
  const location = useLocation();
  
  // Check known_user as fallback for onboarding status (unique per email)
  const knownUser = email ? getKnownUser(email) : null;
  const isKnownOnboarded = knownUser !== null; // If we have a known user, they've logged in before

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-text-soft">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Use known_user fallback for onboarding status
  const effectivelyOnboarded = isOnboarded || isKnownOnboarded;
  
  if (requireOnboarding && !effectivelyOnboarded) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userId, email } = useAuthStore();
  const { isOnboarded } = useUserStore();
  const { isInitialized } = useAuthContext();
  
  // Check known_user as fallback for onboarding status (unique per email)
  const knownUser = email ? getKnownUser(email) : null;
  const isKnownOnboarded = knownUser !== null; // If we have a known user, they've logged in before

  // Only gate on initial auth check at app boot.
  // Do NOT gate on isLoading — that toggles during verifyOTP/sendOTP and
  // would unmount the Verify page mid-flow, causing it to remount with
  // fresh (idle) state and briefly flash the OTP inputs again.
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-text-soft">Loading...</span>
        </div>
      </div>
    );
  }

  // Already authenticated + onboarded → go straight to dashboard,
  // UNLESS the Verify page is still handling its post-login flow
  // (data sync, profile fetch, etc.)
  // Use known_user as fallback for onboarding status
  const effectivelyOnboarded = isOnboarded || isKnownOnboarded;
  const isLoginInProgress = sessionStorage.getItem('quietude:login-in-progress');
  
  if (isAuthenticated && effectivelyOnboarded && !isLoginInProgress) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
