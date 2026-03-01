import { useState, useEffect } from 'react';
import { AlertCircle, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PENDING_ANSWERS_KEY = 'quietude:quiz:draft';

interface PendingQuiz {
  sessionId: string;
  topicId: string;
  topicTitle: string;
  answers: unknown[];
  questionIndex: number;
  savedAt: string;
}

interface ResumeBarProps {
  onResume: (pendingQuiz: PendingQuiz) => void;
  className?: string;
}

export function ResumeBar({ onResume, className }: ResumeBarProps) {
  const [pendingQuiz, setPendingQuiz] = useState<PendingQuiz | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PENDING_ANSWERS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as PendingQuiz;
        // Only show if saved within the last 24 hours
        const savedTime = new Date(data.savedAt).getTime();
        const now = Date.now();
        const hoursSinceSave = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursSinceSave < 24 && data.answers && data.answers.length > 0) {
          setPendingQuiz(data);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.removeItem(PENDING_ANSWERS_KEY);
  };

  const handleResume = () => {
    if (pendingQuiz) {
      onResume(pendingQuiz);
    }
  };

  if (!pendingQuiz || isDismissed) {
    return null;
  }

  const savedTime = new Date(pendingQuiz.savedAt);
  const timeAgo = getTimeAgo(savedTime);
  const answeredCount = pendingQuiz.answers?.length || 0;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50',
        'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
        'border border-amber-500/30 rounded-xl p-4 shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">Resume your quiz?</h4>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {pendingQuiz.topicTitle || 'Untitled Topic'}
          </p>
          <p className="text-xs text-muted-foreground">
            {answeredCount} question{answeredCount !== 1 ? 's' : ''} answered • Saved {timeAgo}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
          
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleResume}
          >
            <PlayCircle className="h-4 w-4" />
            Resume
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'yesterday';
}

export default ResumeBar;
