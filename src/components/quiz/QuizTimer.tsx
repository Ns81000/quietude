import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  limitSecs: number | null;
  onExpire: () => void;
  isPaused: boolean;
  resetKey?: number; // Change this to reset the timer
}

/**
 * Displays remaining time per question.
 * When limit is null, shows elapsed time only (no pressure).
 * Bar turns from accent colour to --incorrect in the last 10 seconds.
 * Timer pauses when the user switches tabs (visibility API).
 */
export function QuizTimer({ limitSecs, onExpire, isPaused, resetKey }: QuizTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Listen for tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Reset on new question (resetKey change)
  useEffect(() => {
    setElapsed(0);
  }, [resetKey, limitSecs]);

  // Timer is paused if explicitly paused OR if tab is not visible
  const effectivelyPaused = isPaused || !isTabVisible;

  useEffect(() => {
    if (effectivelyPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Stop exactly at the limit, never go over
        if (limitSecs !== null && next >= limitSecs) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Call onExpire in next tick to avoid state update during render
          setTimeout(() => onExpireRef.current(), 0);
          return limitSecs; // Cap at limit
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [effectivelyPaused, limitSecs]);

  // No limit — show elapsed quietly
  if (limitSecs === null) {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return (
      <span className="text-xs text-text-muted tabular-nums">
        {mins > 0 ? `${mins}m ` : ''}{secs}s
      </span>
    );
  }

  const remaining = Math.max(0, limitSecs - elapsed);
  const pct = (remaining / limitSecs) * 100;
  const isCritical = remaining <= 10;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-bg-2 rounded-lg border border-border"
      role="timer"
      aria-label={`${remaining} seconds remaining`}
    >
      <span className="text-xs text-text-muted">⏱</span>
      <div className="h-2 flex-1 rounded-full overflow-hidden bg-surface">
        <div
          className={cn(
            'h-full rounded-full',
            isCritical ? 'bg-incorrect' : 'bg-accent'
          )}
          style={{ 
            width: `${pct}%`,
            transition: 'width 1s linear'
          }}
        />
      </div>
      <span
        className={cn(
          'text-sm font-mono tabular-nums min-w-[2rem] text-right font-medium',
          isCritical ? 'text-incorrect' : 'text-accent'
        )}
      >
        {remaining}s
      </span>
    </div>
  );
}
