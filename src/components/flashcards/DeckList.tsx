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
          await syncDelete('flashcard', card.id, userId);
        }
      }

      // Delete the deck
      deleteDeck(deck.id);
      if (userId) {
        await syncDelete('flashcard_deck', deck.id, userId);
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
                className="w-full bg-surface border border-border rounded-xl p-5 
                           hover:border-accent/40 hover:shadow-sm transition-all group relative"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteDeck(e, deck)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-wrong/10 hover:bg-wrong/20 
                             text-wrong opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete deck"
                >
                  <Trash2 size={16} />
                </button>

                {/* Clickable area for practice */}
                <div
                  onClick={() => handleDeckClick(deck.id)}
                  className="cursor-pointer"
                >
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {deck.subject}
                      </span>
                      {dueCount > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                          {dueCount} due
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-text text-lg truncate">
                      {deck.name}
                    </h3>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-text-muted mb-0.5">Cards</p>
                      <p className="text-sm font-semibold text-text">
                        {deck.stats.totalCards}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-muted mb-0.5">Known</p>
                      <p className="text-sm font-semibold text-correct">
                        {deck.stats.knownCards}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-muted mb-0.5">Score</p>
                      <p className="text-sm font-semibold text-text">
                        {deck.stats.averageScore.toFixed(0)}%
                      </p>
                    </div>
                  </div>


                  {/* Last Practiced */}
                  {deck.stats.lastPracticed && (
                    <p className="text-xs text-text-muted">
                      Last practiced{' '}
                      {new Date(deck.stats.lastPracticed).toLocaleDateString()}
                    </p>
                  )}

                  {/* Practice Button - Always Visible */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border 
                                  text-accent transition-all">
                    <Play size={14} />
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
