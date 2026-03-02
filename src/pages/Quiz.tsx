import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useQuizStore, Question } from '@/store/quiz';
import { usePathsStore, selectActivePath } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { ConfigScreen } from '@/components/quiz/ConfigScreen';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { MCQOptions } from '@/components/quiz/MCQOptions';
import { TrueFalseOptions } from '@/components/quiz/TrueFalseOptions';
import { FillBlankInput } from '@/components/quiz/FillBlankInput';
import { QuizProgressBar } from '@/components/quiz/QuizProgressBar';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { ScoreScreen } from '@/components/quiz/ScoreScreen';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Answer } from '@/types/quiz';
import { fuzzyMatch } from '@/lib/answerMatch';
import {
  generateQuiz,
  generateNotes as genNotes,
  getMockQuestions,
  getMockNotes,
  hasApiKeys,
} from '@/lib/gemini';

export default function QuizPage() {
  const navigate = useNavigate();
  const { pathId, topicId } = useParams();

  const {
    phase,
    config,
    questions,
    currentQuestionIndex,
    answers,
    currentSession,
    currentTopic,
    setPhase,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    startRetake,
    startDigDeeper,
    savePendingAnswers,
    selectTopic,
  } = useQuizStore();

  // Get learningPath directly from paths store for proper reactivity and source_text access
  const learningPath = usePathsStore(selectActivePath);

  const addSession = useSessionsStore((s) => s.addSession);
  const addNote = useNotesStore((s) => s.addNote);

  // Derive values directly instead of using selectors that return new objects
  const currentQuestion = questions[currentQuestionIndex] || null;
  const progress = useMemo(() => ({
    current: currentQuestionIndex + 1,
    total: questions.length,
    percentage: questions.length
      ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
      : 0,
  }), [currentQuestionIndex, questions.length]);
  const canSubmit = answers.length === questions.length;

  // Local state for current answer
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | number[] | string[] | Record<string, string> | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [fillBlankCorrect, setFillBlankCorrect] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isDiggingDeeper, setIsDiggingDeeper] = useState(false);

  // Get topic info from URL params or store
  const topicFromPath = useMemo(() => {
    if (topicId && learningPath) {
      return learningPath.topics.find((t) => t.id === topicId || t.id === `topic_${topicId}` || t.id.endsWith(topicId));
    }
    return null;
  }, [topicId, learningPath]);
  
  const topicTitle = topicFromPath?.title || currentTopic?.title || learningPath?.topics?.[0]?.title || 'Quiz';
  const topicSummary = topicFromPath?.summary || currentTopic?.summary || 'Test your knowledge';
  // Get source content - try path level first, then topic level as fallback
  const sourceContent = learningPath?.source_text || (topicFromPath as any)?.source_content || '';

  // Auto-select topic from URL params if not already selected
  useEffect(() => {
    if (topicFromPath && currentTopic?.id !== topicFromPath.id) {
      selectTopic({
        id: topicFromPath.id,
        path_id: pathId || learningPath?.id || '',
        user_id: 'local-user',
        title: topicFromPath.title,
        summary: topicFromPath.summary || '',
        order_index: 0,
        difficulty: (topicFromPath.difficulty as any) || 'intermediate',
        status: 'active',
        best_score: 0,
        attempts: 0,
        dig_deeper_passed: false,
        unlocked_at: null,
        passed_at: null,
      });
    }
  }, [topicFromPath, currentTopic, selectTopic, pathId, learningPath]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (phase === 'QUIZ_ACTIVE' && answers.length > 0) {
      const interval = setInterval(savePendingAnswers, 10000);
      return () => clearInterval(interval);
    }
  }, [phase, answers, savePendingAnswers]);

  // Reset local state when question changes
  useEffect(() => {
    const existingAnswer = answers.find((a) => a.question_id === currentQuestion?.id);
    if (existingAnswer) {
      setSelectedAnswer(existingAnswer.user_answer);
      setIsRevealed(true);
      if (currentQuestion?.type === 'fill_blank') {
        setFillBlankAnswer(existingAnswer.user_answer as string);
        setFillBlankCorrect(existingAnswer.correct);
      }
    } else {
      setSelectedAnswer(null);
      setIsRevealed(false);
      setFillBlankAnswer('');
      setFillBlankCorrect(null);
    }
  }, [currentQuestionIndex, currentQuestion?.id, answers, currentQuestion?.type]);

  const handleBegin = async () => {
    setIsGenerating(true);

    // Get latest config directly from store to ensure we have updated values
    const latestConfig = useQuizStore.getState().config;

    try {
      let generatedQuestions: Question[];

      if (hasApiKeys()) {
        // Use real Gemini API
        const rawQuestions = await generateQuiz({
          topicTitle,
          topicSummary,
          questionCount: latestConfig.count,
          types: latestConfig.types,
          difficulty: latestConfig.difficulty,
          isDigDeeper: false,
          isRetake: false,
          sourceContent: sourceContent?.slice(0, 15000),
        });

        generatedQuestions = rawQuestions.map((q, i) => ({
          ...q,
          id: `q${i + 1}`,
        })) as Question[];
      } else {
        // Use mock questions for demo
        generatedQuestions = getMockQuestions(latestConfig.count, latestConfig.types) as Question[];
      }

      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: topicId || currentTopic?.id || 'demo-topic',
        path_id: pathId || learningPath?.id || 'demo-path',
        subject: learningPath?.subject || 'General',
        is_dig_deeper: false,
        is_retake: false,
        config: latestConfig,
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
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error('Failed to generate quiz. Using demo questions instead.');
      // Fallback to mock questions - also use latest config
      const latestConfigFallback = useQuizStore.getState().config;
      const mockQuestions = getMockQuestions(latestConfigFallback.count, latestConfigFallback.types) as Question[];
      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: topicId || currentTopic?.id || 'demo-topic',
        path_id: pathId || learningPath?.id || 'demo-path',
        subject: learningPath?.subject || 'General',
        is_dig_deeper: false,
        is_retake: false,
        config: latestConfigFallback,
        questions: mockQuestions,
        answers: [],
        score: null,
        total: mockQuestions.length,
        score_pct: null,
        passed: null,
        started_at: new Date().toISOString(),
        submitted_at: null,
        time_taken_secs: null,
      };
      startQuiz(session, mockQuestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (answer: number | string) => {
    if (isRevealed || !currentQuestion) return;
    setSelectedAnswer(answer);
  };

  const handleConfirmAnswer = () => {
    if (!currentQuestion || selectedAnswer === null) return;

    let isCorrect = false;

    if (currentQuestion.type === 'mcq') {
      isCorrect = selectedAnswer === currentQuestion.correct;
    } else if (currentQuestion.type === 'true_false') {
      isCorrect = selectedAnswer === currentQuestion.correct;
    } else if (currentQuestion.type === 'fill_blank') {
      const userAnswer = (selectedAnswer as string).trim();
      const correctAnswer = currentQuestion.blank_answer.trim();
      // Use fuzzy matching for better UX
      isCorrect = fuzzyMatch(userAnswer, correctAnswer);
      setFillBlankCorrect(isCorrect);
    }

    const newAnswer: Answer = {
      question_id: currentQuestion.id,
      question_type: currentQuestion.type,
      user_answer: selectedAnswer,
      correct: isCorrect,
      time_taken_secs: 0,
    };

    answerQuestion(newAnswer);
    setIsRevealed(true);
  };

  const handleFillBlankSubmit = async () => {
    if (!fillBlankAnswer.trim() || !currentQuestion) return;
    
    const userAnswer = fillBlankAnswer.trim();
    const correctAnswer = (currentQuestion as any).blank_answer.trim();
    
    // Use fuzzy matching only - no API call needed
    const isCorrect = fuzzyMatch(userAnswer, correctAnswer);
    
    // Batch all state updates together
    queueMicrotask(() => {
      setSelectedAnswer(fillBlankAnswer);
      setFillBlankCorrect(isCorrect);
      
      const newAnswer: Answer = {
        question_id: currentQuestion.id,
        question_type: currentQuestion.type,
        user_answer: fillBlankAnswer,
        correct: isCorrect,
        time_taken_secs: 0,
      };

      answerQuestion(newAnswer);
      setIsRevealed(true);
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else if (canSubmit) {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    await submitQuiz();
    // After submission, save session to history
    const store = useQuizStore.getState();
    if (store.currentSession) {
      addSession(store.currentSession);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleTimerExpire = useCallback(() => {
    if (!isRevealed && currentQuestion) {
      const newAnswer: Answer = {
        question_id: currentQuestion.id,
        question_type: currentQuestion.type,
        user_answer: selectedAnswer ?? -1,
        correct: false,
        time_taken_secs: config.timeLimit || 0,
      };
      answerQuestion(newAnswer);
      setIsRevealed(true);
    }
  }, [isRevealed, currentQuestion, selectedAnswer, config.timeLimit, answerQuestion]);

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    // Don't call setNotesPhase() - it changes phase and blanks the screen
    // We handle the loading state locally with isGeneratingNotes

    // Debug logging to verify source content is being passed
    console.log('[Notes Generation] Topic:', topicTitle);
    console.log('[Notes Generation] Summary:', topicSummary);
    console.log('[Notes Generation] Source content length:', sourceContent?.length || 0);
    console.log('[Notes Generation] Has API keys:', hasApiKeys());

    try {
      let notesHtml: string;

      if (hasApiKeys()) {
        notesHtml = await genNotes({
          topicTitle,
          topicSummary,
          sourceContent: sourceContent?.slice(0, 15000),
        });
      } else {
        notesHtml = getMockNotes(topicTitle);
      }

      // Save notes to store
      addNote({
        id: `note-${Date.now()}`,
        topic_id: topicFromPath?.id || currentTopic?.id || 'demo-topic',
        topic_title: topicTitle,
        subject: learningPath?.subject || 'General',
        content_html: notesHtml,
        created_at: new Date().toISOString(),
      });

      // Navigate to notes page
      toast.success('Notes generated successfully!');
      navigate('/notes');
    } catch (error) {
      console.error('Failed to generate notes:', error);
      toast.error('Failed to generate notes. Using demo notes instead.');
      // Use mock notes as fallback
      const mockNotes = getMockNotes(topicTitle);
      addNote({
        id: `note-${Date.now()}`,
        topic_id: topicFromPath?.id || currentTopic?.id || 'demo-topic',
        topic_title: topicTitle,
        subject: learningPath?.subject || 'General',
        content_html: mockNotes,
        created_at: new Date().toISOString(),
      });
      navigate('/notes');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleDigDeeper = async () => {
    setIsDiggingDeeper(true);
    toast.info('Generating harder questions...');

    const latestConfig = useQuizStore.getState().config;

    try {
      let generatedQuestions: Question[];

      if (hasApiKeys()) {
        // Use real Gemini API with isDigDeeper flag for harder questions
        const rawQuestions = await generateQuiz({
          topicTitle,
          topicSummary,
          questionCount: latestConfig.count,
          types: latestConfig.types,
          difficulty: 'advanced',
          isDigDeeper: true,
          isRetake: false,
          sourceContent: sourceContent?.slice(0, 15000),
        });

        generatedQuestions = rawQuestions.map((q, i) => ({
          ...q,
          id: `q${i + 1}`,
        })) as Question[];
      } else {
        // Use mock questions for demo
        generatedQuestions = getMockQuestions(latestConfig.count, latestConfig.types) as Question[];
      }

      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: topicId || currentTopic?.id || 'demo-topic',
        path_id: pathId || learningPath?.id || 'demo-path',
        subject: learningPath?.subject || 'General',
        is_dig_deeper: true,
        is_retake: false,
        config: latestConfig,
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
      toast.success('Dig deeper quiz started!');
    } catch (error) {
      console.error('Failed to generate dig deeper quiz:', error);
      toast.error('Failed to generate quiz. Using demo questions instead.');
      // Fallback to mock questions
      const mockQuestions = getMockQuestions(latestConfig.count, latestConfig.types) as Question[];
      const session = {
        id: `session-${Date.now()}`,
        user_id: 'local-user',
        topic_id: topicId || currentTopic?.id || 'demo-topic',
        path_id: pathId || learningPath?.id || 'demo-path',
        subject: learningPath?.subject || 'General',
        is_dig_deeper: true,
        is_retake: false,
        config: latestConfig,
        questions: mockQuestions,
        answers: [],
        score: null,
        total: mockQuestions.length,
        score_pct: null,
        passed: null,
        started_at: new Date().toISOString(),
        submitted_at: null,
        time_taken_secs: null,
      };
      startQuiz(session, mockQuestions);
    } finally {
      setIsDiggingDeeper(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'QUIZ_ACTIVE') return;

      if (e.key === 'Enter' && isRevealed) {
        handleNext();
      } else if (
        e.key === 'Enter' &&
        selectedAnswer !== null &&
        !isRevealed &&
        currentQuestion?.type !== 'fill_blank'
      ) {
        handleConfirmAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isRevealed, selectedAnswer, currentQuestion?.type]);

  // Initialize to configuring if no phase set
  useEffect(() => {
    if (phase === 'IDLE' || phase === 'TOPIC_MAP_READY' || phase === 'TOPIC_SELECTED') {
      setPhase('CONFIGURING');
    }
  }, [phase, setPhase]);

  return (
    <Shell hideNav={phase === 'QUIZ_ACTIVE'}>
      <AnimatePresence mode="wait">
        {/* Loading / Initial State */}
        {(phase === 'IDLE' || phase === 'TOPIC_MAP_READY' || phase === 'TOPIC_SELECTED') && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-text-soft">Loading quiz...</p>
          </motion.div>
        )}

        {/* Configuration Screen */}
        {phase === 'CONFIGURING' && !isGenerating && (
          <ConfigScreen
            key="config"
            topicTitle={topicTitle}
            topicSummary={topicSummary}
            onBegin={handleBegin}
            onBack={() => navigate('/learn')}
          />
        )}

        {/* Loading state for quiz generation */}
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-text-soft">Generating your quiz...</p>
          </motion.div>
        )}

        {/* Active Quiz */}
        {phase === 'QUIZ_ACTIVE' && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-24"
          >
            {/* Back Button */}
            <button
              onClick={() => navigate(`/learn`)}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Exit Quiz</span>
            </button>

            {/* Progress and Timer */}
            <div className="mb-8 space-y-4">
              <QuizProgressBar current={progress.current} total={progress.total} />
              {config.timeLimit && (
                <QuizTimer
                  limitSecs={config.timeLimit}
                  onExpire={handleTimerExpire}
                  isPaused={isRevealed}
                  resetKey={currentQuestionIndex}
                />
              )}
            </div>

            {/* Question */}
            <QuestionCard
              questionNumber={progress.current}
              totalQuestions={progress.total}
              questionText={currentQuestion.text}
              questionType={currentQuestion.type}
              explanation={isRevealed ? currentQuestion.explanation : null}
              isAnswered={isRevealed}
              isCorrect={
                isRevealed
                  ? answers.find((a) => a.question_id === currentQuestion.id)?.correct ?? null
                  : null
              }
            >
              {/* MCQ Options */}
              {currentQuestion.type === 'mcq' && (
                <MCQOptions
                  options={currentQuestion.options}
                  selected={selectedAnswer as number | null}
                  correct={isRevealed ? currentQuestion.correct : null}
                  onSelect={handleSelectAnswer}
                  disabled={isRevealed}
                />
              )}

              {/* True/False Options */}
              {currentQuestion.type === 'true_false' && (
                <TrueFalseOptions
                  selected={selectedAnswer as 0 | 1 | null}
                  correct={isRevealed ? currentQuestion.correct : null}
                  onSelect={handleSelectAnswer}
                  disabled={isRevealed}
                />
              )}

              {/* Fill in the Blank */}
              {currentQuestion.type === 'fill_blank' && (
                <FillBlankInput
                  questionText={currentQuestion.text}
                  userAnswer={fillBlankAnswer}
                  correctAnswer={isRevealed ? currentQuestion.blank_answer : null}
                  isCorrect={fillBlankCorrect}
                  onAnswerChange={setFillBlankAnswer}
                  onSubmit={handleFillBlankSubmit}
                  disabled={isRevealed}
                  blankLength={currentQuestion.blank_answer?.length}
                />
              )}
            </QuestionCard>

            {/* Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur border-t border-border p-4">
              <div className="max-w-quiz mx-auto flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-soft
                             hover:text-text transition-colors disabled:opacity-30"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                {!isRevealed &&
                  selectedAnswer !== null &&
                  !['fill_blank'].includes(currentQuestion.type) && (
                    <button
                      onClick={handleConfirmAnswer}
                      className="px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                               hover:opacity-90 transition-opacity"
                    >
                      Confirm
                    </button>
                  )}

                {isRevealed && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-accent-text
                               text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Screens */}
        {(phase === 'QUIZ_RESULT_PASS' || phase === 'QUIZ_RESULT_FAIL') && currentSession && (
          <ScoreScreen
            key="result"
            score={currentSession.score || 0}
            total={currentSession.total}
            passed={currentSession.passed || false}
            isDigDeeper={currentSession.is_dig_deeper}
            topicTitle={topicTitle}
            onGenerateNotes={handleGenerateNotes}
            onNextTopic={() => navigate('/learn')}
            onDigDeeper={handleDigDeeper}
            onReview={() => navigate('/quizzes')}
            onRetake={startRetake}
            isLoading={isGeneratingNotes || isDiggingDeeper}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}
