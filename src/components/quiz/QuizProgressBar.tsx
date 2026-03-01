import { cn } from '@/lib/utils';

interface QuizProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function QuizProgressBar({ current, total, className }: QuizProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-1 bg-bg-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Text indicator */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Question {current} of {total}</span>
        <span className="tabular-nums">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
