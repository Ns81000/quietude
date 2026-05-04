import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, ChevronRight, BookOpen, Trash2, Eye, Plus, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { usePathsStore } from '@/store/paths';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDiscussStore, type DiscussionBlock, type Discussion } from '@/store/discuss';
import { generateLessonChunk, type PastBlock } from '@/lib/gemini/socratic';
import { generateQuiz } from '@/lib/gemini';
import { useQuizStore, Question } from '@/store/quiz';
import { toast } from 'sonner';
import { MouseGlow } from '@/components/layout/MouseGlow';
import { TextBlock } from '@/components/discuss/blocks/TextBlock';
import { YesNoBlock } from '@/components/discuss/blocks/YesNoBlock';
import { ChoiceBlock } from '@/components/discuss/blocks/ChoiceBlock';
import { TextInputBlock } from '@/components/discuss/blocks/TextInputBlock';
import { ConfidenceBlock } from '@/components/discuss/blocks/ConfidenceBlock';
import { FillBlankBlock } from '@/components/discuss/blocks/FillBlankBlock';
import { TrueFalseBlock } from '@/components/discuss/blocks/TrueFalseBlock';
import { RatingBlock } from '@/components/discuss/blocks/RatingBlock';
import { SortingBlock } from '@/components/discuss/blocks/SortingBlock';
import { SummaryCard } from '@/components/discuss/SummaryCard';

interface TopicInfo {
  id: string;
  pathId: string;
  title: string;
  summary: string;
  subject: string;
  sourceContent?: string;
}

type ViewMode = 'home' | 'active' | 'review';

