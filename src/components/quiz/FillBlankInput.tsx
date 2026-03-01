import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface FillBlankInputProps {
  questionText: string; // Contains _____ for the blank
  userAnswer: string;
  correctAnswer: string | null; // null until revealed
  isCorrect: boolean | null;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  blankLength?: number; // Optional hint for answer length
}

export function FillBlankInput({
  questionText,
  userAnswer,
  correctAnswer,
  isCorrect,
  onAnswerChange,
  onSubmit,
  disabled,
  blankLength,
}: FillBlankInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isRevealed = correctAnswer !== null;

  // Split question text around the blank (3 or more underscores)
  const parts = questionText.split(/_{3,}/);
  const beforeBlank = parts[0] || '';
  const afterBlank = parts[1] || '';
  
  // Calculate answer length - use blankLength prop first, then try to infer from question text
  const originalBlankMatch = questionText.match(/_{3,}/);
  const originalBlankLength = originalBlankMatch ? originalBlankMatch[0].length : 0;
  const answerLen = blankLength || (originalBlankLength >= 3 ? originalBlankLength : 8);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && userAnswer.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Question with inline blank */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="font-display text-xl text-text leading-relaxed"
      >
        {beforeBlank}
        <span
          className={cn(
            'inline-flex items-center mx-1 px-2 py-0.5 rounded border-b-2',
            !isRevealed && isFocused && 'border-accent',
            !isRevealed && !isFocused && 'border-text-muted',
            isRevealed && isCorrect && 'border-correct bg-correct/10',
            isRevealed && !isCorrect && 'border-incorrect bg-incorrect/10'
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder="Type your answer"
            style={{ minWidth: `${Math.max(100, answerLen * 10)}px` }}
            className={cn(
              'bg-transparent outline-none text-center',
              'placeholder:text-text-muted',
              isRevealed && isCorrect && 'text-correct font-medium',
              isRevealed && !isCorrect && 'text-incorrect'
            )}
          />
          {isRevealed && (
            isCorrect ? (
              <Check size={16} className="text-correct ml-1" strokeWidth={2.5} />
            ) : (
              <X size={16} className="text-incorrect ml-1" strokeWidth={2.5} />
            )
          )}
        </span>
        {afterBlank}
      </motion.div>

      {/* Letter count hint */}
      {!isRevealed && blankLength && (
        <p className="text-xs text-text-muted text-center">
          {blankLength} letter{blankLength !== 1 ? 's' : ''}
        </p>
      )}

      {/* Correct answer reveal (if wrong) */}
      {isRevealed && !isCorrect && correctAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="text-sm text-text-soft"
        >
          Correct answer:{' '}
          <span className="text-correct font-medium">{correctAnswer}</span>
        </motion.div>
      )}

      {/* Submit button (before reveal) */}
      {!isRevealed && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onSubmit}
            disabled={disabled || !userAnswer.trim()}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              userAnswer.trim()
                ? 'bg-accent text-accent-text hover:opacity-90'
                : 'bg-bg-2 text-text-muted cursor-not-allowed'
            )}
          >
            Check Answer
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      {!disabled && !isRevealed && userAnswer.trim() && (
        <p className="text-xs text-text-muted text-center">
          Press <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-text-soft">Enter</kbd> to submit
        </p>
      )}
    </div>
  );
}
