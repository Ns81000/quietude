import { useFocusHistoryStore } from '@/store/focusHistory';
import { getSoundById } from '@/lib/focus/audioData.tsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, TrendingUp, Target, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FocusHistory() {
  const { sessions, getSessionStats, clearHistory } = useFocusHistoryStore();
  const stats = getSessionStats();
  const recentSessions = useFocusHistoryStore(state => state.getSessions(10));
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Focus History"
        description="Track your focus sessions and productivity"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Target className="text-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-text-soft">Total Sessions</p>
              <p className="text-2xl font-bold text-text">{stats.totalSessions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-correct/10">
              <CheckCircle2 className="text-correct" size={20} />
            </div>
            <div>
              <p className="text-sm text-text-soft">Completed</p>
              <p className="text-2xl font-bold text-text">{stats.completedSessions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Clock className="text-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-text-soft">Total Minutes</p>
              <p className="text-2xl font-bold text-text">{stats.totalMinutes}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Award className="text-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-text-soft">Completion Rate</p>
              <p className="text-2xl font-bold text-text">{stats.completionRate}%</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Recent Sessions</h2>
          {sessions.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              className="text-incorrect hover:text-incorrect"
            >
              Clear History
            </Button>
          )}
        </div>
        
        {recentSessions.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-soft">No focus sessions yet</p>
            <p className="text-sm text-text-muted mt-1">
              Start your first session to track your progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-bg-2 hover:bg-accent/5 transition-colors"
              >
                {/* Status Icon */}
                <div className={`p-2 rounded-full ${
                  session.completed ? 'bg-correct/10' : 'bg-incorrect/10'
                }`}>
                  {session.completed ? (
                    <CheckCircle2 size={20} className="text-correct" />
                  ) : (
                    <XCircle size={20} className="text-incorrect" />
                  )}
                </div>
                
                {/* Session Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text">
                      {formatDuration(session.actualDuration)}
                    </span>
                    <span className="text-sm text-text-muted">
                      / {formatDuration(session.duration)} planned
                    </span>
                  </div>
                  
                  {/* Sounds */}
                  <div className="flex flex-wrap gap-1">
                    {session.soundIds.slice(0, 3).map(soundId => {
                      const sound = getSoundById(soundId);
                      return sound ? (
                        <Badge key={soundId} variant="secondary" className="text-xs">
                          <span className="mr-1">{sound.icon}</span>
                          {sound.label}
                        </Badge>
                      ) : null;
                    })}
                    {session.soundIds.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{session.soundIds.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Time Ago */}
                <div className="text-sm text-text-muted text-right">
                  {formatDistanceToNow(session.startTime, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Insights */}
      {stats.totalSessions > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" />
            Insights
          </h2>
          <div className="space-y-3 text-sm">
            <p className="text-text-soft">
              <span className="font-medium text-text">Average session:</span>{' '}
              {stats.averageDuration} minutes
            </p>
            <p className="text-text-soft">
              <span className="font-medium text-text">Completion rate:</span>{' '}
              {stats.completionRate}% of sessions completed
            </p>
            {stats.completionRate >= 80 && (
              <p className="text-correct">
                🎉 Excellent! You're maintaining great focus consistency.
              </p>
            )}
            {stats.completionRate < 50 && stats.totalSessions >= 3 && (
              <p className="text-text-soft">
                💡 Tip: Try shorter sessions (15-25 min) to build the habit.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
