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
    const topic = pathForSession?.topics.find((t) => t.id === session.topic_id) ?? {
      id: session.topic_id,
      path_id: session.path_id,
      user_id: session.user_id,
      title: session.subject || 'Quiz Retake',
      summary: '',
      order_index: 0,
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

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-text tracking-tight mb-1">Quizzes</h1>
            <p className="text-text-soft text-sm">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
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
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-soft text-sm">No sessions match your filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setFilter('all')}
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSessions).map(([subject, subjectSessions]) => (
              <SubjectGroup
                key={subject}
                subject={subject}
                sessions={subjectSessions}
                isExpanded={expandedSubjects.has(subject)}
                onToggle={() => toggleSubject(subject)}
                onRetake={handleRetake}
                onView={handleViewResults}
                allPaths={allPaths}
              />
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
    <div className="bg-surface border border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <Clock className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-medium text-text mb-1">No quizzes yet</h3>
      <p className="text-text-soft text-sm mb-4">
        Upload some content to start your first quiz session.
      </p>
      <Button onClick={() => navigate('/dashboard')}>
        Get Started
      </Button>
    </div>
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
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Subject Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          )}
          <div className="text-left">
            <h3 className="font-medium text-text">{subject}</h3>
            <p className="text-xs text-text-muted">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {passedCount} passed • {avgScore}% avg
            </p>
          </div>
        </div>
      </button>

      {/* Sessions List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border divide-y divide-border">
              {sessions.map((session) => {
                // Look up topic from the session's specific path (works for archived paths too)
                const pathForSession = allPaths.find((p) => p.id === session.path_id);
                const topic = pathForSession?.topics.find((t) => t.id === session.topic_id);
                return (
                  <SessionRow
                    key={session.id}
                    session={session}
                    topicTitle={topic?.title || 'Unknown Topic'}
                    onRetake={() => onRetake(session)}
                    onView={() => onView(session)}
                  />
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
  const scoreText = isComplete
    ? `${session.score}/${session.total} (${session.score_pct}%)`
    : 'In progress';

  const StatusIcon = isComplete
    ? passed
      ? CheckCircle2
      : XCircle
    : Clock;

  const statusColor = isComplete
    ? passed
      ? 'text-green-500'
      : 'text-red-500'
    : 'text-amber-500';

  // Get question types from config
  const questionTypes = session.config?.types || [];
  const typeLabel = formatQuestionTypes(questionTypes);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn('h-5 w-5', statusColor)} />
        <div>
          <p className="text-sm font-medium text-text">{topicTitle}</p>
          <p className="text-xs text-text-muted">
            {scoreText}
            {typeLabel && ` • ${typeLabel}`}
            {session.time_taken_secs && ` • ${Math.round(session.time_taken_secs / 60)}m`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isComplete && (
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRetake}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
