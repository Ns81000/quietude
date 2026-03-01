import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface MCQOptionsProps {
  options: string[];
  selected: number | null;
  correct: number | null; // null until answered and revealed
  onSelect: (index: number) => void;
  disabled: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function MCQOptions({
  options,
  selected,
  correct,
  onSelect,
  disabled,
}: MCQOptionsProps) {
  // Keyboard shortcuts: 1-4 or A-D
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key.toUpperCase();
      let index = -1;

      // Number keys 1-4
      if (e.key >= '1' && e.key <= '4') {
        index = parseInt(e.key, 10) - 1;
      }
      // Letter keys A-D
      else if (key >= 'A' && key <= 'D') {
        index = key.charCodeAt(0) - 65; // A=0, B=1, etc.
      }

      if (index >= 0 && index < options.length) {
        onSelect(index);
      }
    },
    [disabled, options.length, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isCorrectAnswer = correct === index;
        const isRevealed = correct !== null;
        const isWrong = isRevealed && isSelected && !isCorrectAnswer;

        return (
          <motion.button
            key={index}
            onClick={() => !disabled && onSelect(index)}
            disabled={disabled}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left',
              'transition-all duration-150',
              // Default state
              !isSelected && !isRevealed && 'border-border bg-surface hover:border-text-muted',
              // Selected but not revealed
              isSelected && !isRevealed && 'border-accent bg-accent-soft',
              // Revealed: correct answer
              isRevealed && isCorrectAnswer && 'border-correct bg-correct/10',
              // Revealed: wrong selection
              isWrong && 'border-incorrect bg-incorrect/10',
              // Disabled styling
              disabled && 'cursor-default'
            )}
          >
            {/* Option label */}
            <span
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium flex-shrink-0',
                !isSelected && !isRevealed && 'bg-bg-2 text-text-soft',
                isSelected && !isRevealed && 'bg-accent text-accent-text',
                isRevealed && isCorrectAnswer && 'bg-correct text-white',
                isWrong && 'bg-incorrect text-white'
              )}
            >
              {isRevealed && isCorrectAnswer ? (
                <Check size={14} strokeWidth={2.5} />
              ) : isWrong ? (
                <X size={14} strokeWidth={2.5} />
              ) : (
                OPTION_LABELS[index]
              )}
            </span>

            {/* Option text */}
            <span
              className={cn(
                'text-base flex-1',
                !isSelected && !isRevealed && 'text-text',
                isSelected && !isRevealed && 'text-text',
                isRevealed && isCorrectAnswer && 'text-text font-medium',
                isWrong && 'text-text'
              )}
            >
              {option}
            </span>

            {/* Keyboard hint */}
            {!isRevealed && index < 4 && (
              <span className="text-xs text-text-muted opacity-50">
                {index + 1}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Keyboard shortcut hint */}
      {!disabled && correct === null && (
        <p className="text-xs text-text-muted text-center mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-text-soft">1</kbd>-
          <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-text-soft">4</kbd> to select
        </p>
      )}
    </div>
  );
}
