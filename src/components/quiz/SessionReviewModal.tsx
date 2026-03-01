import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { QuizSession, Question } from '@/store/quiz';
import type { Answer } from '@/types/quiz';
import { useState } from 'react';

interface SessionReviewModalProps {
  session: QuizSession;
  topicTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionReviewModal({
  session,
  topicTitle,
  isOpen,
  onClose,
}: SessionReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const question = session.questions[currentIndex];
  const answer = session.answers.find((a) => a.question_id === question?.id);

  const goNext = () => {
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-bg border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-display text-lg text-text">{topicTitle}</h2>
              <p className="text-sm text-text-muted">
                Question {currentIndex + 1} of {session.questions.length} •{' '}
                {session.score}/{session.total} correct ({session.score_pct}%)
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <QuestionReview
              question={question}
              answer={answer}
              questionNumber={currentIndex + 1}
            />
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-surface">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrevious}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {session.questions.map((q, i) => {
                const a = session.answers.find((ans) => ans.question_id === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      i === currentIndex && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                      a?.correct ? 'bg-correct' : 'bg-incorrect'
                    )}
                  />
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={currentIndex === session.questions.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface QuestionReviewProps {
  question: Question;
  answer?: Answer;
  questionNumber: number;
}

function QuestionReview({ question, answer, questionNumber }: QuestionReviewProps) {
  const isCorrect = answer?.correct ?? false;

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
            isCorrect ? 'bg-correct/10 text-correct' : 'bg-incorrect/10 text-incorrect'
          )}
        >
          {isCorrect ? (
            <>
              <Check className="w-3.5 h-3.5" /> Correct
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> Incorrect
            </>
          )}
        </span>
        <span className="text-xs text-text-muted">
          {{
            mcq: 'Multiple Choice',
            true_false: 'True/False',
            fill_blank: 'Fill in Blank',
          }[question.type] || question.type}
        </span>
      </div>

      {/* Question text */}
      <p className="text-lg text-text font-medium">{question.text}</p>

      {/* Answer display based on question type */}
      {question.type === 'mcq' && (
        <MCQReview question={question} userAnswer={answer?.user_answer as number} />
      )}

      {question.type === 'true_false' && (
        <TrueFalseReview question={question} userAnswer={answer?.user_answer as 0 | 1} />
      )}

      {question.type === 'fill_blank' && (
        <FillBlankReview question={question} userAnswer={answer?.user_answer as string} />
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="flex gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <BookOpen className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-accent mb-1">Explanation</p>
            <p className="text-sm text-text-soft">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MCQReview({
  question,
  userAnswer,
}: {
  question: { options: string[]; correct: number };
  userAnswer?: number;
}) {
  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => {
        const isCorrectOption = i === question.correct;
        const isUserAnswer = i === userAnswer;
        const isWrongSelection = isUserAnswer && !isCorrectOption;

        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border-2 transition-colors',
              isCorrectOption && 'border-correct bg-correct/10',
              isWrongSelection && 'border-incorrect bg-incorrect/10',
              !isCorrectOption && !isWrongSelection && 'border-border'
            )}
          >
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                isCorrectOption && 'bg-correct text-white',
                isWrongSelection && 'bg-incorrect text-white',
                !isCorrectOption && !isWrongSelection && 'bg-bg-2 text-text-muted'
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm text-text">{opt}</span>
            {isCorrectOption && <Check className="w-4 h-4 text-correct ml-auto" />}
            {isWrongSelection && <XCircle className="w-4 h-4 text-incorrect ml-auto" />}
          </div>
        );
      })}
    </div>
  );
}

function TrueFalseReview({
  question,
  userAnswer,
}: {
  question: { correct: 0 | 1 };
  userAnswer?: 0 | 1;
}) {
  const options = ['True', 'False'];

  return (
    <div className="flex gap-3">
      {options.map((opt, i) => {
        const isCorrectOption = i === question.correct;
        const isUserAnswer = i === userAnswer;
        const isWrongSelection = isUserAnswer && !isCorrectOption;

        return (
          <div
            key={opt}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors',
              isCorrectOption && 'border-correct bg-correct/10',
              isWrongSelection && 'border-incorrect bg-incorrect/10',
              !isCorrectOption && !isWrongSelection && 'border-border'
            )}
          >
            <span className="font-medium">{opt}</span>
            {isCorrectOption && <Check className="w-4 h-4 text-correct" />}
            {isWrongSelection && <XCircle className="w-4 h-4 text-incorrect" />}
          </div>
        );
      })}
    </div>
  );
}

function FillBlankReview({
  question,
  userAnswer,
}: {
  question: { blank_answer: string };
  userAnswer?: string | number | number[] | string[] | Record<string, string>;
}) {
  // Safely convert userAnswer to string
  const userAnswerStr = typeof userAnswer === 'string' ? userAnswer : String(userAnswer ?? '');
  const isCorrect =
    userAnswerStr.toLowerCase().trim() === question.blank_answer.toLowerCase().trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Your answer:</span>
        <span
          className={cn(
            'font-medium px-3 py-1 rounded-lg',
            isCorrect ? 'bg-correct/10 text-correct' : 'bg-incorrect/10 text-incorrect'
          )}
        >
          {userAnswerStr || '(no answer)'}
        </span>
      </div>
      {!isCorrect && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Correct answer:</span>
          <span className="font-medium px-3 py-1 rounded-lg bg-correct/10 text-correct">
            {question.blank_answer}
          </span>
        </div>
      )}
    </div>
  );
}


