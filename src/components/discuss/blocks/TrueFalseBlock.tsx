import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './TextBlock';

interface TrueFalseBlockProps {
  statement: string;
  onAnswer: (answer: boolean) => void;
  answered?: boolean;
  userAnswer?: boolean;
}

export function TrueFalseBlock({ statement, onAnswer, answered, userAnswer }: TrueFalseBlockProps) {
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
      <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">True or False?</p>
      <p className="text-text font-medium text-base md:text-lg mb-4 leading-relaxed bg-surface/60 border border-border/40 rounded-xl px-4 py-3">
        {renderMarkdown(statement)}
      </p>
      <div className="flex gap-3">
        {[
          { label: 'True', value: true, icon: <Check size={18} /> },
          { label: 'False', value: false, icon: <X size={18} /> },
        ].map(({ label, value, icon }) => (
          <motion.button
            key={label}
            whileTap={!answered ? { scale: 0.96 } : undefined}
            onClick={() => handleSelect(value)}
            disabled={answered}
            className={cn(
              'flex-1 min-h-[48px] px-5 py-3 rounded-xl text-base font-medium',
              'border-2 transition-all duration-300 flex items-center justify-center gap-2',
              selected === value
                ? value
                  ? 'border-correct bg-correct/10 text-correct'
                  : 'border-incorrect bg-incorrect/10 text-incorrect'
                : 'border-border bg-surface text-text-soft hover:border-accent/40',
              answered && selected !== value && 'opacity-30',
              answered && 'cursor-default'
            )}
          >
            {selected === value && icon}
            {label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
