import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface TrueFalseOptionsProps {
  selected: 0 | 1 | null; // 0 = True, 1 = False
  correct: 0 | 1 | null; // null until revealed
  onSelect: (value: 0 | 1) => void;
  disabled: boolean;
}

const OPTIONS = [
  { value: 0 as const, label: 'True', key: 'T' },
  { value: 1 as const, label: 'False', key: 'F' },
];

export function TrueFalseOptions({
  selected,
  correct,
  onSelect,
  disabled,
}: TrueFalseOptionsProps) {
  // Keyboard shortcuts: T for True, F for False
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key.toUpperCase();
      if (key === 'T') {
        onSelect(0); // True
      } else if (key === 'F') {
        onSelect(1); // False
      }
    },
    [disabled, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isRevealed = correct !== null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          const isCorrectAnswer = correct === option.value;
          const isWrong = isRevealed && isSelected && !isCorrectAnswer;

          return (
            <motion.button
              key={option.value}
              onClick={() => !disabled && onSelect(option.value)}
              disabled={disabled}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: option.value * 0.05 }}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-4 rounded-lg border',
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
              {/* Icon for revealed state */}
              {isRevealed && isCorrectAnswer && (
                <Check size={18} className="text-correct" strokeWidth={2.5} />
              )}
              {isWrong && (
                <X size={18} className="text-incorrect" strokeWidth={2.5} />
              )}

              {/* Label */}
              <span
                className={cn(
                  'text-lg font-medium',
                  !isSelected && !isRevealed && 'text-text',
                  isSelected && !isRevealed && 'text-text',
                  isRevealed && isCorrectAnswer && 'text-correct',
                  isWrong && 'text-incorrect'
                )}
              >
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Keyboard shortcut hint */}
      {!disabled && correct === null && (
        <p className="text-xs text-text-muted text-center mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-text-soft">T</kbd> for True,{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-text-soft">F</kbd> for False
        </p>
      )}
    </div>
  );
}
