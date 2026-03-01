import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ScoreChart } from "@/components/stats/ScoreChart";
import { ActivityCalendar } from "@/components/stats/ActivityCalendar";
import { SubjectTable } from "@/components/stats/SubjectTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Target, Flame, Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { useSessionsStore } from "@/store/sessions";
import { useNotesStore } from "@/store/notes";
import { usePathsStore, selectActivePath } from "@/store/paths";

export default function StatsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  
  const sessions = useSessionsStore((s) => s.sessions);
  const { getStats } = useSessionsStore();
  const notes = useNotesStore((s) => s.notes);
  // Subscribe directly to paths store for reactive learningPath
  const learningPath = usePathsStore(selectActivePath);
  // Get ALL paths for subjects performance
  const allPaths = usePathsStore((s) => s.paths);
  const setActivePath = usePathsStore((s) => s.setActivePath);
  
  // Calculate stats from real sessions
  const stats = useMemo(() => {
    const storeStats = getStats();
    const topicsMastered = learningPath?.topics.filter((topic) => {
      const topicSessions = sessions.filter((s) => s.topic_id === topic.id && s.passed);
      return topicSessions.length > 0;
    }).length || 0;
    
    // Calculate streak
    const sortedDates = [...new Set(
      sessions
        .filter((s) => s.submitted_at)
        .map((s) => new Date(s.submitted_at!).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date().toDateString();
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
    
    return {
      totalQuizzes: storeStats.completedSessions,
      avgScore: storeStats.averageScore,
      notesGenerated: notes.length,
      topicsMastered,
      streak,
    };
  }, [sessions, notes, learningPath, getStats]);
  
  // Generate score data from sessions
  const scoreData = useMemo(() => {
    const completedSessions = sessions.filter((s) => s.submitted_at && s.score_pct !== null);
    
    // Group by date
    const byDate = completedSessions.reduce<Record<string, { scores: number[]; count: number }>>((acc, session) => {
      const date = new Date(session.submitted_at!).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { scores: [], count: 0 };
      acc[date].scores.push(session.score_pct || 0);
      acc[date].count++;
      return acc;
    }, {});
    
    return Object.entries(byDate)
      .map(([date, data]) => ({
        date: new Date(date).toISOString(),
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        quizCount: data.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);
  
  // Generate activity data from sessions AND notes
  const activityData = useMemo(() => {
    const byDate: Record<string, number> = {};
    
    // Count sessions
    sessions.forEach((session) => {
      const date = session.submitted_at 
        ? new Date(session.submitted_at).toISOString().split('T')[0]
        : new Date(session.started_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });
    
    // Count notes created
    notes.forEach((note) => {
      const date = new Date(note.created_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });
    
    return Object.entries(byDate).map(([date, count]) => ({
      date: new Date(date).toISOString(),
      count,
    }));
  }, [sessions, notes]);
  
  // Generate subject data - group by learning path (not topics)
  const subjectData = useMemo(() => {
    if (allPaths.length === 0) return [];
    
    // Group sessions by learning path
    const pathStats = allPaths.map((path) => {
      const pathSessions = sessions.filter(
        (s) => s.path_id === path.id && s.submitted_at
      );
      
      const avgScore = pathSessions.length > 0
        ? Math.round(
            pathSessions.reduce((sum, s) => sum + (s.score_pct || 0), 0) / pathSessions.length
          )
        : 0;
      
      // Sort sessions by date (newest first)
      const sortedSessions = [...pathSessions].sort(
        (a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime()
      );
      
      const lastSession = sortedSessions[0];
      const prevSessions = sortedSessions.slice(1, 4);
      const prevAvg = prevSessions.length > 0
        ? prevSessions.reduce((sum, s) => sum + (s.score_pct || 0), 0) / prevSessions.length
        : avgScore;
      
      let trend: "up" | "down" | "neutral" = "neutral";
      if (lastSession?.score_pct && lastSession.score_pct > prevAvg + 5) trend = "up";
      else if (lastSession?.score_pct && lastSession.score_pct < prevAvg - 5) trend = "down";
      
      return {
        id: path.id,
        name: path.subject || path.title || 'Untitled Path',
        quizzesCompleted: pathSessions.length,
        averageScore: avgScore,
        lastQuizScore: lastSession?.score_pct || 0,
        lastActivity: lastSession ? new Date(lastSession.submitted_at!) : undefined,
        trend,
      };
    });
    
    return pathStats.filter((p) => p.quizzesCompleted > 0);
  }, [allPaths, sessions]);

  // Time insights - analyze best study times
  const timeInsights = useMemo(() => {
    const completedSessions = sessions.filter((s) => s.submitted_at && s.score_pct !== null);
    if (completedSessions.length === 0) return null;
    
    // Group by time of day (morning: 5-12, afternoon: 12-17, evening: 17-21, night: 21-5)
    type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'night';
    const timeBlocks: Record<TimeBlock, { scores: number[]; count: number }> = {
      morning: { scores: [], count: 0 },
      afternoon: { scores: [], count: 0 },
      evening: { scores: [], count: 0 },
      night: { scores: [], count: 0 },
    };
    
    completedSessions.forEach((session) => {
      const hour = new Date(session.submitted_at!).getHours();
      let block: TimeBlock;
      if (hour >= 5 && hour < 12) block = 'morning';
      else if (hour >= 12 && hour < 17) block = 'afternoon';
      else if (hour >= 17 && hour < 21) block = 'evening';
      else block = 'night';
      
      timeBlocks[block].scores.push(session.score_pct || 0);
      timeBlocks[block].count++;
    });
    
    // Calculate averages and find best time
    // Show any block with at least 1 completed quiz
    const blockStats = Object.entries(timeBlocks)
      .filter(([_, data]) => data.count >= 1)
      .map(([block, data]) => ({
        block: block as TimeBlock,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
    
    if (blockStats.length === 0) return null;
    
    const bestBlock = blockStats[0];
    const icons: Record<TimeBlock, typeof Sun> = {
      morning: Sunrise,
      afternoon: Sun,
      evening: Sunset,
      night: Moon,
    };
    const labels: Record<TimeBlock, string> = {
      morning: 'Morning (5am - 12pm)',
      afternoon: 'Afternoon (12pm - 5pm)',
      evening: 'Evening (5pm - 9pm)',
      night: 'Night (9pm - 5am)',
    };
    
    return {
      bestBlock: bestBlock.block,
      bestScore: bestBlock.avgScore,
      bestLabel: labels[bestBlock.block],
      BestIcon: icons[bestBlock.block],
      totalSessions: completedSessions.length,
      blockStats,
    };
  }, [sessions]);

  // Empty state for no data
  const hasData = sessions.length > 0;


  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-content mx-auto"
      >
        <h1 className="font-display text-3xl text-text tracking-tight mb-2">Stats</h1>
        <p className="text-text-soft text-base mb-8">Your learning progress at a glance.</p>

        {/* Summary numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="font-display text-3xl text-text">{stats.totalQuizzes}</p>
            <p className="text-xs text-text-muted mt-1">Quizzes taken</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="font-display text-3xl text-text">{stats.notesGenerated}</p>
            <p className="text-xs text-text-muted mt-1">Notes generated</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-correct/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-correct" />
              </div>
            </div>
            <p className="font-display text-3xl text-text">{stats.topicsMastered}</p>
            <p className="text-xs text-text-muted mt-1">Topics mastered</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="font-display text-3xl text-text">{stats.streak} days</p>
            <p className="text-xs text-text-muted mt-1">Current streak</p>
          </motion.div>
        </div>

        {/* Charts section - only show if we have data */}
        {hasData ? (
          <div className="space-y-6">
            {/* Score chart with period selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-text">Performance Over Time</h2>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <ScoreChart data={scoreData} period={period} height={250} />
            </motion.div>

            {/* Activity calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ActivityCalendar data={activityData} months={3} />
            </motion.div>

            {/* Subject table */}
            {subjectData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SubjectTable 
                  subjects={subjectData}
                  onSubjectClick={(pathId) => {
                    // Set the clicked path as active and navigate to learn page
                    setActivePath(pathId);
                    navigate('/learn');
                  }}
                />
              </motion.div>
            )}

            {/* Time Insights */}
            {timeInsights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="font-medium text-text mb-4">Study Time Insights</h2>
                <div className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                      <timeInsights.BestIcon className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Your best study time</p>
                      <p className="font-display text-xl text-text">{timeInsights.bestLabel}</p>
                      <p className="text-sm text-correct mt-1">
                        Average score: {timeInsights.bestScore}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Time block breakdown */}
                  <div className="space-y-3">
                    <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Performance by time of day</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'morning' as const, label: 'Morning', Icon: Sunrise },
                        { key: 'afternoon' as const, label: 'Afternoon', Icon: Sun },
                        { key: 'evening' as const, label: 'Evening', Icon: Sunset },
                        { key: 'night' as const, label: 'Night', Icon: Moon },
                      ].map(({ key, label, Icon }) => {
                        const block = timeInsights.blockStats.find(b => b.block === key);
                        const isBest = key === timeInsights.bestBlock;
                        return (
                          <div 
                            key={key}
                            className={`p-3 rounded-lg border ${
                              isBest 
                                ? 'bg-accent/5 border-accent/30' 
                                : 'bg-background border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${isBest ? 'text-accent' : 'text-text-muted'}`} />
                              <span className="text-xs font-medium text-text">{label}</span>
                            </div>
                            {block ? (
                              <>
                                <p className={`font-display text-lg ${isBest ? 'text-accent' : 'text-text'}`}>
                                  {block.avgScore}%
                                </p>
                                <p className="text-xs text-text-muted">{block.count} quizzes</p>
                              </>
                            ) : (
                              <p className="text-xs text-text-muted italic">No data</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-xl p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-xl text-text mb-2">
              No stats yet
            </h3>
            <p className="text-text-soft text-sm mb-6 max-w-sm mx-auto">
              Complete your first quiz to start tracking your learning progress. We'll show you detailed charts and insights here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                         hover:opacity-90 transition-opacity duration-150"
            >
              Start Learning
            </button>
          </motion.div>
        )}
      </motion.div>
    </Shell>
  );
}
