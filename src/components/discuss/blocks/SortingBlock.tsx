import { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortingBlockProps {
  question: string;
  sortItems: string[];
  onAnswer: (answer: string) => void;
  answered?: boolean;
  userAnswer?: string;
}

export function SortingBlock({ question, sortItems, onAnswer, answered, userAnswer }: SortingBlockProps) {
  const [items, setItems] = useState<string[]>(
    answered && userAnswer ? JSON.parse(String(userAnswer)) : [...sortItems]
  );
  const [submitted, setSubmitted] = useState(answered || false);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(JSON.stringify(items));
  }, [submitted, items, onAnswer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-4"
    >
      <p className="text-text font-medium text-base md:text-lg mb-2">{question}</p>
      <p className="text-xs text-text-muted mb-4">
        {submitted ? 'Your order:' : 'Drag to reorder, then confirm'}
      </p>

      {!submitted ? (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="space-y-2"
        >
          {items.map((item, index) => (
            <Reorder.Item
              key={item}
              value={item}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border-2 border-border',
                'cursor-grab active:cursor-grabbing active:border-accent active:shadow-md',
                'touch-none select-none transition-colors'
              )}
            >
              <GripVertical size={16} className="text-text-muted flex-shrink-0" />
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-bg-2 flex items-center justify-center text-xs font-semibold text-text-muted">
                {index + 1}
              </span>
              <span className="text-sm text-text">{item}</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/60 border border-border/60"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
                {index + 1}
              </span>
              <span className="text-sm text-text">{item}</span>
              <Check size={14} className="text-accent ml-auto" />
            </motion.div>
          ))}
        </div>
      )}

      {!submitted && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleSubmit}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text
                     text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all duration-200"
        >
          <Check size={15} />
          Confirm order
        </motion.button>
      )}
    </motion.div>
  );
}
