import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from '@/components/layout/Shell';
import { useUserStore } from '@/store/user';
import { DropZone } from '@/components/upload/DropZone';
import { PasteArea } from '@/components/upload/PasteArea';
import { YouTubeInput } from '@/components/upload/YouTubeInput';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { fetchTranscript, getYouTubeUrl, type YouTubeError } from '@/lib/youtube';
import { ResumeBar } from '@/components/quiz/ResumeBar';
import { useQuizStore } from '@/store/quiz';
import { usePathsStore, selectActivePath } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { removeFromSyncQueueByPathId } from '@/lib/firebase/sync';
import { toast } from 'sonner';
import { ChevronDown, BookOpen, Archive, Trash2, Plus, RotateCcw, Filter, Check, Trophy, Sparkles, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  analyzeContent,
  analyzeFile,
  processFile,
  quickAnalyze,
  getMockAnalysis,
  hasApiKeys,
  isMultimodalSupported,
} from '@/lib/gemini';

export default function DashboardPage() {
  const navigate = useNavigate();
  const name = useUserStore((s) => s.name);
  const studyTime = useUserStore((s) => s.studyTime);
  const { setPhase } = useQuizStore();
  
  // Subscribe directly to paths store for reactivity
  const paths = usePathsStore((s) => s.paths);
  const activePathId = usePathsStore((s) => s.activePathId);
  const learningPath = usePathsStore(selectActivePath);
  
  const sessions = useSessionsStore((s) => s.sessions);
  
  // Check if there's an active learning path
  const hasActivePath = learningPath !== null;
  const hasMultiplePaths = paths.filter((p) => p.status === 'active').length > 1;

  const handleResumeQuiz = (pendingQuiz: {
    sessionId: string;
    topicId: string;
    topicTitle: string;
    answers: unknown[];
    questionIndex: number;
    savedAt: string;
  }) => {
    // Load pending answers from storage and navigate to quiz
    const { loadPendingAnswers } = useQuizStore.getState();
    loadPendingAnswers(); // This restores answers from localStorage
    setPhase('QUIZ_ACTIVE');
    navigate('/learn');
  };

  return (
    <Shell>
      <div>
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-text tracking-tight">
            {getGreeting(studyTime)}, {name || 'there'}
          </h1>
          <p className="text-text-soft text-base mt-1">
            {getSubGreeting(hasActivePath, studyTime)}
          </p>
        </div>

        {hasActivePath ? (
          <ActiveDashboard />
        ) : (
          <EmptyDashboard />
        )}
      </div>
      
      {/* Resume bar for crash recovery */}
      <ResumeBar onResume={handleResumeQuiz} />
    </Shell>
  );
}

function getGreeting(preferredStudyTime?: string | null): string {
  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);
  
  // If user is studying during their preferred time, add encouragement
  const isPeakStudyTime = preferredStudyTime && isCurrentlyPreferredTime(hour, preferredStudyTime);
  
  if (isPeakStudyTime) {
    const greetings = {
      morning: 'Rise and shine',
      afternoon: 'Power hour',
      evening: 'Focus time',
      night: 'Night owl mode',
    };
    return greetings[preferredStudyTime as keyof typeof greetings] || getBasicGreeting(timeOfDay);
  }
  
  return getBasicGreeting(timeOfDay);
}

function getBasicGreeting(timeOfDay: string): string {
  const greetings: Record<string, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Late night',
  };
  return greetings[timeOfDay] || 'Hello';
}

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function isCurrentlyPreferredTime(hour: number, preferredTime: string): boolean {
  const timeRanges: Record<string, [number, number]> = {
    morning: [5, 11],
    afternoon: [11, 16],
    evening: [16, 22],
    night: [22, 5], // spans midnight
  };
  
  const range = timeRanges[preferredTime];
  if (!range) return false;
  
  if (preferredTime === 'night') {
    return hour >= 22 || hour < 5;
  }
  return hour >= range[0] && hour < range[1];
}

