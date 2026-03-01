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
      <h3 className="text-sm text-text-soft font-medium mb-3">Recent sessions</h3>
      <div className="space-y-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionClick?.(session.id)}
            className={cn(
              'w-full flex items-center justify-between py-3 px-4',
              'bg-surface border border-border rounded-lg',
              'hover:border-text-muted transition-colors duration-150 text-left',
              !onSessionClick && 'cursor-default'
            )}
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm text-text block truncate">
                {session.topicTitle}
              </span>
              <span className="text-xs text-text-muted">
                {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  session.score / session.total >= 0.75
                    ? 'text-correct'
                    : 'text-text-muted'
                )}
              >
                {session.score}/{session.total}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
