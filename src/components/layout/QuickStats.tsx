import { useMemo, memo } from 'react';
import { Flame, TrendingUp, Zap } from 'lucide-react';
import { useSessionsStore } from '@/store/sessions';

export const QuickStats = memo(function QuickStats() {
  const sessions = useSessionsStore((s) => s.sessions);

  // Calculate stats
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    // Today's date for comparison
    const today = new Date().toDateString();
    const todaysSessions = sessions.filter(
      (s) => s.submitted_at && new Date(s.submitted_at).toDateString() === today
    );

    // Calculate current streak
    const sortedDates = [...new Set(
      sessions
        .filter((s) => s.submitted_at)
        .map((s) => new Date(s.submitted_at).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    if (sortedDates.length > 0) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate average score
    const completedSessions = sessions.filter((s) => s.submitted_at && s.score_pct !== null);
    const avgScore =
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((sum, s) => sum + (s.score_pct || 0), 0) /
              completedSessions.length
          )
        : 0;

    return {
      streak,
      todaysActivities: todaysSessions.length,
      avgScore,
      hasData: completedSessions.length > 0,
    };
  }, [sessions]);

  if (!stats || !stats.hasData) return null;

  return (
    <div className="hidden lg:flex items-center gap-6 px-4 py-2">
      {/* Streak */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 transition-colors duration-200"
        title="Current study streak"
      >
        <Flame size={16} className="flex-shrink-0" />
        <div className="text-xs leading-tight">
          <div className="font-semibold text-sm">{stats.streak}</div>
          <div className="text-[10px] opacity-70">day{stats.streak !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Today's Activity */}
      {stats.todaysActivities > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 text-accent hover:bg-accent/10 transition-colors duration-200"
          title="Activities today"
        >
          <Zap size={16} className="flex-shrink-0" />
          <div className="text-xs leading-tight">
            <div className="font-semibold text-sm">{stats.todaysActivities}</div>
            <div className="text-[10px] opacity-70">today</div>
          </div>
        </div>
      )}

      {/* Average Score */}
      {stats.avgScore > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-correct/5 text-correct hover:bg-correct/10 transition-colors duration-200"
          title="Average score"
        >
          <TrendingUp size={16} className="flex-shrink-0" />
          <div className="text-xs leading-tight">
            <div className="font-semibold text-sm">{stats.avgScore}%</div>
            <div className="text-[10px] opacity-70">avg</div>
          </div>
        </div>
      )}
    </div>
  );
});
