import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FillBlankBlockProps {
  blankSentence: string;
  onAnswer: (answer: string) => void;
  answered?: boolean;
  userAnswer?: string;
}

export function FillBlankBlock({ blankSentence, onAnswer, answered, userAnswer }: FillBlankBlockProps) {
  const [value, setValue] = useState(answered && userAnswer ? String(userAnswer) : '');
  const [submitted, setSubmitted] = useState(answered || false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!answered) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [answered]);

  const handleSubmit = () => {
    if (value.trim().length < 1 || submitted) return;
    setSubmitted(true);
    onAnswer(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Split sentence at the blank marker
  const parts = blankSentence.split('___');
  const before = parts[0] || '';
  const after = parts[1] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-4"
    >
      <p className="text-xs text-text-muted uppercase tracking-wider mb-3 font-medium">Fill in the blank</p>
      <div className="flex flex-wrap items-baseline gap-1 text-base md:text-lg leading-relaxed text-text">
        <span>{before}</span>
        <span className="inline-flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitted}
            placeholder="..."
            className={cn(
              'inline-block w-32 sm:w-40 border-b-2 bg-transparent px-1 py-0.5 text-center',
              'text-base md:text-lg font-medium transition-all duration-300',
              'focus:outline-none',
              submitted
                ? 'border-accent text-accent'
                : 'border-accent/40 text-text focus:border-accent',
              submitted && 'cursor-default'
            )}
          />
          {submitted && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="ml-1"
            >
              <Check size={16} className="text-accent" />
            </motion.span>
          )}
        </span>
        <span>{after}</span>
      </div>
      {!submitted && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: value.trim().length >= 1 ? 1 : 0.3 }}
          onClick={handleSubmit}
          disabled={value.trim().length < 1}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text
                     text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed
                     hover:opacity-90 active:scale-[0.97] transition-all duration-200"
        >
          Confirm
        </motion.button>
      )}
    </motion.div>
  );
}
