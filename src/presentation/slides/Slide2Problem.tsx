import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Mic, 
  FileType,
  AlertCircle,
  Wifi,
  WifiOff,
  Bell,
  Frown,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Brain,
  Smile,
  Upload,
  BookOpen,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  registerNavHandler?: (handler: (direction: 'prev' | 'next') => boolean) => void;
}

export default function Slide2Problem({ registerNavHandler }: SlideProps) {
  const [showSolution, setShowSolution] = useState(false);

  // Handle internal navigation - returns true if handled internally, false to pass to parent
  const handleInternalNav = useCallback((direction: 'prev' | 'next'): boolean => {
    if (direction === 'next' && !showSolution) {
      // On Problem tab, pressing right goes to Solution
      setShowSolution(true);
      return true; // Handled internally
    }
    if (direction === 'prev' && showSolution) {
      // On Solution tab, pressing left goes to Problem
      setShowSolution(false);
      return true; // Handled internally
    }
    return false; // Not handled, let parent navigate
  }, [showSolution]);

  // Register the navigation handler with parent
  useEffect(() => {
    if (registerNavHandler) {
      registerNavHandler(handleInternalNav);
    }
  }, [registerNavHandler, handleInternalNav]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Toggle Header */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full p-1 bg-surface border border-border">
          <button
            onClick={() => setShowSolution(false)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              !showSolution
                ? 'bg-incorrect/20 text-incorrect'
                : 'text-text-muted hover:text-text'
            }`}
          >
            The Problem
          </button>
          <button
            onClick={() => setShowSolution(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              showSolution
                ? 'bg-correct/20 text-correct'
                : 'text-text-muted hover:text-text'
            }`}
          >
            The Solution
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showSolution ? (
          /* PROBLEM VIEW */
          <motion.div
            key="problem"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
          >
            {/* Problem Title */}
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl sm:text-5xl text-text mb-3">
                The Current Reality
              </h2>
              <p className="text-lg text-text-soft">
                Students face these challenges every day
              </p>
            </div>

            {/* Visual Problem Representation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Problem 1: Scattered Materials */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-incorrect/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-incorrect/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* Chaotic files visual */}
                  <div className="h-32 flex items-center justify-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-16 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center"
                    >
                      <FileText className="w-6 h-6 text-red-400" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: [8, -8, 8] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-12 h-16 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center"
                    >
                      <Image className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: [3, -6, 3] }}
                      transition={{ duration: 2.3, repeat: Infinity }}
                      className="w-12 h-16 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center"
                    >
                      <FileText className="w-6 h-6 text-orange-400" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: [-3, 10, -3] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="w-12 h-16 bg-purple-100 border border-purple-200 rounded-lg flex items-center justify-center"
                    >
                      <Mic className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: [5, -5, 5] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                      className="w-12 h-16 bg-green-100 border border-green-200 rounded-lg flex items-center justify-center"
                    >
                      <FileType className="w-6 h-6 text-green-400" />
                    </motion.div>
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">Scattered Materials</h3>
                  <p className="text-sm text-text-soft">
                    PDFs, notes, recordings... everywhere. No structure.
                  </p>
                </div>
              </motion.div>

              {/* Problem 2: Generic Tools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-incorrect/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-incorrect/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* Competing apps visual */}
                  <div className="h-32 flex items-center justify-center gap-3 mb-4">
                    {['Q', 'A', 'N', 'K'].map((letter, i) => (
                      <motion.div
                        key={letter}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-14 h-14 rounded-xl bg-gray-200 border-2 border-gray-300 flex items-center justify-center"
                      >
                        <span className="text-xl font-bold text-gray-500">{letter}</span>
                      </motion.div>
                    ))}
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">Generic Tools</h3>
                  <p className="text-sm text-text-soft">
                    Pre-made content that doesn't match what YOU need to learn.
                  </p>
                </div>
              </motion.div>

              {/* Problem 3: Overwhelming */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-incorrect/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-incorrect/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* Notification chaos visual */}
                  <div className="h-32 flex items-center justify-center mb-4">
                    <div className="relative">
                      <Frown className="w-20 h-20 text-incorrect/60" />
                      {/* Floating notifications */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <Bell className="w-3 h-3 text-white" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                        className="absolute -bottom-1 -left-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                      >
                        <AlertCircle className="w-3 h-3 text-white" />
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                        className="absolute top-4 -left-4"
                      >
                        <WifiOff className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">Overwhelming UX</h3>
                  <p className="text-sm text-text-soft">
                    Streaks, badges, notifications. More stress, not less.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Click to see solution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-10"
            >
              <button
                onClick={() => setShowSolution(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                           bg-accent text-white font-medium hover:opacity-90 transition-all"
              >
                See Our Solution
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* SOLUTION VIEW */
          <motion.div
            key="solution"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            {/* Solution Title */}
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl sm:text-5xl text-text mb-3">
                Quietude Makes It Simple
              </h2>
              <p className="text-lg text-text-soft">
                One calm platform for all your learning needs
              </p>
            </div>

            {/* Visual Solution Representation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solution 1: Upload Anything */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-correct/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-correct/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* Organized upload visual */}
                  <div className="h-32 flex items-center justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.4 }}
                      className="w-24 h-24 rounded-2xl bg-correct/10 border-2 border-dashed border-correct/40 
                                 flex items-center justify-center"
                    >
                      <Upload className="w-10 h-10 text-correct" />
                    </motion.div>
                  </div>
                  <div className="flex gap-2 justify-center mb-4">
                    {['PDF', 'Image', 'Audio', 'Text'].map((type) => (
                      <span key={type} className="px-2 py-1 rounded text-xs bg-correct/10 text-correct">
                        {type}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">Upload Anything</h3>
                  <p className="text-sm text-text-soft">
                    Drop YOUR materials. We organize them for you.
                  </p>
                </div>
              </motion.div>

              {/* Solution 2: AI Creates Quizzes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-correct/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-correct/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* AI quiz visual */}
                  <div className="h-32 flex items-center justify-center mb-4">
                    <Brain className="w-20 h-20 text-correct" />
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">AI Creates Quizzes</h3>
                  <p className="text-sm text-text-soft">
                    Gemini generates questions from YOUR content instantly.
                  </p>
                </div>
              </motion.div>

              {/* Solution 3: Notes When Stuck */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative p-6 rounded-2xl bg-surface border-2 border-correct/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-correct/5 rounded-full blur-2xl" />
                <div className="relative">
                  {/* Notes generation visual */}
                  <div className="h-32 flex items-center justify-center mb-4">
                    <BookOpen className="w-20 h-20 text-correct" />
                  </div>
                  <h3 className="font-display text-xl text-text mb-2">Notes When Stuck</h3>
                  <p className="text-sm text-text-soft">
                    Don't remember? AI generates study notes to help you learn and retain.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Fourth Solution Card - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Calm Design */}
              <div className="relative p-5 rounded-2xl bg-surface border-2 border-correct/30 overflow-hidden flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-correct/10 flex items-center justify-center shrink-0">
                  <Smile className="w-7 h-7 text-correct" />
                </div>
                <div>
                  <h3 className="font-medium text-text">Calm, Focused Design</h3>
                  <p className="text-sm text-text-soft">No streaks, badges, or notifications. Just peaceful learning.</p>
                </div>
              </div>
              
              {/* Offline */}
              <div className="relative p-5 rounded-2xl bg-surface border-2 border-correct/30 overflow-hidden flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <WifiOff className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-text">Works Offline</h3>
                  <p className="text-sm text-text-soft">Full PWA - study anywhere, even without internet.</p>
                </div>
              </div>
            </motion.div>

            {/* Key differentiator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-8 p-5 rounded-2xl bg-accent/5 border border-accent/20 text-center"
            >
              <p className="text-lg text-text">
                <span className="font-semibold text-accent">The key difference:</span>{' '}
                Quizzes from <span className="font-semibold">YOUR</span> materials + 
                AI-generated notes when you need help remembering.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
