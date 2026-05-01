import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Shuffle, Check, X, Lightbulb } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { useFlashcardsStore } from '@/store/flashcards';
import { FlashcardCard } from '@/components/flashcards/FlashcardCard';
import { calculateNextReview, responseToQuality } from '@/lib/srs';
import { syncFlashcard, syncFlashcardDeck } from '@/lib/firebase/sync';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function FlashcardPracticePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { decks, cards, updateCard, updateDeck } = useFlashcardsStore();
  const userId = useAuthStore((s) => s.userId);

  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId]);
  const deckCards = useMemo(() => cards.filter((c) => c.deckId === deckId), [cards, deckId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCards, setSessionCards] = useState<typeof deckCards>([]);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Initialize session
  useEffect(() => {
    if (hasInitialized) return;

    if (!deck || deckCards.length === 0) {
      toast.error('Deck not found or empty');
      navigate('/flashcards');
      return;
    }

    // Initialize session with shuffled cards
    const shuffled = deck.settings.shuffleOnStart
      ? [...deckCards].sort(() => Math.random() - 0.5)
      : [...deckCards];
    
    setSessionCards(shuffled);
    setHasInitialized(true);
  }, [deck, deckCards, navigate, hasInitialized]);

  if (!deck || sessionCards.length === 0) {
    return null;
  }

  const currentCard = sessionCards[currentIndex];
  const progress = ((reviewedCards.size / sessionCards.length) * 100).toFixed(0);
  const isComplete = reviewedCards.size === sessionCards.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = async (knew: boolean) => {
    if (!isFlipped) {
      toast.info('Flip the card first to see the answer');
      return;
    }

    const quality = knew ? 4 : 2; // 4 = "Good", 2 = "Hard"
    const nextReview = calculateNextReview(
      currentCard.easeFactor,
      currentCard.interval,
      currentCard.repetitions,
      quality
    );

    // Update card with new SRS data
    const updatedCard = {
      ...currentCard,
      ...nextReview,
      lastReviewed: new Date().toISOString(),
      timesReviewed: currentCard.timesReviewed + 1,
      timesCorrect: knew ? currentCard.timesCorrect + 1 : currentCard.timesCorrect,
      timesWrong: knew ? currentCard.timesWrong : currentCard.timesWrong + 1,
      status: nextReview.repetitions >= 3 ? 'known' : 'learning',
      updatedAt: new Date().toISOString(),
    };

    updateCard(updatedCard.id, updatedCard);

    // Update session stats
    setReviewedCards(new Set([...reviewedCards, currentCard.id]));
    if (knew) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }

    const finalCorrectCount = knew ? correctCount + 1 : correctCount;
    const finalReviewedCount = reviewedCards.size + 1;

    // Trigger visual exit animation first
    setExitDirection(knew ? 'right' : 'left');

    setTimeout(() => {
      // Move to next card after animation smoothly completes
      if (currentIndex < sessionCards.length - 1) {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex(currentIndex + 1);
        setExitDirection(null);
      } else {
        // Session complete
        updateDeckStats(finalCorrectCount, finalReviewedCount);
      }
    }, 300); // Gives user enough time to perceive the consequence.

    // Sync to Firebase in the background (Non-blocking)
    if (userId) {
      syncFlashcard(updatedCard, userId).catch((error) => {
        console.warn('Failed to sync card:', error);
      });
    }
  };

  const updateDeckStats = async (finalCorrectCount: number, finalReviewedCount: number) => {
    if (finalReviewedCount === 0 || !deck) return;

    // Get the most up-to-date cards directly from Zustand
    const latestCards = useFlashcardsStore.getState().cards;
    
    const knownCards = latestCards.filter(
      (c) => c.deckId === deckId && c.status === 'known'
    ).length;
    const learningCards = latestCards.filter(
      (c) => c.deckId === deckId && c.status === 'learning'
    ).length;
    const newCards = latestCards.filter(
      (c) => c.deckId === deckId && c.status === 'new'
    ).length;

    const previousReviews = deck.stats.totalReviews || 0;
    const totalReviews = previousReviews + finalReviewedCount;
    
    let averageScore = 0;
    if (totalReviews > 0) {
      const previousTotalScore = (deck.stats.averageScore || 0) * previousReviews;
      const sessionTotalScore = (finalCorrectCount / finalReviewedCount) * 100 * finalReviewedCount;
      averageScore = (previousTotalScore + sessionTotalScore) / totalReviews;
    }

    const updatedDeck = {
      ...deck,
      stats: {
        ...deck.stats,
        knownCards,
        learningCards,
        newCards,
        lastPracticed: new Date().toISOString(),
        totalReviews,
        averageScore,
      },
      updatedAt: new Date().toISOString(),
    };

    updateDeck(updatedDeck.id, updatedDeck);

    // Sync Deck to Firebase
    if (userId) {
      try {
        await syncFlashcardDeck(updatedDeck, userId);
      } catch (error) {
        console.warn('Failed to sync deck:', error);
      }
    }
  };

  const handleShuffle = () => {
    setIsShuffling(true);

    // Haptic feedback (trigger native vibration if supported by device)
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 30, 20]);
    }

    setTimeout(() => {
      const shuffled = [...sessionCards].sort(() => Math.random() - 0.5);
      setSessionCards(shuffled);
      setCurrentIndex(0);
      setIsShuffling(false);
      toast.success('Deck shuffled!');
    }, 400); // match duration of the visual animation
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    // Flip state will be reset by useEffect
    setReviewedCards(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    toast.success('Session restarted!');
  };

  const handleExit = () => {
    if (reviewedCards.size > 0 && !isComplete) {
      if (confirm('Exit practice session? Your progress will be saved.')) {
        updateDeckStats(correctCount, reviewedCards.size);
        navigate('/flashcards');
      }
    } else {
      navigate('/flashcards');
    }
  };

  if (isComplete) {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 bg-correct/10 rounded-full flex items-center justify-center"
            >
              <Check size={40} className="text-correct" />
            </motion.div>

            <h1 className="text-3xl font-bold text-text mb-2">
              Session Complete!
            </h1>
            <p className="text-text-soft mb-8">
              Great work! You've reviewed all cards in this deck.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-2 rounded-xl p-4">
                <p className="text-2xl font-bold text-text mb-1">
                  {sessionCards.length}
                </p>
                <p className="text-sm text-text-muted">Cards Reviewed</p>
              </div>
              <div className="bg-correct/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-correct mb-1">
                  {correctCount}
                </p>
                <p className="text-sm text-text-muted">Correct</p>
              </div>
              <div className="bg-incorrect/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-incorrect mb-1">
                  {wrongCount}
                </p>
                <p className="text-sm text-text-muted">Review Again</p>
              </div>
            </div>

            <div className="bg-bg-2 rounded-xl p-4 mb-8">
              <p className="text-sm text-text-muted mb-2">Accuracy</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(correctCount / sessionCards.length) * 100}%`,
                    }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-correct"
                  />
                </div>
                <span className="text-lg font-semibold text-text">
                  {((correctCount / sessionCards.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw size={16} className="mr-2" />
                Practice Again
              </Button>
              <Button onClick={() => navigate('/flashcards')} className="flex-1">
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-bg overflow-hidden text-text">
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-4 md:py-6 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 text-text-soft hover:text-text transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleShuffle}
              animate={{ rotate: isShuffling ? 360 : 0 }}
              transition={{ duration: 0.4 }}
              className="p-2 hover:bg-bg-2 rounded-lg transition-colors"
              title="Shuffle deck"
            >
              <Shuffle size={20} className="text-text-soft" />
            </motion.button>
            <button
              onClick={handleRestart}
              className="p-2 hover:bg-bg-2 rounded-lg transition-colors"
              title="Restart session"
            >
              <RotateCcw size={20} className="text-text-soft" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span>{deck.name}</span>
            <span>
              {reviewedCards.size} / {sessionCards.length} cards
            </span>
          </div>
          <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-accent"
            />
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 min-h-0 relative perspective-1000 w-full mb-6">
          <motion.div
            key={currentCard.id} // Triggers re-entry for the new card automatically
            initial={{ opacity: 0, scale: 0.95, x: exitDirection === 'left' ? 150 : exitDirection === 'right' ? -150 : 0 }}
            animate={{ 
              opacity: isShuffling ? 0 : exitDirection ? 0 : 1, 
              scale: isShuffling ? 0.95 : exitDirection ? 0.95 : 1,
              x: exitDirection === 'left' ? -150 : exitDirection === 'right' ? 150 : 0,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute inset-0 will-change-transform"
          >
            <FlashcardCard
              card={currentCard}
              isFlipped={isFlipped}
              showHint={showHint}
              onFlip={handleFlip}
              cardNumber={currentIndex + 1}
              totalCards={sessionCards.length}
            />
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 shrink-0 min-h-[140px] justify-end">
          {/* Hint Button */}
          {currentCard.hint && !isFlipped && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-bg-2 hover:bg-bg-3 
                         active:scale-[0.98] active:bg-bg-2 cursor-pointer touch-manipulation
                         rounded-xl transition-all duration-150 text-text-soft font-medium select-none touch-action-manipulation"
            >
              <Lightbulb size={18} />
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            </button>
          )}

          {/* Response Buttons */}
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <button
                onClick={() => handleResponse(false)}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-red-500/10 hover:bg-red-500/20 
                           border-2 border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-150
                           active:scale-[0.96] active:bg-red-500/30 cursor-pointer touch-manipulation
                           text-red-500 font-bold select-none touch-action-manipulation"
              >
                <X size={20} strokeWidth={3} />
                <span>Review Again</span>
              </button>
              <button
                onClick={() => handleResponse(true)}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-green-500/10 hover:bg-green-500/20 
                           border-2 border-green-500/20 hover:border-green-500/40 rounded-xl transition-all duration-150
                           active:scale-[0.96] active:bg-green-500/30 cursor-pointer touch-manipulation
                           text-green-500 font-bold select-none touch-action-manipulation"
              >
                <Check size={20} strokeWidth={3} />
                <span>I Know This</span>
              </button>
            </motion.div>
          )}

          {/* Flip Button */}
          {!isFlipped && (
            <button
              onClick={handleFlip}
              className="py-4 px-6 bg-accent hover:bg-accent-hover rounded-xl transition-all duration-150
                         active:scale-[0.98] active:bg-accent/80 cursor-pointer touch-manipulation shadow-md hover:shadow-lg
                         text-white font-bold select-none touch-action-manipulation"
            >
              Tap to Reveal Answer
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 mb-2 flex items-center justify-center gap-6 text-sm shrink-0 pb-safe">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-correct" />
            <span className="text-text-muted">
              Correct: <span className="text-text font-medium">{correctCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-incorrect" />
            <span className="text-text-muted">
              Review: <span className="text-text font-medium">{wrongCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
