import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionsStore } from '@/store/sessions';
import { useQuizStore, QuizSession } from '@/store/quiz';
import { usePathsStore, selectActivePath } from '@/store/paths';
import { SessionReviewModal } from '@/components/quiz/SessionReviewModal';
import type { LearningPath } from '@/types/quiz';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  Eye,
  Trophy,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'passed' | 'failed' | 'incomplete';

export default function QuizzesPage() {
  const navigate = useNavigate();
  const sessions = useSessionsStore((s) => s.sessions);
  const { setPhase, selectTopic } = useQuizStore();
  // Subscribe directly to paths store for reactive learningPath
  const learningPath = usePathsStore(selectActivePath);
  // Get ALL paths (including archived) for topic title lookup in quiz history
  const allPaths = usePathsStore((s) => s.paths);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set(['General']));
  const [reviewSession, setReviewSession] = useState<QuizSession | null>(null);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true;
    if (filter === 'passed') return session.passed === true;
    if (filter === 'failed') return session.passed === false;
    if (filter === 'incomplete') return session.submitted_at === null;
    return true;
  });

  // Group by subject
  const groupedSessions = filteredSessions.reduce<Record<string, QuizSession[]>>((acc, session) => {
    // Use subject from session, fallback to 'General'
    const subject = session.subject || 'General';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(session);
    return acc;
  }, {});

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) {
        next.delete(subject);
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  const handleRetake = (session: QuizSession) => {
    // Find topic from any path (including archived) for retake
    const pathForSession = allPaths.find((p) => p.id === session.path_id);
    const pathTopic = pathForSession?.topics?.find((t) => t.id === session.topic_id);
    const topic: import('@/types/quiz').Topic = {
      id: session.topic_id,
      path_id: session.path_id,
      user_id: session.user_id,
      title: pathTopic?.title || session.subject || 'Quiz Retake',
      summary: pathTopic?.summary || '',
      order_index: pathTopic?.order_index ?? 0,
      difficulty: 'intermediate' as const,
      status: 'active' as const,
      best_score: 0,
      attempts: 0,
      dig_deeper_passed: false,
      unlocked_at: null,
      passed_at: null,
    };
    selectTopic(topic);
    setPhase('CONFIGURING');
    navigate('/learn');
  };

  const handleViewResults = (session: QuizSession) => {
    // Open the review modal
    setReviewSession(session);
  };

  // Summary stats
  const totalPassed = sessions.filter((s) => s.passed === true).length;
  const totalFailed = sessions.filter((s) => s.passed === false).length;
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score_pct || 0), 0) / sessions.length)
    : 0;

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-content mx-auto"
      >
        <div className="relative rounded-2xl bg-gradient-to-br from-accent/8 via-transparent to-transparent border border-accent/8 p-6 mb-6 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-accent/6 blur-2xl" />
          <div className="relative">
            <h1 className="font-display text-3xl text-text tracking-tight mb-1">Quizzes</h1>
            <p className="text-text-soft text-sm">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Quick Stats Bar & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {sessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-correct/10 text-correct text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {totalPassed} passed
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-incorrect/10 text-incorrect text-xs font-medium">
                <XCircle className="h-3.5 w-3.5" />
                {totalFailed} failed
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <Trophy className="h-3.5 w-3.5" />
                {avgScore}% avg
              </div>
            </motion.div>
          ) : (
            <div /> // Spacer if no sessions
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Filter className="h-4 w-4" />
                {filter === 'all' ? 'All Sessions' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filter === 'all'}
                onCheckedChange={() => setFilter('all')}
              >
                All sessions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === 'passed'}
                onCheckedChange={() => setFilter('passed')}
              >
                Passed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === 'failed'}
                onCheckedChange={() => setFilter('failed')}
              >
                Failed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === 'incomplete'}
                onCheckedChange={() => setFilter('incomplete')}
              >
                Incomplete
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {sessions.length === 0 ? (
          <EmptyState />
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-xl p-8 text-center"
          >
            <p className="text-text-soft text-sm">No sessions match your filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setFilter('all')}
            >
              Clear filter
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSessions).map(([subject, subjectSessions], groupIndex) => (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.08 }}
              >
                <SubjectGroup
                  subject={subject}
                  sessions={subjectSessions}
                  isExpanded={expandedSubjects.has(subject)}
                  onToggle={() => toggleSubject(subject)}
                  onRetake={handleRetake}
                  onView={handleViewResults}
                  allPaths={allPaths}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Session Review Modal */}
      {reviewSession && (
        <SessionReviewModal
          session={reviewSession}
          topicTitle={
            allPaths.find((p) => p.id === reviewSession.path_id)
              ?.topics.find((t) => t.id === reviewSession.topic_id)?.title ||
            'Quiz Review'
          }
          isOpen={!!reviewSession}
          onClose={() => setReviewSession(null)}
        />
      )}
    </Shell>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative bg-surface border border-border rounded-2xl p-10 text-center overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-6 left-8 text-accent/15">
        <Sparkles size={24} />
      </div>
      <div className="absolute bottom-8 right-10 text-accent/10">
        <BookOpen size={28} />
      </div>
      <div className="absolute top-1/2 right-6 w-16 h-16 rounded-full bg-accent/5 -translate-y-1/2" />
      <div className="absolute bottom-4 left-12 w-8 h-8 rounded-full bg-correct/5" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-5"
      >
        <Clock className="h-7 w-7 text-accent" />
      </motion.div>
      <h3 className="font-display text-xl text-text mb-2">No quizzes yet</h3>
      <p className="text-text-soft text-sm mb-6 max-w-xs mx-auto leading-relaxed">
        Upload some content to start your first quiz session. Your journey begins with a single question.
      </p>
      <Button onClick={() => navigate('/dashboard')} className="shadow-sm">
        Get Started
      </Button>
    </motion.div>
  );
}

