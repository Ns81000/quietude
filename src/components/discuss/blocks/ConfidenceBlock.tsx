import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './TextBlock';

interface ConfidenceBlockProps {
  question: string;
  onAnswer: (answer: number) => void;
  answered?: boolean;
  userAnswer?: number;
}

const LABELS = ['Unsure', 'A little', 'Somewhat', 'Mostly', 'Very confident'];

export function ConfidenceBlock({ question, onAnswer, answered, userAnswer }: ConfidenceBlockProps) {
  const [selected, setSelected] = useState<number | null>(
    answered && userAnswer !== undefined ? Number(userAnswer) : null
  );

  const handleSelect = (value: number) => {
    if (answered) return;
    setSelected(value);
    onAnswer(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-4"
    >
      <p className="text-text font-medium text-base md:text-lg mb-5">{renderMarkdown(question)}</p>
      <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-sm">
        {LABELS.map((label, i) => {
          const value = i + 1;
          const isSelected = selected === value;
          const isFilled = selected !== null && value <= selected;

          return (
            <motion.button
              key={value}
              whileTap={!answered ? { scale: 0.9 } : undefined}
              onClick={() => handleSelect(value)}
              disabled={answered}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={cn(
                  'w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center',
                  'transition-all duration-300 text-sm font-semibold',
                  isSelected
                    ? 'border-accent bg-accent text-accent-text scale-110'
                    : isFilled
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border bg-surface text-text-muted',
                  !answered && !isSelected && 'group-hover:border-accent/50',
                  answered && !isFilled && 'opacity-30'
                )}
              >
                {value}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs text-center leading-tight transition-colors',
                  isSelected ? 'text-accent font-medium' : 'text-text-muted'
                )}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
