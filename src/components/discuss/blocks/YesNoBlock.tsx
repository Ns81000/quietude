import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './TextBlock';

interface YesNoBlockProps {
  question: string;
  onAnswer: (answer: boolean) => void;
  answered?: boolean;
  userAnswer?: boolean;
}

export function YesNoBlock({ question, onAnswer, answered, userAnswer }: YesNoBlockProps) {
  const [selected, setSelected] = useState<boolean | null>(
    answered && userAnswer !== undefined ? userAnswer : null
  );

  const handleSelect = (value: boolean) => {
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
      <p className="text-text font-medium text-base md:text-lg mb-4">{renderMarkdown(question)}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ].map(({ label, value }) => (
          <motion.button
            key={label}
            whileTap={!answered ? { scale: 0.96 } : undefined}
            onClick={() => handleSelect(value)}
            disabled={answered}
            className={cn(
              'relative flex-1 min-h-[48px] px-6 py-3 rounded-xl text-base font-medium',
              'border-2 transition-all duration-300',
              selected === value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-surface text-text-soft hover:border-accent/40',
              answered && selected !== value && 'opacity-40',
              answered && 'cursor-default'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {selected === value && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Check size={18} className="text-accent" />
                </motion.span>
              )}
              {label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
