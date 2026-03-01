import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';

// ─────────────────────────────────────────────────────────────
// SPINNER COMPONENT
// ─────────────────────────────────────────────────────────────
function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return (
    <svg className={`${sizeClasses} animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { sendOTP, isLoading, error } = useAuthStore();
  const setProfile = useUserStore((s) => s.setProfile);

  const isDisabled = isSubmitting || isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      setProfile({ email });
      const result = await sendOTP(email);
      
      if (result.success) {
        toast.success('Verification code sent!', {
          description: 'Check your email for a 6-digit code.',
        });
        navigate('/verify');
      } else {
        toast.error('Failed to send code', {
          description: result.error || 'Please try again.',
        });
      }
    } catch {
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-text mb-2">quietude</h1>
          <p className="text-text-soft">
            Your calm, intelligent learning partner.
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-text-soft mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              disabled={isDisabled}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text
                         placeholder:text-text-muted text-base
                         focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                         transition-all duration-150 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled || !email.includes('@')}
            className="w-full px-4 py-3 rounded-lg bg-accent text-accent-text text-sm font-medium
                       hover:opacity-90 transition-opacity duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isDisabled ? (
              <>
                <Spinner size="sm" className="text-accent-text" />
                Sending code...
              </>
            ) : (
              'Continue with email'
            )}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-6">
          We'll send you a 6-digit code. No passwords needed.
        </p>

        {error && (
          <p className="text-xs text-incorrect text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
