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
        'bg-surface border border-border rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80 relative overflow-hidden group',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between relative z-10">
        <div className="flex-1">
          {/* Label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">
              Continue studying
            </p>
          </div>

          {/* Path/Subject title */}
          <h2 className="font-display text-3xl text-text mb-2 tracking-tight">{pathTitle}</h2>

          {/* Topic info */}
          <p className="text-base text-text-soft font-medium">
            Topic {topicIndex} of {topicsTotal} — <span className="text-text">{topicTitle}</span>
          </p>

          {/* Last score */}
          {lastScore !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-bg-2 text-xs font-medium text-text-muted">
                Last Score
              </span>
              <span className="text-sm font-semibold tabular-nums text-text">{lastScore}/10</span>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="hidden sm:flex flex-col items-end mt-4 sm:mt-0">
          <div className="text-right flex items-baseline gap-1">
            <span className="font-display text-4xl text-accent tabular-nums">
              {topicIndex}
            </span>
            <span className="text-xl font-medium text-text-muted">/{topicsTotal}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8 relative z-10">
        <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((topicIndex - 1) / topicsTotal) * 100}%` }}
          />
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg
                   bg-accent text-accent-text text-sm font-medium
                   hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-md shadow-accent/20 relative z-10"
      >
        Jump Back In
        <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}
