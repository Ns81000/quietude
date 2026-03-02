import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ListChecks, 
  ToggleLeft, 
  PenLine,
  Timer,
  RotateCcw,
  TrendingUp,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

type QuestionType = 'mcq' | 'tf' | 'fill';

// MCQ Demo Component
function MCQDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  
  // Auto-select correct answer (index 1) after a delay
  useEffect(() => {
    setSelected(null);
    const timer = setTimeout(() => {
      setSelected(1); // Correct answer
    }, 600);
    return () => clearTimeout(timer);
  }, []);
  
  const options = [
    'Store genetic information',
    'Generate ATP through cellular respiration',
    'Synthesize proteins',
    'Break down waste products',
  ];
  
  return (
    <div className="space-y-3">
      <p className="text-text font-medium text-sm mb-4">
        What is the primary function of mitochondria?
      </p>
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => setSelected(i)}
          className={cn(
            'w-full p-3 rounded-lg border text-left text-sm transition-all duration-200',
            selected === i
              ? i === 1
                ? 'border-correct bg-correct/10 text-correct'
                : 'border-incorrect bg-incorrect/10 text-incorrect'
              : 'border-border hover:border-accent/50 text-text-soft hover:text-text'
          )}
        >
          <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
          {option}
          {selected === i && (
            <span className="float-right">
              {i === 1 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// True/False Demo Component
function TrueFalseDemo() {
  const [answer, setAnswer] = useState<boolean | null>(null);
  
  // Auto-select wrong answer (false) after a delay
  useEffect(() => {
    setAnswer(null);
    const timer = setTimeout(() => {
      setAnswer(false); // Wrong answer
    }, 600);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="space-y-4">
      <p className="text-text font-medium text-sm mb-6">
        "The mitochondria is often called the powerhouse of the cell."
      </p>
      <div className="flex gap-4">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            onClick={() => setAnswer(value)}
            className={cn(
              'flex-1 p-4 rounded-xl border text-center font-medium transition-all duration-200',
              answer === value
                ? value === true
                  ? 'border-correct bg-correct/10 text-correct'
                  : 'border-incorrect bg-incorrect/10 text-incorrect'
                : 'border-border hover:border-accent/50 text-text-soft hover:text-text'
            )}
          >
            {value ? 'True' : 'False'}
            {answer === value && (
              <span className="ml-2 inline-block">
                {value === true ? <Check className="w-4 h-4 inline" /> : <X className="w-4 h-4 inline" />}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Fill-in-Blank Demo Component
function FillBlankDemo() {
  const [input, setInput] = useState('');
  const isCorrect = input.toLowerCase().trim() === 'cellular';
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-type correct answer with typing animation
  useEffect(() => {
    setInput('');
    const answer = 'cellular';
    let currentIndex = 0;
    
    const startDelay = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (currentIndex < answer.length) {
          setInput(answer.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 150);
    }, 500);
    
    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  return (
    <div className="space-y-4">
      <p className="text-text font-medium text-sm">
        Complete: "The process by which cells convert glucose into ATP is called{' '}
        <span className="inline-block min-w-[80px] border-b-2 border-dashed border-accent" />{' '}
        respiration."
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your answer..."
        className={cn(
          'w-full p-3 rounded-lg border bg-surface text-text text-sm',
          'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent',
          input.length > 0 && (isCorrect ? 'border-correct' : 'border-incorrect')
        )}
      />
      {input.length > 0 && (
        <p className={cn('text-xs', isCorrect ? 'text-correct' : 'text-text-muted')}>
          {isCorrect 
            ? 'Correct! Fuzzy matching accepts: "Cellular", "CELLULAR", etc.'
            : 'Hint: Starts with "c"...'}
        </p>
      )}
    </div>
  );
}

const questionTypes: { type: QuestionType; icon: any; title: string; description: string }[] = [
  {
    type: 'mcq',
    icon: ListChecks,
    title: 'Multiple Choice',
    description: '4 smart options with AI-generated distractors',
  },
  {
    type: 'tf',
    icon: ToggleLeft,
    title: 'True / False',
    description: 'Conceptual statements testing understanding',
  },
  {
    type: 'fill',
    icon: PenLine,
    title: 'Fill-in-Blank',
    description: 'Active recall with fuzzy answer matching',
  },
];

const features = [
  { icon: TrendingUp, text: '75% pass threshold to progress' },
  { icon: Sparkles, text: '"Dig Deeper" for advanced challenges' },
  { icon: Timer, text: 'Timer and progress tracking' },
  { icon: RotateCcw, text: 'Crash recovery if app closes' },
];

export default function Slide3QuizExperience({}: SlideProps) {
  const [activeType, setActiveType] = useState<QuestionType>('mcq');
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle manual type click - pause for 40 seconds then resume
  const handleTypeClick = (type: QuestionType) => {
    setActiveType(type);
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

  // Auto-switch quiz types
  useEffect(() => {
    if (isPaused) return;
    
    const types: QuestionType[] = ['mcq', 'tf', 'fill'];
    const interval = setInterval(() => {
      setActiveType((prev) => {
        const currentIndex = types.indexOf(prev);
        return types[(currentIndex + 1) % types.length];
      });
    }, 2800);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="text-sm font-medium text-accent uppercase tracking-wider">
          Core Feature
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-text mt-2">
          The Quiz Experience
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Question Type Selector + Demo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Type Tabs */}
          <div className="flex gap-2 mb-6">
            {questionTypes.map((qt) => (
              <button
                key={qt.type}
                onClick={() => handleTypeClick(qt.type)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'border transition-all duration-200 text-sm font-medium',
                  activeType === qt.type
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-surface border-border text-text-soft hover:text-text hover:border-accent/50'
                )}
              >
                <qt.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{qt.title}</span>
              </button>
            ))}
          </div>

          {/* Demo Area */}
          <div className="p-6 rounded-2xl bg-surface border border-border/50 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeType}
                initial={{ opacity: 0, x: 15, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -15, scale: 0.98 }}
                transition={{ 
                  duration: 0.25,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {activeType === 'mcq' && <MCQDemo />}
                {activeType === 'tf' && <TrueFalseDemo />}
                {activeType === 'fill' && <FillBlankDemo />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Type Description */}
          <p className="mt-4 text-sm text-text-muted text-center">
            {questionTypes.find(q => q.type === activeType)?.description}
          </p>
        </motion.div>

        {/* Right: Features */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col justify-center"
        >
          <h3 className="text-lg font-display text-text mb-6">Key Features</h3>
          
          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-text">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-text">Powered by Gemini AI</p>
                <p className="text-xs text-text-muted">
                  Questions generated from YOUR uploaded content
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
