import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SessionItem {
  id: string;
  topicTitle: string;
  score: number;
  total: number;
  completedAt: string;
}

interface RecentSessionsProps {
  sessions: SessionItem[];
  onSessionClick?: (id: string) => void;
  className?: string;
}

export function RecentSessions({
  sessions,
  onSessionClick,
  className,
}: RecentSessionsProps) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-4 px-1">Recent Sessions</h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionClick?.(session.id)}
            className={cn(
              'w-full flex items-center justify-between p-4',
              'bg-surface border border-border rounded-xl',
              'hover:bg-surface/80 hover:shadow-md hover:border-border/80 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-left group',
              !onSessionClick && 'cursor-default'
            )}
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-sm font-medium text-text block truncate group-hover:text-accent transition-colors">
                {session.topicTitle}
              </span>
              <span className="text-xs text-text-muted mt-1 block">
                {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    session.score / session.total >= 0.75
                      ? 'text-correct drop-shadow-[0_0_8px_rgba(var(--correct),0.4)]'
                      : 'text-text-muted'
                  )}
                >
                  {session.score}/{session.total}
                </span>
                <span className="text-[10px] text-text-muted uppercase font-medium tracking-wider">Score</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
