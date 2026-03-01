import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContinueCardProps {
  pathTitle: string;
  subject: string;
  topicTitle: string;
  topicIndex: number;
  topicsTotal: number;
  lastScore: number | null;
  onContinue: () => void;
  className?: string;
}

export function ContinueCard({
  pathTitle,
  subject,
  topicTitle,
  topicIndex,
  topicsTotal,
  lastScore,
  onContinue,
  className,
}: ContinueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-surface border border-border rounded-xl p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Continue studying
          </p>

          {/* Path/Subject title */}
          <h2 className="font-display text-2xl text-text mb-1">{pathTitle}</h2>

          {/* Topic info */}
          <p className="text-sm text-text-soft">
            Topic {topicIndex} of {topicsTotal} — {topicTitle}
          </p>

          {/* Last score */}
          {lastScore !== null && (
            <p className="text-xs text-text-muted mt-2">
              Last score: <span className="tabular-nums">{lastScore}/10</span>
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-right">
            <span className="font-display text-3xl text-accent tabular-nums">
              {topicIndex}
            </span>
            <span className="text-lg text-text-muted">/{topicsTotal}</span>
          </div>
          <p className="text-xs text-text-muted">topics</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-bg-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((topicIndex - 1) / topicsTotal) * 100}%` }}
          />
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg
                   bg-accent text-accent-text text-sm font-medium
                   hover:opacity-90 transition-opacity duration-150"
      >
        Continue
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
