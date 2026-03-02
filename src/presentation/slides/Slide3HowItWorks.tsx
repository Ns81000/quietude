import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Brain, 
  HelpCircle, 
  FileText, 
  Unlock,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Youtube,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

const steps = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Drop your study materials',
    detail: 'PDF, Images, Audio, or Text',
    color: '#4a6fa5',
  },
  {
    icon: Youtube,
    title: 'YouTube',
    description: 'Paste any video link',
    detail: 'Auto-extracts transcript',
    color: '#ff0000',
  },
  {
    icon: Brain,
    title: 'AI Analyzes',
    description: 'Gemini extracts key topics',
    detail: 'Creates your study roadmap',
    color: '#7b4b94',
  },
  {
    icon: HelpCircle,
    title: 'Take Quiz',
    description: 'Answer AI-generated questions',
    detail: 'MCQ, True/False, Fill-Blank',
    color: '#c2703a',
  },
  {
    icon: FileText,
    title: 'Get Notes',
    description: 'Struggling? Get AI notes',
    detail: 'Tailored to your learning style',
    color: '#b8860b',
  },
  {
    icon: Unlock,
    title: 'Unlock Next',
    description: 'Score 75%+ to progress',
    detail: 'Mastery-based learning',
    color: '#22c55e',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'See your growth',
    detail: 'Stats, streaks, insights',
    color: '#9b4d6a',
  },
];

export default function Slide3HowItWorks({}: SlideProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle manual step click - pause for 40 seconds then resume
  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsPaused(true);
    
    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    // Resume after 25 seconds
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 25000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Auto-advance through steps
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1800);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-sm font-medium text-accent uppercase tracking-wider">
          User Journey
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-text mt-2">
          How It Works
        </h2>
      </motion.div>

      {/* Core Philosophy - The Mastery Loop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-10 p-5 rounded-2xl bg-accent/5 border border-accent/20 text-center"
      >
        <p className="text-sm font-semibold text-accent mb-2">The Mastery Loop</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="px-4 py-2 rounded-xl bg-accent/10 text-accent font-semibold">Test</span>
          <ArrowRight className="w-4 h-4 text-accent hidden sm:block" />
          <span className="px-4 py-2 rounded-xl bg-correct/10 text-correct font-semibold">Learn</span>
          <ArrowRight className="w-4 h-4 text-accent hidden sm:block" />
          <span className="px-4 py-2 rounded-xl bg-accent/10 text-accent font-semibold">Test</span>
          <ArrowRight className="w-4 h-4 text-accent hidden sm:block" />
          <span className="px-4 py-2 rounded-xl bg-correct/10 text-correct font-semibold">Grow</span>
        </div>
        <p className="text-sm text-text-soft mt-3">Fail fast. Learn faster. Every gap is a step closer to mastery.</p>
      </motion.div>

      {/* Flow Diagram */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-16 left-8 right-8 h-0.5 bg-border hidden lg:block" />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            const isPast = i < activeStep;
            
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleStepClick(i)}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon Circle */}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    boxShadow: isActive ? `0 0 20px ${step.color}40` : 'none',
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 
                              transition-colors duration-200 border-2 ${
                    isActive
                      ? 'text-white'
                      : isPast
                        ? 'bg-correct/10 border-correct/30 text-correct'
                        : 'bg-surface border-border text-text-muted'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? step.color : undefined,
                    borderColor: isActive ? step.color : undefined,
                  }}
                >
                  {isPast && !isActive ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.div>

                {/* Step Number */}
                <div 
                  className={`text-xs font-bold mb-1 ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  Step {i + 1}
                </div>

                {/* Title */}
                <h3 className={`font-medium text-sm mb-1 ${
                  isActive ? 'text-text' : 'text-text-soft'
                }`}>
                  {step.title}
                </h3>

                {/* Description - only show on active */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, y: 5 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -5 }}
                      transition={{ 
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="text-xs text-text-muted"
                    >
                      {step.description}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Arrow connector (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="absolute top-6 -right-2 hidden lg:block">
                    <ArrowRight className={`w-4 h-4 ${
                      i < activeStep ? 'text-correct' : 'text-border'
                    }`} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Step Detail Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ 
            duration: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="mt-10 p-6 rounded-2xl bg-surface border border-border"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: steps[activeStep].color }}
            >
              {(() => {
                const Icon = steps[activeStep].icon;
                return <Icon className="w-8 h-8" />;
              })()}
            </div>
            <div>
              <h4 className="font-display text-2xl text-text">
                {steps[activeStep].title}
              </h4>
              <p className="text-text-soft">{steps[activeStep].description}</p>
              <p className="text-sm text-text-muted mt-1">{steps[activeStep].detail}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-xs text-text-muted hover:text-text"
        >
          {isPaused ? 'Play' : 'Pause'}
        </button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActiveStep(i)}
              animate={{ width: i === activeStep ? 24 : 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`h-2 rounded-full ${
                i === activeStep ? 'bg-accent' : 'bg-border hover:bg-accent/50'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