export default function DiscussPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paths = usePathsStore((s) => s.paths);
  const { discussions, addDiscussion, updateBlocks, updateDiscussion, deleteDiscussion } = useDiscussStore();

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [discussionId, setDiscussionId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<DiscussionBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewDiscussion, setReviewDiscussion] = useState<Discussion | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [showAllDiscussions, setShowAllDiscussions] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const { startQuiz } = useQuizStore();

  const bottomRef = useRef<HTMLDivElement>(null);
  const MAX_RECENT_DISCUSSIONS = 5;

  useEffect(() => {
    if (blocks.length > 0 && viewMode === 'active') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 300);
    }
  }, [blocks.length, viewMode]);

  useEffect(() => {
    const topicId = searchParams.get('topic');
    const pathId = searchParams.get('path');
    if (topicId && pathId && viewMode === 'home') {
      const path = paths.find((p) => p.id === pathId);
      const t = path?.topics?.find((tp) => tp.id === topicId);
      if (path && t) {
        startDiscussion({
          id: t.id, pathId: path.id, title: t.title,
          summary: t.summary || '', subject: path.subject, sourceContent: t.source_content,
        });
      }
    }
  }, [searchParams, paths]);

  const startDiscussion = useCallback(async (selected: TopicInfo) => {
    setTopic(selected);
    setError(null);
    setIsGenerating(true);
    setBlocks([]);
    setInteractionCount(0);
    setIsComplete(false);
    setViewMode('active');

    const id = `discuss-${Date.now()}`;
    setDiscussionId(id);

    addDiscussion({
      id, topicId: selected.id, pathId: selected.pathId,
      subject: selected.subject, topicTitle: selected.title,
      blocks: [], createdAt: new Date().toISOString(), completedAt: null,
    });

    try {
      const chunk = await generateLessonChunk(selected.title, selected.summary, [], 0, selected.sourceContent);
      const newBlocks = chunkToBlocks(chunk.blocks);
      setBlocks(newBlocks);
      updateBlocks(id, newBlocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start discussion');
      setViewMode('home');
      setTopic(null);
    } finally {
      setIsGenerating(false);
    }
  }, [addDiscussion, updateBlocks]);

  const chunkToBlocks = (rawBlocks: any[]): DiscussionBlock[] =>
    rawBlocks.map((b: any, i: number) => ({
      id: `block-${Date.now()}-${i}`,
      type: b.type, content: b.content, question: b.question, statement: b.statement,
      options: b.options, 
      correctAnswer: b.correctAnswer, // Store correct answer from AI
      blankSentence: b.blankSentence, blankAnswer: b.blankAnswer,
      sortItems: b.sortItems, correctOrder: b.correctOrder,
      isAnswered: false, timestamp: new Date().toISOString(),
    }));

  const handleAnswer = useCallback(async (blockId: string, answer: string | number | boolean) => {
    if (!topic || !discussionId || isGenerating) return;

    const currentBlock = blocks.find(b => b.id === blockId);
    if (!currentBlock) return;

    // Calculate correctness
    let wasCorrect: boolean | undefined;
    let confidence: 'low' | 'medium' | 'high' = 'medium';

    if (currentBlock.type === 'yes_no' || currentBlock.type === 'true_false') {
      wasCorrect = answer === currentBlock.correctAnswer;
    } else if (currentBlock.type === 'choice') {
      wasCorrect = answer === currentBlock.correctAnswer;
    } else if (currentBlock.type === 'fill_blank') {
      const userAns = String(answer).trim().toLowerCase();
      const correctAns = String(currentBlock.blankAnswer || '').trim().toLowerCase();
      wasCorrect = userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns);
    } else if (currentBlock.type === 'confidence' || currentBlock.type === 'rating') {
      const val = Number(answer);
      confidence = val <= 2 ? 'low' : val >= 4 ? 'high' : 'medium';
    } else if (currentBlock.type === 'text_input') {
      confidence = String(answer).length < 20 ? 'low' : 'high';
    } else if (currentBlock.type === 'sorting') {
      try {
        const userOrder = JSON.parse(String(answer));
        const correctOrder = currentBlock.correctOrder || [];
        wasCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
      } catch {
        wasCorrect = false;
      }
    }

    const updatedBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, userAnswer: answer, isAnswered: true } : b
    );
    setBlocks(updatedBlocks);
    updateBlocks(discussionId, updatedBlocks);

    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    // Build richer context with correctness
    const pastBlocks: PastBlock[] = updatedBlocks
      .filter((b) => b.type !== 'summary')
      .map((b) => {
        const block: PastBlock = { 
          type: b.type, 
          question: b.question || b.statement || b.content?.slice(0, 100), 
          userAnswer: b.userAnswer 
        };
        
        // Add correctness for validatable questions
        if (b.type === 'yes_no' || b.type === 'true_false' || b.type === 'choice' || b.type === 'fill_blank' || b.type === 'sorting') {
          if (b.id === blockId) {
            block.wasCorrect = wasCorrect;
          } else {
            // Recalculate for previous blocks
            if (b.type === 'yes_no' || b.type === 'true_false' || b.type === 'choice') {
              block.wasCorrect = b.userAnswer === b.correctAnswer;
            } else if (b.type === 'fill_blank') {
              const uAns = String(b.userAnswer || '').trim().toLowerCase();
              const cAns = String(b.blankAnswer || '').trim().toLowerCase();
              block.wasCorrect = uAns === cAns || uAns.includes(cAns) || cAns.includes(uAns);
            }
          }
        }
        
        // Add confidence level
        if (b.type === 'confidence' || b.type === 'rating') {
          const val = Number(b.userAnswer);
          block.confidence = val <= 2 ? 'low' : val >= 4 ? 'high' : 'medium';
        } else if (b.type === 'text_input') {
          block.confidence = String(b.userAnswer || '').length < 20 ? 'low' : 'high';
        }
        
        return block;
      });

    setIsGenerating(true);
    setError(null);

    try {
      const chunk = await generateLessonChunk(topic.title, topic.summary, pastBlocks, newCount, topic.sourceContent);
      const newBlocks = chunkToBlocks(chunk.blocks);

      if (chunk.isComplete && chunk.summary) {
        newBlocks.push({
          id: `summary-${Date.now()}`, type: 'summary', summaryData: chunk.summary,
          isAnswered: true, timestamp: new Date().toISOString(),
        });
        setIsComplete(true);
        updateDiscussion(discussionId, { completedAt: new Date().toISOString() });
      }

      const allBlocks = [...updatedBlocks, ...newBlocks];
      setBlocks(allBlocks);
      updateBlocks(discussionId, allBlocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, discussionId, blocks, interactionCount, isGenerating, updateBlocks, updateDiscussion]);

  const renderBlock = (block: DiscussionBlock, readOnly = false, discussionForQuiz?: Discussion) => {
    const answered = readOnly ? true : block.isAnswered;
    switch (block.type) {
      case 'text':
        return <TextBlock key={block.id} content={block.content || ''} />;
      case 'yes_no':
        return <YesNoBlock key={block.id} question={block.question || ''} answered={answered}
          userAnswer={block.userAnswer as boolean | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'true_false':
        return <TrueFalseBlock key={block.id} statement={block.statement || block.question || ''} answered={answered}
          userAnswer={block.userAnswer as boolean | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'choice':
        return <ChoiceBlock key={block.id} question={block.question || ''} options={block.options || []}
          answered={answered} userAnswer={block.userAnswer as number | undefined}
          onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'text_input':
        return <TextInputBlock key={block.id} question={block.question || ''} answered={answered}
          userAnswer={block.userAnswer as string | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'confidence':
        return <ConfidenceBlock key={block.id} question={block.question || ''} answered={answered}
          userAnswer={block.userAnswer as number | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'fill_blank':
        return <FillBlankBlock key={block.id} blankSentence={block.blankSentence || '___'} answered={answered}
          userAnswer={block.userAnswer as string | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'rating':
        return <RatingBlock key={block.id} question={block.question || ''} answered={answered}
          userAnswer={block.userAnswer as number | undefined} onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'sorting':
        return <SortingBlock key={block.id} question={block.question || ''} sortItems={block.sortItems || []}
          answered={answered} userAnswer={block.userAnswer as string | undefined}
          onAnswer={(v) => handleAnswer(block.id, v)} />;
      case 'summary':
        return block.summaryData ? (
          <SummaryCard 
            key={block.id} 
            strengths={block.summaryData.strengths}
            areasToExplore={block.summaryData.areasToExplore} 
            closingThought={block.summaryData.closingThought}
            onGenerateQuiz={
              discussionForQuiz 
                ? () => handleGenerateQuizFromReview(discussionForQuiz)
                : !readOnly 
                  ? handleGenerateQuiz 
                  : undefined
            }
            isGeneratingQuiz={isGeneratingQuiz}
          />
        ) : null;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const goHome = () => {
    setViewMode('home');
    setTopic(null);
    setBlocks([]);
    setDiscussionId(null);
    setInteractionCount(0);
    setIsComplete(false);
    setError(null);
    setReviewDiscussion(null);
    setIsGeneratingQuiz(false);
  };

  const handleGenerateQuizFromReview = useCallback(async (discussion: Discussion) => {
    const summaryBlock = discussion.blocks.find(b => b.type === 'summary');
    if (!summaryBlock?.summaryData) return;

    const weakAreas = summaryBlock.summaryData.areasToExplore;
    if (weakAreas.length === 0) {
      toast.error('No weak areas identified to practice');
      return;
    }

    // Find the path and topic from the discussion
    const path = paths.find(p => p.id === discussion.pathId);
    const topicFromPath = path?.topics?.find(t => t.id === discussion.topicId);

    if (!path || !topicFromPath) {
      toast.error('Could not find topic information');
      return;
    }

    setIsGeneratingQuiz(true);
    toast.loading('Generating targeted quiz...', { id: 'quiz-gen' });

    try {
      const focusPrompt = `Focus on these areas where the student needs improvement:\n${weakAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}`;
      
      const rawQuestions = await generateQuiz({
        topicTitle: discussion.topicTitle,
        topicSummary: `${topicFromPath.summary}\n\n${focusPrompt}`,
        questionCount: 8,
        types: ['mcq', 'true_false', 'fill_blank'],
        difficulty: 'intermediate',
        isDigDeeper: false,
        isRetake: false,
        sourceContent: topicFromPath.source_content?.slice(0, 10000),
      });

      const generatedQuestions = rawQuestions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
      })) as Question[];

      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: discussion.topicId,
        path_id: discussion.pathId,
        subject: discussion.subject,
        is_dig_deeper: false,
        is_retake: false,
        config: {
          count: 8,
          types: ['mcq', 'true_false', 'fill_blank'] as any,
          difficulty: 'intermediate' as any,
          timeLimit: null,
        },
        questions: generatedQuestions,
        answers: [],
        score: null,
        total: generatedQuestions.length,
        score_pct: null,
        passed: null,
        started_at: new Date().toISOString(),
        submitted_at: null,
        time_taken_secs: null,
      };

      startQuiz(session, generatedQuestions);
      toast.success('Quiz ready! Starting now...', { id: 'quiz-gen' });
      
      setTimeout(() => {
        navigate(`/learn/${discussion.pathId}/${discussion.topicId}/quiz`);
      }, 500);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error('Failed to generate quiz. Please try again.', { id: 'quiz-gen' });
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [paths, startQuiz, navigate]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!topic || !blocks.length) return;

    const summaryBlock = blocks.find(b => b.type === 'summary');
    if (!summaryBlock?.summaryData) return;

    const weakAreas = summaryBlock.summaryData.areasToExplore;
    if (weakAreas.length === 0) {
      toast.error('No weak areas identified to practice');
      return;
    }

    setIsGeneratingQuiz(true);
    toast.loading('Generating targeted quiz...', { id: 'quiz-gen' });

    try {
      const focusPrompt = `Focus on these areas where the student needs improvement:\n${weakAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}`;
      
      const rawQuestions = await generateQuiz({
        topicTitle: topic.title,
        topicSummary: `${topic.summary}\n\n${focusPrompt}`,
        questionCount: 8,
        types: ['mcq', 'true_false', 'fill_blank'],
        difficulty: 'intermediate',
        isDigDeeper: false,
        isRetake: false,
        sourceContent: topic.sourceContent?.slice(0, 10000),
      });

      const generatedQuestions = rawQuestions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
      })) as Question[];

      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: topic.id,
        path_id: topic.pathId,
        subject: topic.subject,
        is_dig_deeper: false,
        is_retake: false,
        config: {
          count: 8,
          types: ['mcq', 'true_false', 'fill_blank'] as any,
          difficulty: 'intermediate' as any,
          timeLimit: null,
        },
        questions: generatedQuestions,
        answers: [],
        score: null,
        total: generatedQuestions.length,
        score_pct: null,
        passed: null,
        started_at: new Date().toISOString(),
        submitted_at: null,
        time_taken_secs: null,
      };

      startQuiz(session, generatedQuestions);
      toast.success('Quiz ready! Starting now...', { id: 'quiz-gen' });
      
      setTimeout(() => {
        navigate(`/learn/${topic.pathId}/${topic.id}/quiz`);
      }, 500);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error('Failed to generate quiz. Please try again.', { id: 'quiz-gen' });
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [topic, blocks, startQuiz, navigate]);

  // ── REVIEW MODE (viewing a past discussion) ──
  if (viewMode === 'review' && reviewDiscussion) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg text-text relative">
        <MouseGlow />
        <div className="ambient-orbs" aria-hidden="true" />

        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-3
                           bg-surface/80 backdrop-blur-xl border-b border-border/40">
          <button onClick={goHome}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0 mx-4 flex flex-col items-center">
            <p className="text-[11px] text-text-muted tracking-wide uppercase truncate w-full text-center">{reviewDiscussion.subject}</p>
            <p className="text-sm text-text font-medium truncate w-full text-center">{reviewDiscussion.topicTitle}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
            reviewDiscussion.completedAt ? 'bg-correct/10 text-correct' : 'bg-accent/10 text-accent'
          }`}>
            {reviewDiscussion.completedAt ? 'Completed' : 'In progress'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Date badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-xs text-text-muted px-3">
                {new Date(reviewDiscussion.createdAt).toLocaleDateString(undefined, {
                  weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            {reviewDiscussion.blocks.map((block) => renderBlock(block, true, reviewDiscussion))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-8 pb-4"
            >
              <button onClick={goHome}
                className="px-6 py-3 rounded-xl bg-accent text-accent-text text-sm font-medium
                           hover:opacity-90 active:scale-[0.97] transition-all duration-200
                           flex items-center justify-center gap-2">
                <Brain size={16} /> Start new discussion
              </button>
              <button onClick={goHome}
                className="px-6 py-3 rounded-xl bg-surface border border-border/60 text-text-soft text-sm
                           hover:border-accent/30 hover:text-text transition-all duration-200
                           flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> All discussions
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ── ACTIVE DISCUSSION ──
  if (viewMode === 'active' && topic) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg text-text relative">
        <MouseGlow />
        <div className="ambient-orbs" aria-hidden="true" />

        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-3
                           bg-surface/80 backdrop-blur-xl border-b border-border/40">
          <button onClick={goHome}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0 mx-4 flex flex-col items-center">
            <p className="text-[11px] text-text-muted tracking-wide uppercase truncate w-full text-center">{topic.subject}</p>
            <p className="text-sm text-text font-medium truncate w-full text-center">{topic.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  i < interactionCount ? 'bg-accent'
                    : i === interactionCount && isGenerating ? 'bg-accent/40 animate-pulse'
                    : 'bg-border'
                }`} />
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {blocks.map((block) => renderBlock(block))}

            <AnimatePresence>
              {isGenerating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 py-6">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-accent/50" />
                    ))}
                  </div>
                  <span className="text-sm text-text-muted">Thinking...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                <p className="text-incorrect text-sm bg-incorrect/10 rounded-xl px-4 py-3">{error}</p>
              </motion.div>
            )}

            {isComplete && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-3 justify-center py-8">
                <button onClick={goHome}
                  className="px-6 py-3 rounded-xl bg-accent text-accent-text text-sm font-medium
                             hover:opacity-90 active:scale-[0.97] transition-all duration-200
                             flex items-center justify-center gap-2">
                  <Brain size={16} /> Discuss another topic
                </button>
                <button onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl bg-surface border border-border/60 text-text-soft text-sm
                             hover:border-accent/30 hover:text-text transition-all duration-200
                             flex items-center justify-center gap-2">
                  Back to Dashboard
                </button>
              </motion.div>
            )}

            <div ref={bottomRef} className="h-4" />
          </div>
        </main>
      </div>
    );
  }

  // ── HOME: Topic Select + Past Discussions ──
  const activePaths = paths.filter((p) => p.status === 'active' && p.topics && p.topics.length > 0);

  // Calculate dynamic stats for Discuss
  const completedDiscussions = discussions.filter(d => d.completedAt).length;
  const totalInteractions = discussions.reduce((acc, d) => acc + (d.blocks?.length || 0), 0);
  const activeCount = discussions.filter(d => !d.completedAt).length;

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-content mx-auto"
      >
        {/* Hero */}
        <PageHeader 
          title="Discuss"
          description="Deepen your understanding through Socratic dialogue and active recall with AI."
          icon={MessageSquare}
          stats={[
            { label: 'Completed', value: completedDiscussions, icon: CheckCircle2, color: 'text-correct' },
            { label: 'Interactions', value: totalInteractions, icon: MessageSquare, color: 'text-accent' },
            { label: 'In Progress', value: activeCount, icon: Clock, color: 'text-orange-400' },
          ]}
        />

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-incorrect/10 text-incorrect text-sm text-center">{error}</div>
        )}

        {/* 2-column on desktop, stacked on mobile (history first on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* ── LEFT: Topic Accordions ── */}
          <div className="md:col-span-2 order-2 md:order-1">
            <h2 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <Plus size={12} />
              New discussion
            </h2>

            {activePaths.length > 0 ? (
              <div className="space-y-2">
                {activePaths.map((path) => {
                  const isExpanded = expandedSubject === path.id;
                  const topicCount = path.topics!.length;

                  return (
                    <div key={path.id} className="rounded-xl bg-surface border border-border/60 overflow-hidden">
                      <button
                        onClick={() => setExpandedSubject(isExpanded ? null : path.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-2/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={14} className="text-accent" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-text">{path.subject}</p>
                            <p className="text-xs text-text-muted">{topicCount} topic{topicCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight size={16} className="text-text-muted" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-0.5 border-t border-border/40 pt-2">
                              {path.topics!.map((t) => (
                                <button key={t.id}
                                  onClick={() => startDiscussion({
                                    id: t.id, pathId: path.id, title: t.title,
                                    summary: t.summary || '', subject: path.subject, sourceContent: t.source_content,
                                  })}
                                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-soft
                                             hover:text-accent hover:bg-accent/5 transition-all duration-200
                                             flex items-center justify-between group active:scale-[0.98]">
                                  <span className="truncate">{t.title}</span>
                                  <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted bg-surface/40 rounded-2xl border border-border/40">
                <BookOpen className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Upload a subject on the Dashboard first.</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Past Discussions (shown first on mobile via order-1) ── */}
          <div className="md:col-span-3 order-1 md:order-2">
            <h2 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <Eye size={12} />
              {discussions.length > 0 ? `Recent (${discussions.length})` : 'No discussions yet'}
            </h2>

            {discussions.length > 0 ? (
              <>
                <div className="space-y-2">
                  {discussions.slice(0, showAllDiscussions ? discussions.length : MAX_RECENT_DISCUSSIONS).map((d, idx) => {
                  const totalInteractions = d.blocks.filter(b => !['text', 'summary'].includes(b.type)).length;
                  const hasSummary = d.blocks.some(b => b.type === 'summary');

                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setReviewDiscussion(d); setViewMode('review'); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setReviewDiscussion(d);
                            setViewMode('review');
                          }
                        }}
                        className="w-full text-left rounded-xl bg-surface border border-border/60
                                   hover:border-accent/30 hover:shadow-sm transition-all duration-200
                                   active:scale-[0.98] overflow-hidden flex cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        {/* Accent left strip */}
                        <div className={`w-1 flex-shrink-0 ${hasSummary ? 'bg-correct' : 'bg-accent/40'}`} />

                        <div className="flex-1 min-w-0 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">{d.topicTitle}</p>
                              <p className="text-xs text-text-muted mt-1 truncate">
                                {d.subject} · {formatDate(d.createdAt)} · {totalInteractions} interaction{totalInteractions !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                hasSummary ? 'bg-correct/10 text-correct' : 'bg-accent/10 text-accent'
                              }`}>
                                {hasSummary ? 'Done' : 'Open'}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteDiscussion(d.id); }}
                                className="p-1 text-text-muted hover:text-incorrect transition-colors
                                           rounded-md hover:bg-incorrect/10 flex-shrink-0"
                                aria-label="Delete discussion"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </div>

                {discussions.length > MAX_RECENT_DISCUSSIONS && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAllDiscussions(!showAllDiscussions)}
                    className="w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/10
                               transition-all duration-200 border border-accent/30 hover:border-accent/50"
                  >
                    {showAllDiscussions ? 'Show less' : `Show ${discussions.length - MAX_RECENT_DISCUSSIONS} more`}
                  </motion.button>
                )}
              </>
            ) : (
              <div className="text-center py-10 bg-surface/30 rounded-2xl border border-dashed border-border/60">
                <Brain className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-30" />
                <p className="text-sm text-text-muted">Start your first discussion</p>
                <p className="text-xs text-text-muted mt-1">Pick a topic from below to begin</p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </Shell>
  );
}

