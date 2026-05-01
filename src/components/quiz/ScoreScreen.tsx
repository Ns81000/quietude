import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScoreScreenProps {
  score: number;
  total: number;
  passed: boolean;
  isDigDeeper: boolean;
  topicTitle: string;
  onGenerateNotes: () => void;
  onNextTopic: () => void;
  onDigDeeper: () => void;
  onReview: () => void;
  onRetake: () => void;
  isLoading?: boolean;
}

export function ScoreScreen({
  score,
  total,
  passed,
  isDigDeeper,
  topicTitle,
  onGenerateNotes,
  onNextTopic,
  onDigDeeper,
  onReview,
  onRetake,
  isLoading = false,
}: ScoreScreenProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Determine message based on score
  const getMessage = () => {
    if (passed) {
      if (percentage === 100) return 'Perfect score.';
      if (percentage >= 90) return 'Excellent work.';
      return 'Well done.';
    }
    // Not passed
    if (percentage >= 60) return 'Almost there.';
    if (percentage >= 40) return 'Keep at it.';
    return 'This needs more attention.';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-md mx-auto text-center"
    >
      {/* Topic title */}
      <p className="text-sm text-text-muted uppercase tracking-wide mb-2">
        {isDigDeeper ? 'Dig Deeper' : 'Quiz Complete'}
      </p>
      <h1 className="font-display text-2xl text-text mb-8">{topicTitle}</h1>

      {/* Score display with ring */}
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative inline-flex items-center justify-center"
        >
          {/* SVG Score Ring */}
          <svg width="140" height="140" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke="hsl(var(--bg-2))"
              strokeWidth="6"
            />
            {/* Progress ring */}
            <motion.circle
              cx="70"
              cy="70"
              r="58"
              fill="none"
              stroke={passed ? "hsl(var(--correct))" : "hsl(var(--incorrect))"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - percentage / 100) }}
              transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
          
          {/* Score text inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className={cn(
              'font-display text-4xl',
              'text-text'
            )}>
              {percentage}
            </span>
            <span className="text-sm text-text-muted -mt-1">%</span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="text-sm text-text-soft mt-3"
        >
          {score} of {total} correct
        </motion.p>
      </div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-text-soft mb-10"
      >
        {getMessage()}
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="space-y-3"
      >
        {passed ? (
          <>
            {/* Pass state: Dig Deeper and Next Topic */}
            <div className="flex gap-3">
              <button
                onClick={onDigDeeper}
                disabled={isLoading}
                className="flex-1 px-5 py-3 rounded-xl border border-border bg-surface
                           text-text text-sm font-medium
                           hover:border-text-muted transition-colors duration-150
                           disabled:opacity-50"
              >
                Dig Deeper
              </button>
              <button
                onClick={onNextTopic}
                disabled={isLoading}
                className="flex-1 px-5 py-3 rounded-xl bg-accent text-accent-text
                           text-sm font-medium
                           hover:opacity-90 transition-opacity duration-150
                           disabled:opacity-50"
              >
                Next Topic
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Fail state: Generate Notes */}
            <button
              onClick={onGenerateNotes}
              disabled={isLoading}
              className="w-full px-5 py-3 rounded-xl bg-accent text-accent-text
                         text-sm font-medium
                         hover:opacity-90 transition-opacity duration-150
                         disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Notes'}
            </button>
            <button
              onClick={onRetake}
              disabled={isLoading}
              className="w-full px-5 py-3 rounded-xl border border-border bg-surface
                         text-text text-sm font-medium
                         hover:border-text-muted transition-colors duration-150
                         disabled:opacity-50"
            >
              Try Again
            </button>
          </>
        )}

        {/* Review button (always available) */}
        <button
          onClick={onReview}
          className="w-full px-5 py-2.5 text-sm text-text-soft
                     hover:text-text transition-colors duration-150"
        >
          Review answers
        </button>
      </motion.div>
    </motion.div>
  );
}
