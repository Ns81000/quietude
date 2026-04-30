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
      className="relative w-full min-h-[400px] h-[60vh] max-h-[500px] touch-manipulation select-none [perspective:1500px] pb-6 md:pb-0" 
      onClick={onFlip}
    >
      {/* Decorative Stack layers beneath the main card to indicate remaining cards */}
      {cardNumber < totalCards && (
        <div 
          className="absolute inset-0 bg-surface border-2 border-border/60 rounded-2xl shadow-sm -z-20 transition-all duration-300"
          style={{ transform: 'translateY(12px) scale(0.94) translateZ(-40px)' }}
        />
      )}
      {cardNumber < totalCards - 1 && (
        <div 
          className="absolute inset-0 bg-surface border-2 border-border/40 rounded-2xl shadow-sm -z-30 transition-all duration-300"
          style={{ transform: 'translateY(24px) scale(0.88) translateZ(-80px)' }}
        />
      )}

      {/* Main Draggable/Flip Container */}
      <motion.div
        className="relative w-full h-full cursor-pointer touch-manipulation focus:outline-none rounded-2xl"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          boxShadow: isFlipped ? "0 20px 40px -10px rgba(0,0,0,0.2)" : "0 10px 30px -10px rgba(0,0,0,0.1)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            transform: 'translateZ(1px)', // Forces hardware text-crispness
          }}
        >
          <div className="w-full h-full bg-surface border-2 border-border p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
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
            <div className="flex-1 flex items-center justify-center px-4">
              <p className="text-2xl md:text-3xl font-medium text-text text-center leading-relaxed">
                {card.front}
              </p>
            </div>

            {/* Hint */}
            {card.hint && showHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="text-accent mt-1 flex-shrink-0" />
                  <p className="text-sm text-text-soft">{card.hint}</p>
                </div>
              </motion.div>
            )}

            {/* Tap to flip indicator */}
            <div className="mt-auto pt-6 text-center">
              <p className="text-sm text-text-muted">Tap to flip</p>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            transform: 'rotateY(180deg) translateZ(1px)',
          }}
        >
          <div className="w-full h-full bg-surface border-2 border-accent/40 p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
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
            <div className="flex-1 flex flex-col justify-center px-4">
              <p className="text-3xl md:text-4xl font-bold text-correct text-center mb-6">
                {card.back}
              </p>

              {/* Explanation */}
              {card.explanation && (
                <div className="mt-4 p-4 bg-bg-2 rounded-xl">
                  <p className="text-sm text-text-soft leading-relaxed">
                    {card.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Related Cards */}
            {card.relatedCards && card.relatedCards.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
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
            <div className="mt-auto pt-6 text-center">
              <p className="text-sm text-text-muted">Tap to flip back</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
