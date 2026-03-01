import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  questionType: string;
  children: ReactNode;
  explanation?: string | null;
  isAnswered: boolean;
  isCorrect?: boolean | null;
  className?: string;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  questionType,
  children,
  explanation,
  isAnswered,
  isCorrect,
  className,
}: QuestionCardProps) {
  const typeLabel = {
    mcq: 'Multiple Choice',
    true_false: 'True or False',
    fill_blank: 'Fill in the Blank',
    match: 'Match the Following',
    order: 'Arrange in Order',
  }[questionType] || questionType;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn('max-w-quiz mx-auto', className)}
    >
      {/* Question header */}
      <div className="flex items-center justify-between mb-2 text-xs text-text-muted">
        <span className="uppercase tracking-wide">{typeLabel}</span>
        <span className="tabular-nums">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* Question text - hidden for fill_blank since it's shown inline with the input */}
      {questionType !== 'fill_blank' && (
        <h2 className="font-display text-xl text-text leading-relaxed mb-8">
          {questionText}
        </h2>
      )}

      {/* Answer options (passed as children) */}
      <div className="space-y-3">{children}</div>

      {/* Explanation (shown after answering) */}
      {isAnswered && explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn(
            'mt-6 p-4 rounded-lg border-l-2',
            isCorrect === true
              ? 'bg-correct/5 border-correct'
              : isCorrect === false
              ? 'bg-incorrect/5 border-incorrect'
              : 'bg-bg-2 border-accent'
          )}
        >
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Explanation
          </p>
          <p className="text-sm text-text leading-relaxed">{explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
