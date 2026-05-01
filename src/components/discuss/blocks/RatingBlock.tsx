import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './TextBlock';

interface RatingBlockProps {
  question: string;
  onAnswer: (answer: number) => void;
  answered?: boolean;
  userAnswer?: number;
}

export function RatingBlock({ question, onAnswer, answered, userAnswer }: RatingBlockProps) {
  const [hovered, setHovered] = useState<number | null>(null);
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
      <p className="text-text font-medium text-base md:text-lg mb-4">{renderMarkdown(question)}</p>
      <div className="flex items-center gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = (hovered !== null ? value <= hovered : selected !== null && value <= selected);

          return (
            <motion.button
              key={value}
              whileTap={!answered ? { scale: 0.85 } : undefined}
              whileHover={!answered ? { scale: 1.15 } : undefined}
              onHoverStart={() => !answered && setHovered(value)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => handleSelect(value)}
              disabled={answered}
              className={cn(
                'transition-all duration-200',
                answered && 'cursor-default',
                !answered && 'cursor-pointer'
              )}
            >
              <Star
                size={32}
                className={cn(
                  'transition-colors duration-200',
                  isFilled
                    ? 'fill-accent text-accent'
                    : 'fill-transparent text-border'
                )}
              />
            </motion.button>
          );
        })}
        {selected && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-text-muted ml-2"
          >
            {selected === 1 && 'Not at all'}
            {selected === 2 && 'A little'}
            {selected === 3 && 'Somewhat'}
            {selected === 4 && 'Pretty well'}
            {selected === 5 && 'Very well'}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