interface SubjectGroupProps {
  subject: string;
  sessions: QuizSession[];
  isExpanded: boolean;
  onToggle: () => void;
  onRetake: (session: QuizSession) => void;
  onView: (session: QuizSession) => void;
  allPaths: LearningPath[];
}

function SubjectGroup({
  subject,
  sessions,
  isExpanded,
  onToggle,
  onRetake,
  onView,
  allPaths,
}: SubjectGroupProps) {
  const passedCount = sessions.filter((s) => s.passed === true).length;
  const avgScore = sessions.length > 0
    ? Math.round(
        sessions.reduce((sum, s) => sum + (s.score_pct || 0), 0) / sessions.length
      )
    : 0;

  return (
    <div className={cn(
      "bg-surface border border-border rounded-xl overflow-hidden transition-shadow duration-300",
      isExpanded && "shadow-md"
    )}>
      {/* Subject Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-bg-2/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </motion.div>
          <div className="text-left">
            <h3 className="font-medium text-text">{subject}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {passedCount} passed • {avgScore}% avg
            </p>
          </div>
        </div>

        {/* Mini score indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            avgScore >= 70
              ? "bg-correct/10 text-correct"
              : avgScore >= 40
                ? "bg-accent/10 text-accent"
                : "bg-incorrect/10 text-incorrect"
          )}>
            {avgScore}%
          </div>
        </div>
      </button>

      {/* Sessions List — capped height to avoid pushing page down */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="border-t border-border divide-y divide-border/60 max-h-[320px] overflow-y-auto">
              {sessions.map((session, index) => {
                // Look up topic from the session's specific path (works for archived paths too)
                const pathForSession = allPaths.find((p) => p.id === session.path_id);
                const topic = pathForSession?.topics.find((t) => t.id === session.topic_id);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <SessionRow
                      session={session}
                      topicTitle={topic?.title || 'Unknown Topic'}
                      onRetake={() => onRetake(session)}
                      onView={() => onView(session)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SessionRowProps {
  session: QuizSession;
  topicTitle: string;
  onRetake: () => void;
  onView: () => void;
}

// Helper to format question types for display
function formatQuestionTypes(types: string[]): string {
  if (!types || types.length === 0) return '';
  if (types.length >= 3) return 'Mixed';
  
  const typeLabels: Record<string, string> = {
    mcq: 'MCQ',
    true_false: 'T/F',
    fill_blank: 'Fill',
  };
  
  return types.map(t => typeLabels[t] || t).join(', ');
}

function SessionRow({ session, topicTitle, onRetake, onView }: SessionRowProps) {
  const isComplete = session.submitted_at !== null;
  const passed = session.passed === true;
  const scorePct = session.score_pct || 0;
  const scoreText = isComplete
    ? `${session.score}/${session.total}`
    : 'In progress';

  const StatusIcon = isComplete
    ? passed
      ? CheckCircle2
      : XCircle
    : Clock;

  const statusColor = isComplete
    ? passed
      ? 'text-correct'
      : 'text-incorrect'
    : 'text-amber-500';

  // Get question types from config
  const questionTypes = session.config?.types || [];
  const typeLabel = formatQuestionTypes(questionTypes);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-bg-2/30 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isComplete
            ? passed
              ? "bg-correct/10"
              : "bg-incorrect/10"
            : "bg-amber-500/10"
        )}>
          <StatusIcon className={cn('h-4.5 w-4.5', statusColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{topicTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Score pill */}
            {isComplete && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                passed ? "bg-correct/10 text-correct" : "bg-incorrect/10 text-incorrect"
              )}>
                {scorePct}%
              </span>
            )}
            <p className="text-xs text-text-muted truncate">
              {scoreText}
              {typeLabel && ` • ${typeLabel}`}
              {session.time_taken_secs && ` • ${Math.round(session.time_taken_secs / 60)}m`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isComplete && (
          <Button variant="ghost" size="sm" onClick={onView} className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRetake} className="h-8 w-8 p-0">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
