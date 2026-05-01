import { motion } from 'framer-motion';
import type { Flashcard } from '@/types/flashcard';
import { Lightbulb, Star } from 'lucide-react';

interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  showHint: boolean;
  onFlip: () => void;
  cardNumber: number;
  totalCards: number;
}

export function FlashcardCard({
  card,
  isFlipped,
  showHint,
  onFlip,
  cardNumber,
  totalCards,
}: FlashcardCardProps) {
  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500',
  };

  const difficultyStars = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  return (
    <div 
      className="relative w-full h-full touch-manipulation select-none [perspective:1500px]" 
      onClick={onFlip}
    >
      {/* Main Draggable/Flip Container */}
      <motion.div
        className="relative w-full h-full cursor-pointer touch-manipulation focus:outline-none rounded-2xl shadow-lg"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        initial={false}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 rounded-[2rem] overflow-hidden bg-surface border-2 border-border shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(1px)', // Forces hardware text-crispness
          }}
        >
          <div className="w-full h-full p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-muted">
                  {cardNumber} / {totalCards}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {card.tags[0] || 'Flashcard'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: difficultyStars[card.difficulty] }).map(
                  (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={difficultyColors[card.difficulty]}
                      fill="currentColor"
                    />
                  )
                )}
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center px-2 md:px-4 my-2">
              <p className="text-xl md:text-2xl font-medium text-text text-center leading-relaxed line-clamp-6">
                {card.front}
              </p>
            </div>

            {/* Hint */}
            {card.hint && showHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 mt-auto p-3 md:p-4 bg-accent/5 border border-accent/20 rounded-xl shrink-0"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="text-accent mt-1 flex-shrink-0" />
                  <p className="text-sm text-text-soft">{card.hint}</p>
                </div>
              </motion.div>
            )}

            {/* Tap to flip indicator */}
            <div className="mt-auto pt-4 text-center shrink-0">
              <p className="text-sm text-text-muted">Tap to flip</p>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 rounded-[2rem] overflow-hidden bg-surface border border-accent/20 shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(1px)',
          }}
        >
          <div className="w-full h-full p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-muted">
                  {cardNumber} / {totalCards}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-correct/10 text-correct">
                  Answer
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: difficultyStars[card.difficulty] }).map(
                  (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={difficultyColors[card.difficulty]}
                      fill="currentColor"
                    />
                  )
                )}
              </div>
            </div>

            {/* Answer */}
            <div className="flex-1 flex flex-col justify-center px-2 md:px-4 my-2">
              <p className="text-2xl md:text-3xl font-medium text-text text-center mb-4 line-clamp-4 shrink-0">
                {card.back}
              </p>

              {/* Explanation */}
              {card.explanation && (
                <div className="mt-2 p-3 md:p-4 bg-bg-2 rounded-xl shrink-0">
                  <p className="text-sm md:text-base text-text-soft leading-relaxed line-clamp-5">
                    {card.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Related Cards */}
            {card.relatedCards && card.relatedCards.length > 0 && (
              <div className="mt-auto pt-4 border-t border-border shrink-0">
                <p className="text-xs text-text-muted mb-2">Related Topics</p>
                <div className="flex flex-wrap gap-2">
                  {card.relatedCards.slice(0, 3).map((relatedId) => (
                    <span
                      key={relatedId}
                      className="text-xs px-2 py-1 rounded-full bg-bg-2 text-text-soft"
                    >
                      Card #{relatedId.slice(-4)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tap to flip back indicator */}
            <div className="mt-auto pt-4 text-center shrink-0">
              <p className="text-sm text-text-muted">Tap to flip back</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
