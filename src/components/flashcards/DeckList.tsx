import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, TrendingUp, Play, Trash2 } from 'lucide-react';
import type { FlashcardDeck } from '@/types/flashcard';
import { useFlashcardsStore } from '@/store/flashcards';
import { useAuthStore } from '@/store/auth';
import { syncDelete } from '@/lib/firebase/sync';
import { toast } from 'sonner';

interface DeckListProps {
  decks: FlashcardDeck[];
}

export function DeckList({ decks }: DeckListProps) {
  const navigate = useNavigate();
  const { cards, deleteDeck, deleteCard } = useFlashcardsStore();
  const userId = useAuthStore((s) => s.userId);

  const getDueCount = (deckId: string): number => {
    const deckCards = cards.filter(c => c.deckId === deckId);
    const now = new Date();
    return deckCards.filter(card => new Date(card.nextReview) <= now).length;
  };

  const handleDeckClick = (deckId: string) => {
    navigate(`/flashcards/${deckId}/practice`);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deck: FlashcardDeck) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${deck.name}"? This will remove all ${deck.stats.totalCards} cards.`)) {
      return;
    }

    try {
      // Delete all cards in the deck
      const deckCards = cards.filter(c => c.deckId === deck.id);
      for (const card of deckCards) {
        deleteCard(card.id);
        if (userId) {
          await syncDelete('flashcards', card.id, userId);
        }
      }

      // Delete the deck
      deleteDeck(deck.id);
      if (userId) {
        await syncDelete('flashcard_decks', deck.id, userId);
      }

      toast.success('Deck deleted successfully');
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast.error('Failed to delete deck');
    }
  };

  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <AnimatePresence mode="popLayout">
        {decks.map((deck, index) => {
          const dueCount = getDueCount(deck.id);
          const progressPercent = deck.stats.totalCards > 0
            ? (deck.stats.knownCards / deck.stats.totalCards) * 100
            : 0;

          // SVG ring dimensions
          const ringSize = 44;
          const strokeWidth = 3.5;
          const radius = (ringSize - strokeWidth) / 2;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

          return (
            <motion.div
              key={deck.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div
                className="w-full bg-surface border border-border/80 rounded-2xl p-5
                           hover:border-accent/40 hover:shadow-md hover:-translate-y-1 shadow-sm transition-all duration-300 group relative"
              >
                {/* Clickable area for practice */}
                <div
                  onClick={() => handleDeckClick(deck.id)}
                  className="cursor-pointer"
                >
                  {/* Header with progress ring */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent truncate max-w-[150px]">
                          {deck.subject}
                        </span>
                        {dueCount > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 flex-shrink-0">
                            {dueCount} due
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-text text-base truncate">
                        {deck.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mini progress ring */}
                      <div className="flex-shrink-0 relative">
                        <svg width={ringSize} height={ringSize} className="-rotate-90">
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--bg-2))"
                            strokeWidth={strokeWidth}
                          />
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--correct))"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-text">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteDeck(e, deck)}
                        className="p-1.5 rounded-lg bg-wrong/10 hover:bg-wrong/20 
                                   text-wrong transition-opacity flex-shrink-0"
                        title="Delete deck"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-bg-2/50">
                      <p className="text-xs text-text-muted mb-0.5">Cards</p>
                      <p className="text-sm font-semibold text-text">
                        {deck.stats.totalCards}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-correct/5">
                      <p className="text-xs text-text-muted mb-0.5">Known</p>
                      <p className="text-sm font-semibold text-correct">
                        {deck.stats.knownCards}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-bg-2/50">
                      <p className="text-xs text-text-muted mb-0.5">Score</p>
                      <p className="text-sm font-semibold text-text">
                        {deck.stats.averageScore.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Practice CTA */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border 
                                  text-accent group-hover:text-accent transition-all">
                    <Play size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    <span className="text-sm font-medium">Practice Now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
