import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Layers, 
  Focus,
  Volume2,
  MessageSquare,
  Star,
  Check,
  X,
  Sparkles,
  Zap,
  Clock,
  Palette,
  Waves,
  Headphones,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
  registerNavHandler?: (handler: (direction: 'prev' | 'next') => boolean) => void;
}

type FeatureScreen = 'focus' | 'discuss' | 'flashcards';

// Flashcards animation component matching actual implementation
function FlashcardsScreen() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [progress, setProgress] = useState(70);
  const [pressedButton, setPressedButton] = useState<'correct' | 'wrong' | null>(null);

  const cards = [
    {
      id: 1,
      front: 'What is the powerhouse of the cell?',
      back: 'Mitochondria',
      explanation: 'Mitochondria generate ATP through cellular respiration, providing energy for cellular processes.',
      tag: 'Biology',
      difficulty: 'medium' as const,
      cardNumber: 7,
    },
    {
      id: 2,
      front: 'What is the process by which plants make food?',
      back: 'Photosynthesis',
      explanation: 'Plants convert light energy into chemical energy stored in glucose molecules.',
      tag: 'Biology',
      difficulty: 'easy' as const,
      cardNumber: 8,
    },
  ];

  const currentCard = cards[currentCardIndex];

  // Auto-flip and button interaction loop
  useEffect(() => {
    // Reset states for new card
    setIsFlipped(false);
    setShowButtons(false);
    setExitDirection(null);
    setPressedButton(null);

    // Step 1: Show front for 2s (faster)
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
      setShowButtons(true);
    }, 2000);

    return () => clearTimeout(flipTimer);
  }, [currentCardIndex]);

  // Step 2: Auto-click button after showing answer
  useEffect(() => {
    if (isFlipped && showButtons) {
      const buttonClickTimer = setTimeout(() => {
        // First card clicks "I Know This" (correct), second clicks "Review Again" (wrong)
        const isCorrect = currentCardIndex === 0;
        
        // Show button press animation
        setPressedButton(isCorrect ? 'correct' : 'wrong');
        
        // Wait for press animation then trigger response
        setTimeout(() => {
          handleResponse(isCorrect);
        }, 150);
      }, 2000);

      return () => clearTimeout(buttonClickTimer);
    }
  }, [isFlipped, showButtons, currentCardIndex]);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        return next > 100 ? 70 : next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleResponse = (knew: boolean) => {
    // Trigger exit animation
    setExitDirection(knew ? 'right' : 'left');
    setShowButtons(false);

    // Move to next card after animation
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % cards.length);
    }, 300);
  };

  const difficultyStars = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  return (
    <motion.div
      key="flashcards"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-gradient-to-br from-[#fafbfc] via-[#ffffff] to-[#f0f4f8]"
    >
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Content Container - Grid Layout like Focus Mode */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
        <div className="grid grid-cols-12 gap-8 w-full max-w-7xl">
          
          {/* Left Column - Feature Explanation Cards */}
          <div className="col-span-3 flex flex-col gap-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full self-start bg-indigo-50 border border-indigo-200"
            >
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-600">New Feature</span>
            </motion.div>

            {/* Feature Card 1 - Spaced Repetition */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Algorithm</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Spaced repetition system adapts to your learning pace for optimal retention
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature Card 2 - Progress Tracking */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Track Progress</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Monitor your learning journey with detailed statistics and accuracy metrics
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature Card 3 - Custom Decks */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Decks</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Create personalized flashcard decks for any subject or topic you're studying
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Column - Card Display */}
          <div className="col-span-6 flex flex-col items-center justify-center gap-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Layers className="w-8 h-8 text-indigo-600" />
                <h2 className="font-display text-5xl text-slate-900">Flashcards</h2>
              </div>
              <p className="text-lg text-slate-600">
                Master any subject with active recall
              </p>
            </motion.div>

            {/* Card Area */}
            <div className="relative w-full" style={{ perspective: '1500px', height: '400px' }}>
              {/* Background stacked cards for 3D depth */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0 rounded-[2rem] bg-white border border-slate-200 shadow-lg"
                  style={{ transform: 'translateY(20px) translateX(-10px) scale(0.95)' }}
                />
                <div
                  className="absolute inset-0 rounded-[2rem] bg-white border border-slate-200 shadow-lg"
                  style={{ transform: 'translateY(10px) translateX(-5px) scale(0.975)' }}
                />
              </div>

              {/* Active Card with Animation */}
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.95, x: exitDirection === 'left' ? 150 : exitDirection === 'right' ? -150 : 0 }}
                animate={{
                  opacity: exitDirection ? 0 : 1,
                  scale: exitDirection ? 0.95 : 1,
                  x: exitDirection === 'left' ? -150 : exitDirection === 'right' ? 150 : 0,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="absolute inset-0 will-change-transform"
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.8 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative w-full h-full"
                >
                  {/* Front of Card */}
                  <div
                    className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white border-2 border-slate-200 shadow-xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="w-full h-full p-8 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600">
                            {currentCard.cardNumber} / 10
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                            {currentCard.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: difficultyStars[currentCard.difficulty] }).map((_, i) => (
                            <Star key={i} size={14} className="text-yellow-500" fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      {/* Question */}
                      <div className="flex-1 flex items-center justify-center px-4 my-4">
                        <p className="text-2xl font-medium text-[#1a1a2e] text-center leading-relaxed">
                          {currentCard.front}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 text-center shrink-0">
                        <p className="text-sm text-slate-500">Tap to flip</p>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div
                    className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white border border-green-200 shadow-xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="w-full h-full p-8 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600">
                            {currentCard.cardNumber} / 10
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Answer
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: difficultyStars[currentCard.difficulty] }).map((_, i) => (
                            <Star key={i} size={14} className="text-yellow-500" fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="flex-1 flex flex-col justify-center px-4 my-4">
                        <p className="text-3xl font-medium text-[#1a1a2e] text-center mb-4">
                          {currentCard.back}
                        </p>

                        {/* Explanation */}
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600 leading-relaxed text-center">
                            {currentCard.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 text-center shrink-0">
                        <p className="text-sm text-slate-500">Tap to flip back</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Response Buttons Below Card */}
            <AnimatePresence mode="wait">
              {showButtons && isFlipped ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="grid grid-cols-2 gap-4 w-full max-w-xl"
                >
                  <button
                    className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl transition-all duration-150
                               border-2 text-red-500 font-bold select-none
                               ${pressedButton === 'wrong' 
                                 ? 'scale-[0.96] bg-red-500/30 border-red-500/40' 
                                 : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40'
                               }`}
                  >
                    <X size={20} strokeWidth={3} />
                    <span>Review Again</span>
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl transition-all duration-150
                               border-2 text-green-500 font-bold select-none
                               ${pressedButton === 'correct' 
                                 ? 'scale-[0.96] bg-green-500/30 border-green-500/40' 
                                 : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/40'
                               }`}
                  >
                    <Check size={20} strokeWidth={3} />
                    <span>I Know This</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-3 py-4 px-6 bg-indigo-50 border border-indigo-200 rounded-xl"
                >
                  <Zap className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">
                    Spaced Repetition Algorithm Active
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="col-span-3 flex flex-col justify-center gap-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Deck Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Biology</span>
                  <span className="font-semibold text-slate-900">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
                <div className="text-xs text-slate-500 text-center pt-1">
                  {currentCard.cardNumber} of 10 cards reviewed
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">156</div>
                  <div className="text-xs text-slate-500">Total Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">89%</div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">12d</div>
                  <div className="text-xs text-slate-500">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">47</div>
                  <div className="text-xs text-slate-500">Sessions</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

export default function Slide9NewFeatures({ registerNavHandler }: SlideProps) {
  const [activeScreen, setActiveScreen] = useState<FeatureScreen>('focus');
  const [audioLevel, setAudioLevel] = useState(0);
  const [discussProgress, setDiscussProgress] = useState(0);
  const [focusTime, setFocusTime] = useState(25 * 60); // 25 minutes in seconds

  // Handle internal navigation - returns true if handled internally, false to pass to parent
  const handleInternalNav = useCallback((direction: 'prev' | 'next'): boolean => {
    if (direction === 'next') {
      if (activeScreen === 'focus') {
        setActiveScreen('discuss');
        return true;
      }
      if (activeScreen === 'discuss') {
        setActiveScreen('flashcards');
        return true;
      }
      // At flashcards, let parent handle (go to next slide)
    }
    if (direction === 'prev') {
      if (activeScreen === 'flashcards') {
        setActiveScreen('discuss');
        return true;
      }
      if (activeScreen === 'discuss') {
        setActiveScreen('focus');
        return true;
      }
      // At focus, let parent handle (go to previous slide)
    }
    return false; // Not handled, let parent navigate
  }, [activeScreen]);

  // Register the navigation handler with parent
  useEffect(() => {
    if (registerNavHandler) {
      registerNavHandler(handleInternalNav);
    }
  }, [registerNavHandler, handleInternalNav]);

  // Simulate audio level for focus mode
  useEffect(() => {
    if (activeScreen === 'focus') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.6 + 0.2);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [activeScreen]);

  // Working timer for focus mode
  useEffect(() => {
    if (activeScreen === 'focus') {
      const interval = setInterval(() => {
        setFocusTime((prev) => {
          if (prev <= 0) return 25 * 60; // Reset to 25 minutes
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeScreen]);

  // Simulate discuss progress
  useEffect(() => {
    if (activeScreen === 'discuss') {
      const interval = setInterval(() => {
        setDiscussProgress((prev) => Math.min(prev + 1, 5));
      }, 600);
      return () => clearInterval(interval);
    }
  }, [activeScreen]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#13151a]">
      {/* Navigation Dots */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {(['focus', 'discuss', 'flashcards'] as FeatureScreen[]).map((screen) => (
          <button
            key={screen}
            onClick={() => setActiveScreen(screen)}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeScreen === screen ? 'w-12 bg-[#c9a227]' : 'w-2 bg-[#2a2d35] hover:bg-[#c9a227]/50'
            }`}
            aria-label={`Go to ${screen} screen`}
          />
        ))}
      </div>

      {/* Feature Screens */}
      <AnimatePresence mode="wait">
        {activeScreen === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Focus Mode Background - Midnight Theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#13151a] via-[#13151a] to-[#1a1d24]" />
            
            {/* Flowing Waves */}
            <div className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none opacity-80">
              <svg
                className="absolute bottom-0 w-full"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                style={{ height: '100%' }}
              >
                <motion.path
                  d="M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.15)"
                  animate={{
                    d: [
                      'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                      'M0,180 C240,140 480,240 720,200 C960,160 1200,220 1440,180 L1440,320 L0,320 Z',
                      'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.20)"
                  animate={{
                    d: [
                      'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                      'M0,235 C320,260 640,210 960,245 C1120,255 1280,225 1440,242 L1440,320 L0,320 Z',
                      'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />
                <motion.path
                  d="M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.28)"
                  animate={{
                    d: [
                      'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                      'M0,260 C180,278 420,248 720,270 C1020,282 1260,255 1440,268 L1440,320 L0,320 Z',
                      'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              </svg>
            </div>

            {/* Audio-reactive glow */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 162, 39, 0.25), rgba(201, 162, 39, 0.08), transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                scale: [1 + audioLevel * 0.3, 1.05 + audioLevel * 0.4, 1 + audioLevel * 0.3],
                opacity: [0.4 + audioLevel * 0.3, 0.6 + audioLevel * 0.2, 0.4 + audioLevel * 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Content - Grid Layout */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="grid grid-cols-12 gap-8 w-full max-w-7xl">
                
                {/* Left Column - Feature Cards */}
                <div className="col-span-4 flex flex-col gap-6">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full self-start"
                    style={{ 
                      backgroundColor: 'rgba(201, 162, 39, 0.15)',
                      border: '1px solid rgba(201, 162, 39, 0.4)',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-[#c9a227]" />
                    <span className="font-medium text-[#c9a227]">New Feature</span>
                  </motion.div>

                  {/* Feature Card 1 - Time-Aware Theming */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Palette className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Time-Aware Theming</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Automatically adapts to your local time with 5 unique themes from morning mist to midnight study mode
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 2 - Ambient Soundscapes */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Ambient Soundscapes</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Mix multiple nature sounds, white noise, and ambient audio with individual volume controls
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 3 - Pomodoro Timer */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Flexible Timer</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Customizable focus sessions with session history tracking and completion statistics
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Center Column - Timer & Visualizer */}
                <div className="col-span-4 flex flex-col items-center justify-center gap-8">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Focus className="w-8 h-8 text-[#c9a227]" />
                      <h2 className="font-display text-4xl text-[#e0d5c0]">Focus Mode</h2>
                    </div>
                    <p className="text-base text-[#9a9285]">
                      Deep work environment
                    </p>
                  </motion.div>

                  {/* Timer */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="font-display text-8xl text-[#c9a227] font-bold tracking-tight"
                  >
                    {formatTime(focusTime)}
                  </motion.div>

                  {/* Audio Visualizer */}
                  <div className="flex items-center justify-center gap-1 h-20">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const baseHeight = 4;
                      const maxHeight = 70;
                      const animatedHeight = baseHeight + (audioLevel * maxHeight * (0.5 + Math.random() * 0.5));
                      
                      return (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-[#c9a227]/60 rounded-full"
                          animate={{
                            height: [
                              animatedHeight * 0.8,
                              animatedHeight,
                              animatedHeight * 0.9,
                            ],
                          }}
                          transition={{
                            duration: 0.3 + Math.random() * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.01,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Volume Control */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-4 w-full max-w-xs"
                  >
                    <Volume2 className="w-5 h-5 text-[#9a9285]" />
                    <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden border border-[#2a2d35]">
                      <div className="h-full w-3/4 bg-[#c9a227] rounded-full" />
                    </div>
                    <span className="text-sm text-[#9a9285] w-12 text-right">75%</span>
                  </motion.div>
                </div>

                {/* Right Column - Active Sounds & Stats */}
                <div className="col-span-4 flex flex-col gap-6">
                  {/* Active Sounds Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Waves className="w-5 h-5 text-[#c9a227]" />
                      <h3 className="text-lg font-semibold text-[#e0d5c0]">Active Sounds</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Ocean Waves', icon: '🌊', volume: 80 },
                        { name: 'Campfire', icon: '🔥', volume: 60 },
                        { name: 'Light Rain', icon: '🌧️', volume: 70 },
                      ].map((sound, i) => (
                        <motion.div
                          key={sound.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-2xl">{sound.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm text-[#e0d5c0] mb-1">{sound.name}</div>
                            <div className="h-1.5 bg-[#13151a] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#c9a227]/80 rounded-full"
                                style={{ width: `${sound.volume}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-[#9a9285] w-8 text-right">{sound.volume}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Session Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-lg font-semibold text-[#e0d5c0] mb-4">Session Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">47</div>
                        <div className="text-xs text-[#9a9285]">Total Sessions</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">84%</div>
                        <div className="text-xs text-[#9a9285]">Completion</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">18h</div>
                        <div className="text-xs text-[#9a9285]">Focus Time</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">12d</div>
                        <div className="text-xs text-[#9a9285]">Streak</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Keyboard Shortcuts Hint */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#1a1d24]/40 backdrop-blur-xl border border-[#2a2d35]/50 rounded-xl p-4"
                  >
                    <div className="text-xs text-[#9a9285] space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Space</span>
                        <span className="text-[#e0d5c0]">Play/Pause</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>T</span>
                        <span className="text-[#e0d5c0]">Cycle Theme</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>F</span>
                        <span className="text-[#e0d5c0]">Fullscreen</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {activeScreen === 'discuss' && (
          <motion.div
            key="discuss"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 bg-gradient-to-br from-[#f5f3f7] via-[#faf8fb] to-[#f0ebf5]"
          >
            {/* Animated flowing particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-[#9b4d6a]/20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, Math.random() * 20 - 10, 0],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Radial gradient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full 
                            bg-gradient-radial from-[#9b4d6a]/15 via-[#9b4d6a]/5 to-transparent blur-3xl pointer-events-none" />

            {/* Content Grid */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="grid grid-cols-12 gap-8 w-full max-w-7xl">
                
                {/* Left Column - Feature Cards */}
                <div className="col-span-3 flex flex-col justify-center gap-6">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full self-start bg-[#9b4d6a]/10 border border-[#9b4d6a]/20"
                  >
                    <Sparkles className="w-5 h-5 text-[#9b4d6a]" />
                    <span className="font-medium text-[#9b4d6a]">New Feature</span>
                  </motion.div>

                  {/* Feature Card 1 - Socratic Method */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 backdrop-blur-xl border border-[#9b4d6a]/15 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#9b4d6a]/15 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-[#9b4d6a]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2d1a22] mb-2">Socratic Dialogue</h3>
                        <p className="text-sm text-[#6b4555] leading-relaxed">
                          Learn through guided questioning that adapts to your understanding level
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 2 - Active Recall */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/70 backdrop-blur-xl border border-[#9b4d6a]/15 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2d1a22] mb-2">Active Recall</h3>
                        <p className="text-sm text-[#6b4555] leading-relaxed">
                          Strengthen memory through varied interaction types and thoughtful responses
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 3 - Adaptive Learning */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/70 backdrop-blur-xl border border-[#9b4d6a]/15 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2d1a22] mb-2">Adaptive Path</h3>
                        <p className="text-sm text-[#6b4555] leading-relaxed">
                          AI adjusts questions based on your answers to optimize learning
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Center Column - Conversation Flow Display */}
                <div className="col-span-6 flex flex-col items-center justify-center gap-8">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <MessageSquare className="w-8 h-8 text-[#9b4d6a]" />
                      <h2 className="font-display text-5xl text-[#2d1a22]">Discuss</h2>
                    </div>
                    <p className="text-lg text-[#6b4555]">
                      Learn through meaningful dialogue
                    </p>
                  </motion.div>

                  {/* Conversation Thread */}
                  <div className="w-full max-w-2xl space-y-4">
                    {/* AI Message 1 */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9b4d6a] to-[#7a3d54] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl rounded-tl-sm p-5 border border-[#9b4d6a]/20 shadow-lg">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.3 }}
                            className="text-[#2d1a22] leading-relaxed"
                          >
                            {(() => {
                              const text = "Let's explore cellular respiration. Can you tell me what you already know?";
                              return (
                                <>
                                  {text.split('').map((char, i) => (
                                    <motion.span
                                      key={i}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.7 + i * 0.02, duration: 0.05 }}
                                    >
                                      {char}
                                    </motion.span>
                                  ))}
                                </>
                              );
                            })()}
                          </motion.p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#9b4d6a]/40" />
                          <span className="text-xs text-[#6b4555]">AI Guide</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* User Response 1 */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.5, duration: 0.4 }}
                      className="flex items-start gap-3 justify-end"
                    >
                      <div className="flex-1 flex flex-col items-end">
                        <div className="bg-gradient-to-br from-[#9b4d6a] to-[#7a3d54] rounded-2xl rounded-tr-sm p-5 shadow-lg max-w-md">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.7, duration: 0.3 }}
                            className="text-white leading-relaxed"
                          >
                            {(() => {
                              const text = "I think mitochondria are involved in making energy for the cell";
                              return (
                                <>
                                  {text.split('').map((char, i) => (
                                    <motion.span
                                      key={i}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 2.7 + i * 0.015, duration: 0.05 }}
                                    >
                                      {char}
                                    </motion.span>
                                  ))}
                                </>
                              );
                            })()}
                          </motion.p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 mr-2">
                          <span className="text-xs text-[#6b4555]">You</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#9b4d6a]/40" />
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-semibold text-sm">
                        You
                      </div>
                    </motion.div>

                    {/* AI Message 2 */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 4.5, duration: 0.4 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9b4d6a] to-[#7a3d54] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl rounded-tl-sm p-5 border border-[#9b4d6a]/20 shadow-lg">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 4.7, duration: 0.3 }}
                            className="text-[#2d1a22] leading-relaxed"
                          >
                            {(() => {
                              const text = "Excellent! Now, what do mitochondria need as input to produce energy?";
                              return (
                                <>
                                  {text.split('').map((char, i) => (
                                    <motion.span
                                      key={i}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 4.7 + i * 0.015, duration: 0.05 }}
                                    >
                                      {char}
                                    </motion.span>
                                  ))}
                                </>
                              );
                            })()}
                          </motion.p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#9b4d6a]/40" />
                          <span className="text-xs text-[#6b4555]">AI Guide</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Typing Indicator */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 6.0, duration: 0.4 }}
                      className="flex items-start gap-3 justify-end"
                    >
                      <div className="flex-1 flex flex-col items-end">
                        <div className="bg-gradient-to-br from-[#9b4d6a]/20 to-[#7a3d54]/20 rounded-2xl rounded-tr-sm px-6 py-4 border border-[#9b4d6a]/30">
                          <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                  ease: 'easeInOut',
                                }}
                                className="w-2 h-2 rounded-full bg-[#9b4d6a]/60"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-semibold text-sm">
                        You
                      </div>
                    </motion.div>
                  </div>

                  {/* Conversation Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 6.5, duration: 0.4 }}
                    className="flex items-center gap-6 text-sm text-[#6b4555]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#9b4d6a] animate-pulse" />
                      <span>Active conversation</span>
                    </div>
                    <div className="h-4 w-px bg-[#e8d5da]" />
                    <span>3 exchanges</span>
                    <div className="h-4 w-px bg-[#e8d5da]" />
                    <span>Building understanding</span>
                  </motion.div>
                </div>

                {/* Right Column - Stats & Journey */}
                <div className="col-span-3 flex flex-col justify-center gap-6">
                  {/* Learning Journey Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 backdrop-blur-xl border border-[#9b4d6a]/15 rounded-2xl p-6 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-[#2d1a22] mb-4">Learning Journey</h3>
                    <div className="space-y-4">
                      {[
                        { step: 'Question', icon: '❓', status: 'complete' },
                        { step: 'Response', icon: '💭', status: 'active' },
                        { step: 'Feedback', icon: '✨', status: 'pending' },
                        { step: 'Next Topic', icon: '🎯', status: 'pending' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            item.status === 'complete' ? 'bg-[#9b4d6a]/20' :
                            item.status === 'active' ? 'bg-[#9b4d6a]/30 ring-2 ring-[#9b4d6a]/40' :
                            'bg-[#e8d5da]'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              item.status === 'pending' ? 'text-[#6b4555]' : 'text-[#2d1a22]'
                            }`}>
                              {item.step}
                            </div>
                          </div>
                          {item.status === 'complete' && (
                            <Check size={16} className="text-[#9b4d6a]" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Session Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/70 backdrop-blur-xl border border-[#9b4d6a]/15 rounded-2xl p-6 shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-[#2d1a22] mb-4">Session Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#9b4d6a] mb-1">24</div>
                        <div className="text-xs text-[#6b4555]">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">156</div>
                        <div className="text-xs text-[#6b4555]">Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600 mb-1">92%</div>
                        <div className="text-xs text-[#6b4555]">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">8</div>
                        <div className="text-xs text-[#6b4555]">Topics</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {activeScreen === 'flashcards' && (
          <FlashcardsScreen />
        )}
      </AnimatePresence>
    </div>
  );
}