function getSubGreeting(hasActivePath: boolean, preferredStudyTime?: string | null): string {
  const hour = new Date().getHours();
  const isPeakTime = preferredStudyTime && isCurrentlyPreferredTime(hour, preferredStudyTime);
  
  if (!hasActivePath) {
    return 'Upload something to begin studying.';
  }
  
  if (isPeakTime) {
    return "Perfect timing – it's your peak study hour! 🎯";
  }
  
  return 'Continue where you left off.';
}

function ActiveDashboard() {
  const navigate = useNavigate();
  const { switchToPath, reset } = useQuizStore();
  const { paths, archivePath, deletePath, setActivePath, updatePath } = usePathsStore();
  // Subscribe directly to paths store for reactive learningPath
  const learningPath = usePathsStore(selectActivePath);
  const sessions = useSessionsStore((s) => s.sessions);
  const deleteSessionsByPathId = useSessionsStore((s) => s.deleteSessionsByPathId);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Get all active paths for the subject switcher
  const activePaths = paths.filter((p) => p.status === 'active');
  const archivedPaths = paths.filter((p) => p.status === 'archived');
  
  // Helper to get path progress
  const getPathProgress = (path: typeof learningPath) => {
    if (!path) return { completed: 0, total: 0, isComplete: false };
    const completedCount = path.topics.filter((topic) => 
      sessions.some((s) => s.topic_id === topic.id && s.path_id === path.id && s.passed)
    ).length;
    return {
      completed: completedCount,
      total: path.topics.length,
      isComplete: completedCount === path.topics.length && path.topics.length > 0
    };
  };

  // Check if ALL subjects are complete for celebration
  const allSubjectsComplete = useMemo(() => {
    if (activePaths.length === 0) return false;
    return activePaths.every(path => {
      const progress = getPathProgress(path);
      return progress.isComplete;
    });
  }, [activePaths, sessions]);

  if (!learningPath) return null;

  const handleStartNewSubject = () => {
    setShowNewSubject(true);
  };

  const handleCancelNewSubject = () => {
    setShowNewSubject(false);
  };

  const handleSwitchSubject = (pathId: string) => {
    switchToPath(pathId);
    setActivePath(pathId);
  };

  const handleArchiveSubject = (pathId: string) => {
    archivePath(pathId);
    toast.success('Subject archived');
  };

  const handleDeleteSubject = (pathId: string) => {
    // Delete associated quiz sessions first to avoid orphaned data
    deleteSessionsByPathId(pathId);
    // Clean up any pending sync items for this path
    removeFromSyncQueueByPathId(pathId);
    deletePath(pathId);
    toast.success('Subject deleted');
  };

  const handleRestoreSubject = (pathId: string) => {
    updatePath(pathId, { status: 'active' });
    setActivePath(pathId);
    toast.success('Subject restored');
  };

  const handleBatchRestore = () => {
    selectedPaths.forEach(pathId => {
      updatePath(pathId, { status: 'active' });
    });
    toast.success(`${selectedPaths.size} subject${selectedPaths.size > 1 ? 's' : ''} restored`);
    setSelectedPaths(new Set());
    setShowArchived(false);
  };

  const togglePathSelection = (pathId: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const selectAllArchived = () => {
    if (selectedPaths.size === archivedPaths.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(archivedPaths.map(p => p.id)));
    }
  };

  // If user wants to start a new subject, show upload section with back option
  if (showNewSubject) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleCancelNewSubject}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <span>←</span>
          <span>Back to subjects</span>
        </button>
        <EmptyDashboard onNewSubjectCreated={() => setShowNewSubject(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Celebration when ALL subjects are complete */}
      {allSubjectsComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-surface to-accent/10 border border-accent/30 rounded-2xl p-8 text-center"
        >
          {/* Sparkle decorations */}
          <div className="absolute top-4 left-8 text-accent/40">
            <Sparkles size={20} />
          </div>
          <div className="absolute top-8 right-12 text-accent/30">
            <Star size={16} />
          </div>
          <div className="absolute bottom-6 left-16 text-accent/20">
            <Star size={12} />
          </div>
          <div className="absolute bottom-4 right-8 text-accent/40">
            <Sparkles size={18} />
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4"
          >
            <Trophy className="w-8 h-8 text-accent" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl text-text mb-2"
          >
            🎉 Congratulations!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-text-soft max-w-sm mx-auto"
          >
            You've completed all your study plans! You're a true scholar. Ready for your next learning adventure?
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleStartNewSubject}
            className="mt-6 px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                       hover:opacity-90 transition-opacity duration-150 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Start New Subject
          </motion.button>
        </motion.div>
      )}

      {/* Header with Add and Archive filter */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-text">Your Subjects</h2>
        <div className="flex items-center gap-2">
          {archivedPaths.length > 0 && (
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                if (showArchived) setSelectedPaths(new Set());
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                showArchived 
                  ? "bg-accent/10 border-accent/30 text-accent" 
                  : "bg-surface border-border text-text-muted hover:text-text"
              )}
            >
              <Archive size={14} />
              <span>Archived ({archivedPaths.length})</span>
            </button>
          )}
          <button
            onClick={handleStartNewSubject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-accent-text
                       hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Archived Section with batch restore */}
      <AnimatePresence>
        {showArchived && archivedPaths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Batch controls */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <button
                onClick={selectAllArchived}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                {selectedPaths.size === archivedPaths.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedPaths.size > 0 && (
                <button
                  onClick={handleBatchRestore}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-accent-text
                             hover:opacity-90 transition-opacity"
                >
                  <RotateCcw size={14} />
                  <span>Restore ({selectedPaths.size})</span>
                </button>
              )}
            </div>
            
            {/* Archived list */}
            {archivedPaths.map((path) => {
              const progress = getPathProgress(path);
              const isSelected = selectedPaths.has(path.id);
              
              return (
                <motion.div
                  key={path.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-3 p-4 bg-surface/50 border rounded-xl transition-colors cursor-pointer",
                    isSelected ? "border-accent/50 bg-accent/5" : "border-border hover:border-text-muted/30"
                  )}
                  onClick={() => togglePathSelection(path.id)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    isSelected ? "bg-accent border-accent" : "border-border"
                  )}>
                    {isSelected && <Check size={12} className="text-accent-text" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-muted truncate">{path.subject}</h3>
                    <p className="text-xs text-text-muted/70">
                      {progress.completed}/{progress.total} topics completed
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreSubject(path.id);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted 
                               hover:text-text hover:border-text-muted transition-colors"
                  >
                    Restore
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Subjects List */}
      <div className="space-y-3">
        {activePaths.map((path) => {
          const progress = getPathProgress(path);
          const isActive = path.id === learningPath.id;
          const uncompleted = path.topics.find((topic) => 
            !sessions.some((s) => s.topic_id === topic.id && s.passed)
          );
          const nextTopic = uncompleted || path.topics[0];
          
          return (
            <motion.div
              key={path.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative p-5 bg-surface border rounded-xl transition-all",
                isActive 
                  ? "border-accent/40 shadow-sm ring-1 ring-accent/20" 
                  : "border-border hover:border-text-muted/30"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide 
                                bg-accent/10 text-accent rounded-full">
                  Active
                </div>
              )}
              
              {/* Completed badge */}
              {progress.isComplete && (
                <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide 
                                bg-correct/10 text-correct rounded-full flex items-center gap-1">
                  <Check size={10} />
                  Complete
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-text truncate pr-20">{path.subject}</h3>
                  <p className="text-sm text-text-soft mt-0.5">
                    {progress.isComplete 
                      ? `All ${progress.total} topics completed`
                      : `Next: ${nextTopic?.title}`
                    }
                  </p>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{progress.completed} of {progress.total} topics</span>
                      <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          progress.isComplete ? "bg-correct" : "bg-accent"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    handleSwitchSubject(path.id);
                    navigate('/learn');
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                    progress.isComplete
                      ? "bg-surface border border-border text-text hover:border-text-muted"
                      : "bg-accent text-accent-text hover:opacity-90"
                  )}
                >
                  {progress.isComplete ? 'Review' : 'Continue'}
                </button>
                
                {/* Desktop: Show buttons directly */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => handleArchiveSubject(path.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text 
                               bg-surface border border-border rounded-lg hover:border-text-muted transition-colors"
                  >
                    <Archive size={14} />
                    <span>Archive</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(path.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-incorrect/80 hover:text-incorrect 
                               bg-surface border border-border rounded-lg hover:border-incorrect/50 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Mobile: Show dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="md:hidden p-2 text-text-muted hover:text-text hover:bg-bg-2 rounded-lg transition-colors">
                    <ChevronDown size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleArchiveSubject(path.id)}>
                      <Archive size={14} className="mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteSubject(path.id)}
                      className="text-incorrect"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface EmptyDashboardProps {
  onNewSubjectCreated?: () => void;
}

function EmptyDashboard({ onNewSubjectCreated }: EmptyDashboardProps = {}) {
  const navigate = useNavigate();
  const { paths, updatePath, setActivePath } = usePathsStore();
  const archivedPaths = paths.filter((p) => p.status === 'archived');
  const sessions = useSessionsStore((s) => s.sessions);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  const [uploadState, setUploadState] = useState<{
    file: File | null;
    content: string | null;
    isUploading: boolean;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  }>({
    file: null,
    content: null,
    isUploading: false,
    progress: 0,
    status: 'uploading',
  });

  const [youtubeState, setYoutubeState] = useState<{
    isLoading: boolean;
    error: string | null;
  }>({
    isLoading: false,
    error: null,
  });

  const { setPhase, setLearningPath } = useQuizStore();

  const processContent = async (content: string, filename?: string) => {
    setUploadState((prev) => ({
      ...prev,
      content,
      status: 'processing',
    }));

    try {
      let analysisResult;

      if (hasApiKeys()) {
        // Use real API
        if (content.length > 2000) {
          analysisResult = await analyzeContent(content);
        } else {
          const quickResult = await quickAnalyze(content);
          analysisResult = {
            needsStudyPlan: false,
            subject: quickResult.subject,
            educationLevel: 'Undergraduate',
            topicType: 'mixed',
            topics: [{
              id: 1,
              title: quickResult.title,
              difficulty: quickResult.difficulty,
              estimatedQuestions: quickResult.estimatedQuestions,
              summary: quickResult.summary,
            }],
          };
        }
      } else {
        // Use mock data for demo
        analysisResult = getMockAnalysis(content);
      }

      // Create a learning path from the analysis
      // Old subjects are preserved - setLearningPath will add this as a new path
      const pathId = `path_${Date.now()}`;
      const learningPath = {
        id: pathId,
        user_id: 'local',
        subject: analysisResult.subject,
        education_level: analysisResult.educationLevel,
        topic_type: analysisResult.topicType,
        needs_study_plan: analysisResult.needsStudyPlan,
        topics: analysisResult.topics.map((t) => ({
          id: `topic_${t.id}`,
          path_id: pathId,
          title: t.title,
          difficulty: t.difficulty,
          estimated_questions: t.estimatedQuestions,
          order_index: t.id,
          is_locked: t.id > 1,
          summary: t.summary,
          source_content: content,
        })),
        source_text: content,
        source_file_name: filename,
        status: 'active' as const,
        created_at: new Date().toISOString(),
      };

      setLearningPath(learningPath);
      setUploadState((prev) => ({
        ...prev,
        status: 'complete',
        isUploading: false,
      }));

      toast.success('Content analyzed successfully!');
      onNewSubjectCreated?.();
      
      // Navigate to learn page
      setTimeout(() => {
        navigate('/learn');
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(`Analysis failed: ${errorMessage}`);
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        isUploading: false,
      }));
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadState({
      file,
      content: null,
      isUploading: true,
      progress: 0,
      status: 'uploading',
    });

    try {
      // Check if it's a text file that can be read directly
      const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown';
      
      // Simulate initial upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 50) {
          progress = 50;
          clearInterval(progressInterval);
        }
        setUploadState((prev) => ({ ...prev, progress }));
      }, 150);

      if (isTextFile) {
        // For text files, read directly
        const text = await file.text();
        clearInterval(progressInterval);
        setUploadState((prev) => ({ ...prev, progress: 100 }));
        processContent(text, file.name);
      } else if (hasApiKeys() && isMultimodalSupported(file.type)) {
        // For images, PDFs, audio - use Gemini multimodal
        clearInterval(progressInterval);
        setUploadState((prev) => ({
          ...prev,
          progress: 55,
          status: 'processing',
        }));

        // Animate progress during AI processing to show activity
        let processingProgress = 55;
        const processingInterval = setInterval(() => {
          // Slowly increment progress up to 85% while waiting for AI
          processingProgress += Math.random() * 3 + 1;
          if (processingProgress >= 85) {
            processingProgress = 85;
            clearInterval(processingInterval);
          }
          setUploadState((prev) => ({ ...prev, progress: processingProgress }));
        }, 500);

        try {
          // Use the combined analyzeFile function for efficiency
          const analysisResult = await analyzeFile(file);
          clearInterval(processingInterval);
          
          // Extract content if available, otherwise use a placeholder
          const extractedContent = (analysisResult as any).extractedContent || 
            `Content extracted from ${file.name}`;

          setUploadState((prev) => ({ ...prev, progress: 90 }));

          // Create learning path directly from the analysis
          // Old subjects are preserved - setLearningPath will add this as a new path
          const pathId = `path_${Date.now()}`;
          const learningPath = {
            id: pathId,
            user_id: 'local',
            subject: analysisResult.subject,
            education_level: analysisResult.educationLevel,
            topic_type: analysisResult.topicType,
            needs_study_plan: analysisResult.needsStudyPlan,
            topics: analysisResult.topics.map((t) => ({
              id: `topic_${t.id}`,
              path_id: pathId,
              title: t.title,
              difficulty: t.difficulty,
              estimated_questions: t.estimatedQuestions,
              order_index: t.id,
              is_locked: t.id > 1,
              summary: t.summary,
              source_content: extractedContent,
            })),
            source_text: extractedContent,
            source_file_name: file.name,
            status: 'active' as const,
            created_at: new Date().toISOString(),
          };

          setLearningPath(learningPath);
          setUploadState((prev) => ({
            ...prev,
            progress: 100,
            status: 'complete',
            isUploading: false,
          }));

          toast.success('File analyzed successfully!');
          onNewSubjectCreated?.();
          
          setTimeout(() => {
            navigate('/learn');
          }, 500);
        } catch (error) {
          clearInterval(processingInterval);
          const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
          console.error('[Dashboard] File processing error:', error);
          toast.error(`Failed to process file: ${errorMessage}`);
          setUploadState({
            file: null,
            content: null,
            isUploading: false,
            progress: 0,
            status: 'error',
            error: errorMessage,
          });
        }
      } else {
        // No API keys or unsupported type - try to read as text anyway
        clearInterval(progressInterval);
        try {
          const text = await file.text();
          setUploadState((prev) => ({ ...prev, progress: 100 }));
          processContent(text, file.name);
        } catch {
          // Binary file without API keys
          toast.error('API keys required to process images, PDFs, and audio files. Please add your Gemini API key or paste text instead.');
          setUploadState({
            file: null,
            content: null,
            isUploading: false,
            progress: 0,
            status: 'error',
            error: 'API keys required for this file type',
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read file';
      setUploadState({
        file: null,
        content: null,
        isUploading: false,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });
    }
  };

  const handlePaste = (text: string) => {
    setUploadState({
      file: null,
      content: text,
      isUploading: true,
      progress: 100,
      status: 'processing',
    });
    processContent(text, 'Pasted content');
  };

  const handleYouTubeSubmit = async (url: string) => {
    setYoutubeState({ isLoading: true, error: null });
    
    try {
      const videoInfo = await fetchTranscript(url);
      
      setYoutubeState({ isLoading: false, error: null });
      
      setUploadState({
        file: null,
        content: videoInfo.transcript,
        isUploading: true,
        progress: 100,
        status: 'processing',
      });

      if (hasApiKeys()) {
        let analysisResult;
        
        if (videoInfo.transcript.length > 2000) {
          analysisResult = await analyzeContent(videoInfo.transcript);
        } else {
          const quickResult = await quickAnalyze(videoInfo.transcript);
          analysisResult = {
            needsStudyPlan: false,
            subject: quickResult.subject,
            educationLevel: 'Undergraduate',
            topicType: 'mixed',
            topics: [{
              id: 1,
              title: quickResult.title,
              difficulty: quickResult.difficulty,
              estimatedQuestions: quickResult.estimatedQuestions,
              summary: quickResult.summary,
            }],
          };
        }

        const pathId = `path_${Date.now()}`;
        const learningPath = {
          id: pathId,
          user_id: 'local',
          title: videoInfo.title,
          subject: analysisResult.subject || videoInfo.title,
          education_level: analysisResult.educationLevel,
          topic_type: analysisResult.topicType,
          needs_study_plan: analysisResult.needsStudyPlan,
          source_type: 'youtube' as const,
          source_url: getYouTubeUrl(videoInfo.videoId),
          topics: analysisResult.topics.map((t) => ({
            id: `topic_${t.id}`,
            path_id: pathId,
            title: t.title,
            difficulty: t.difficulty,
            estimated_questions: t.estimatedQuestions,
            order_index: t.id,
            is_locked: t.id > 1,
            summary: t.summary,
            source_content: videoInfo.transcript,
          })),
          source_text: videoInfo.transcript,
          source_file_name: `YouTube: ${videoInfo.title}`,
          status: 'active' as const,
          created_at: new Date().toISOString(),
        };

        setLearningPath(learningPath);
        setUploadState((prev) => ({
          ...prev,
          status: 'complete',
          isUploading: false,
        }));

        toast.success('YouTube video analyzed successfully!');
        onNewSubjectCreated?.();
        
        setTimeout(() => {
          navigate('/learn');
        }, 500);
      } else {
        const mockResult = getMockAnalysis(videoInfo.transcript);
        
        const pathId = `path_${Date.now()}`;
        const learningPath = {
          id: pathId,
          user_id: 'local',
          title: videoInfo.title,
          subject: mockResult.subject || videoInfo.title,
          education_level: mockResult.educationLevel,
          topic_type: mockResult.topicType,
          needs_study_plan: mockResult.needsStudyPlan,
          source_type: 'youtube' as const,
          source_url: getYouTubeUrl(videoInfo.videoId),
          topics: mockResult.topics.map((t) => ({
            id: `topic_${t.id}`,
            path_id: pathId,
            title: t.title,
            difficulty: t.difficulty,
            estimated_questions: t.estimatedQuestions,
            order_index: t.id,
            is_locked: t.id > 1,
            summary: t.summary,
            source_content: videoInfo.transcript,
          })),
          source_text: videoInfo.transcript,
          source_file_name: `YouTube: ${videoInfo.title}`,
          status: 'active' as const,
          created_at: new Date().toISOString(),
        };

        setLearningPath(learningPath);
        setUploadState((prev) => ({
          ...prev,
          status: 'complete',
          isUploading: false,
        }));

        toast.success('YouTube video processed!');
        onNewSubjectCreated?.();
        
        setTimeout(() => {
          navigate('/learn');
        }, 500);
      }
    } catch (error) {
      const ytError = error as YouTubeError;
      const errorMessage = ytError.userMessage || 'Failed to fetch transcript. Please try another video.';
      
      console.error('[Dashboard] YouTube error:', error);
      setYoutubeState({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      
      setUploadState({
        file: null,
        content: null,
        isUploading: false,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });
    }
  };

  const handleCancelUpload = () => {
    setUploadState({
      file: null,
      content: null,
      isUploading: false,
      progress: 0,
      status: 'uploading',
    });
  };

  // Archive helpers
  const getPathProgress = (path: typeof archivedPaths[0]) => {
    const completedCount = path.topics.filter((topic) => 
      sessions.some((s) => s.topic_id === topic.id && s.path_id === path.id && s.passed)
    ).length;
    return {
      completed: completedCount,
      total: path.topics.length,
    };
  };

  const handleRestoreSubject = (pathId: string) => {
    updatePath(pathId, { status: 'active' });
    setActivePath(pathId);
    toast.success('Subject restored');
    setSelectedPaths(new Set());
  };

  const handleBatchRestore = () => {
    selectedPaths.forEach(pathId => {
      updatePath(pathId, { status: 'active' });
    });
    const first = selectedPaths.values().next().value;
    if (first) setActivePath(first);
    toast.success(`${selectedPaths.size} subject${selectedPaths.size > 1 ? 's' : ''} restored`);
    setSelectedPaths(new Set());
    setShowArchived(false);
  };

  const togglePathSelection = (pathId: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const selectAllArchived = () => {
    if (selectedPaths.size === archivedPaths.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(archivedPaths.map(p => p.id)));
    }
  };

  if (uploadState.isUploading || uploadState.status === 'processing' || uploadState.status === 'complete') {
    return (
      <div className="space-y-4">
        <UploadProgress
          filename={uploadState.file?.name || (uploadState.content ? 'Pasted text' : 'Unknown file')}
          progress={uploadState.progress}
          status={uploadState.status}
          onCancel={uploadState.status === 'uploading' ? handleCancelUpload : undefined}
        />
        {uploadState.status === 'processing' && (
          <p className="text-sm text-text-soft text-center">
            Analyzing your content...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Archived subjects section - show when there are archived paths */}
      {archivedPaths.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              if (showArchived) setSelectedPaths(new Set());
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-3 w-full text-left rounded-xl border transition-colors",
              showArchived 
                ? "bg-accent/10 border-accent/30 text-accent" 
                : "bg-surface border-border text-text-muted hover:text-text hover:border-text-muted"
            )}
          >
            <Archive size={18} />
            <span className="flex-1">View Archived Subjects ({archivedPaths.length})</span>
            <ChevronDown size={16} className={cn("transition-transform", showArchived && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Batch controls */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <button
                    onClick={selectAllArchived}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {selectedPaths.size === archivedPaths.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedPaths.size > 0 && (
                    <button
                      onClick={handleBatchRestore}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-accent-text
                                 hover:opacity-90 transition-opacity"
                    >
                      <RotateCcw size={14} />
                      <span>Restore ({selectedPaths.size})</span>
                    </button>
                  )}
                </div>
                
                {/* Archived list */}
                {archivedPaths.map((path) => {
                  const progress = getPathProgress(path);
                  const isSelected = selectedPaths.has(path.id);
                  
                  return (
                    <motion.div
                      key={path.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "flex items-center gap-3 p-4 bg-surface border rounded-xl transition-colors cursor-pointer",
                        isSelected ? "border-accent/50 bg-accent/5" : "border-border hover:border-text-muted/30"
                      )}
                      onClick={() => togglePathSelection(path.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected ? "bg-accent border-accent" : "border-border"
                      )}>
                        {isSelected && <Check size={12} className="text-accent-text" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text truncate">{path.subject}</h3>
                        <p className="text-xs text-text-muted">
                          {progress.completed}/{progress.total} topics completed
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreSubject(path.id);
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted 
                                   hover:text-text hover:border-text-muted transition-colors"
                      >
                        Restore
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Upload section */}
      <div className="space-y-4">
        <DropZone
          onFileSelect={handleFileSelect}
          isUploading={uploadState.isUploading}
          uploadProgress={uploadState.progress}
        />
        <YouTubeInput
          onSubmit={handleYouTubeSubmit}
          isLoading={youtubeState.isLoading}
          error={youtubeState.error}
        />
        <PasteArea onPaste={handlePaste} />
      </div>
    </div>
  );
}
