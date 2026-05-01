import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './TextBlock';

interface ChoiceBlockProps {
  question: string;
  options: string[];
  onAnswer: (answer: number) => void;
  answered?: boolean;
  userAnswer?: number;
}

export function ChoiceBlock({ question, options, onAnswer, answered, userAnswer }: ChoiceBlockProps) {
  const [selected, setSelected] = useState<number | null>(
    answered && userAnswer !== undefined ? userAnswer : null
  );

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    onAnswer(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-4"
    >
      <p className="text-text font-medium text-base md:text-lg mb-4">{renderMarkdown(question)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((option, i) => (
          <motion.button
            key={i}
            whileTap={!answered ? { scale: 0.97 } : undefined}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className={cn(
              'relative min-h-[48px] px-4 py-3 rounded-xl text-sm md:text-base text-left',
              'border-2 transition-all duration-300',
              selected === i
                ? 'border-accent bg-accent/10 text-accent font-medium'
                : 'border-border bg-surface text-text-soft hover:border-accent/40',
              answered && selected !== i && 'opacity-40',
              answered && 'cursor-default'
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
                  selected === i
                    ? 'bg-accent text-accent-text'
                    : 'bg-bg-2 text-text-muted'
                )}
              >
                {selected === i ? <Check size={14} /> : String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
