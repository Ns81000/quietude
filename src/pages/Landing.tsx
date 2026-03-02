import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getTimeTheme, applyTheme, type TimedTheme, type MoodTheme, type AnyTheme, THEME_LABELS } from '@/lib/theme';
import { useUIStore } from '@/store/ui';
import {
  Upload,
  Brain,
  FileText,
  Headphones,
  Image,
  Sparkles,
  Clock,
  BarChart3,
  Wifi,
  WifiOff,
  Sun,
  Sunset,
  Moon,
  CloudSun,
  Sunrise,
  Palette,
  ChevronDown,
  ArrowRight,
  Zap,
  Shield,
  RefreshCw,
  Target,
  BookOpen,
  TrendingUp,
  Layers,
  HelpCircle,
  ListChecks,
  PenLine,
  Code2,
  Database,
  Cpu,
  Globe,
  Lock,
  MessageCircleQuestion,
  Menu,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// SPINNER COMPONENT
// ─────────────────────────────────────────────────────────────
function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return (
    <svg className={`${sizeClasses} animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION WRAPPER WITH ANIMATIONS
// ─────────────────────────────────────────────────────────────
function Section({ 
  children, 
  className = '',
  id,
}: { 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className={cn('relative', className)}
    >
      {children}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURE CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  delay = 0,
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
      className="group relative p-6 rounded-xl bg-surface border border-border/50 
                 hover:border-accent/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4
                      group-hover:bg-accent/20 transition-colors duration-300">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="font-display text-lg text-text mb-2">{title}</h3>
      <p className="text-text-soft text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// THEME PREVIEW CARD
// ─────────────────────────────────────────────────────────────
function ThemeCard({ 
  name, 
  time, 
  colors, 
  icon: Icon,
  isActive,
  onClick,
}: { 
  name: string; 
  time: string; 
  colors: { bg: string; accent: string; text: string };
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative p-4 rounded-xl border transition-all duration-300 text-left w-full',
        'bg-surface hover:bg-surface/80',
        isActive 
          ? 'border-accent shadow-md' 
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.accent + '20' }}
        >
          <Icon className="w-4 h-4" style={{ color: colors.accent }} />
        </div>
        <div>
          <p className="font-medium text-sm text-text">{name}</p>
          <p className="text-xs text-text-muted">{time}</p>
        </div>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeTheme"
          className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// QUESTION TYPE DEMO
// ─────────────────────────────────────────────────────────────
function QuestionTypeDemo({ 
  type, 
  isActive 
}: { 
  type: 'mcq' | 'tf' | 'fill'; 
  isActive: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');

  useEffect(() => {
    setSelected(null);
    setTfAnswer(null);
    setFillAnswer('');
  }, [type]);

  if (!isActive) return null;

  if (type === 'mcq') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-3"
      >
        <p className="text-text font-medium mb-4">
          What is the primary function of mitochondria in a cell?
        </p>
        {[
          'Store genetic information',
          'Generate ATP through cellular respiration',
          'Synthesize proteins',
          'Break down waste products',
        ].map((option, i) => (
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
          </button>
        ))}
      </motion.div>
    );
  }

  if (type === 'tf') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
        <p className="text-text font-medium mb-6">
          Statement: The mitochondria is often called the powerhouse of the cell.
        </p>
        <div className="flex gap-4">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              onClick={() => setTfAnswer(value)}
              className={cn(
                'flex-1 p-4 rounded-lg border text-center font-medium transition-all duration-200',
                tfAnswer === value
                  ? value === true
                    ? 'border-correct bg-correct/10 text-correct'
                    : 'border-incorrect bg-incorrect/10 text-incorrect'
                  : 'border-border hover:border-accent/50 text-text-soft hover:text-text'
              )}
            >
              {value ? 'True' : 'False'}
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-text font-medium">
        Complete the sentence: The process by which cells convert glucose into ATP is called{' '}
        <span className="inline-block min-w-[100px] border-b-2 border-dashed border-accent" /> respiration.
      </p>
      <input
        type="text"
        value={fillAnswer}
        onChange={(e) => setFillAnswer(e.target.value)}
        placeholder="Type your answer..."
        className={cn(
          'w-full p-3 rounded-lg border bg-surface text-text',
          'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent',
          fillAnswer.toLowerCase() === 'cellular'
            ? 'border-correct'
            : fillAnswer.length > 0
              ? 'border-incorrect'
              : 'border-border'
        )}
      />
      {fillAnswer.length > 0 && (
        <p className={cn(
          'text-sm',
          fillAnswer.toLowerCase() === 'cellular' ? 'text-correct' : 'text-incorrect'
        )}>
          {fillAnswer.toLowerCase() === 'cellular' 
            ? 'Correct! Fuzzy matching accepts variations like "Cellular" or "CELLULAR".'
            : 'Try again! Hint: It starts with "c"...'}
        </p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// WORKFLOW STEP
// ─────────────────────────────────────────────────────────────
function WorkflowStep({ 
  step, 
  title, 
  description, 
  icon: Icon,
  isLast = false,
}: { 
  step: number; 
  title: string; 
  description: string; 
  icon: React.ElementType;
  isLast?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay: step * 0.15 }}
      className="relative flex gap-4 pb-8"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-px bg-gradient-to-b from-accent/50 to-transparent" />
      )}
      
      {/* Step number */}
      <div className="relative z-10 w-12 h-12 rounded-full bg-accent text-accent-text 
                      flex items-center justify-center font-display text-lg shrink-0">
        {step}
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-accent" />
          <h4 className="font-display text-lg text-text">{title}</h4>
        </div>
        <p className="text-text-soft text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ 
  value, 
  label, 
  icon: Icon,
  delay = 0,
}: { 
  value: string; 
  label: string; 
  icon: React.ElementType;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay }}
      className="text-center p-6"
    >
      <Icon className="w-8 h-8 text-accent mx-auto mb-3" />
      <p className="font-display text-3xl text-text mb-1">{value}</p>
      <p className="text-text-soft text-sm">{label}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// LIVE THEME INDICATOR
// ─────────────────────────────────────────────────────────────
function LiveThemeIndicator({ currentTheme }: { currentTheme: TimedTheme }) {
  const themeInfo: Record<TimedTheme, { icon: React.ElementType; label: string; time: string }> = {
    morning: { icon: Sunrise, label: 'Morning Mist', time: '05:00 - 10:59' },
    afternoon: { icon: Sun, label: 'Afternoon Focus', time: '11:00 - 15:59' },
    golden: { icon: Sunset, label: 'Golden Hour', time: '16:00 - 18:59' },
    evening: { icon: CloudSun, label: 'Evening Wind', time: '19:00 - 21:59' },
    midnight: { icon: Moon, label: 'Midnight Study', time: '22:00 - 04:59' },
  };

  const info = themeInfo[currentTheme];
  const Icon = info.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-surface/80 
                 backdrop-blur-sm border border-border/50 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-correct animate-pulse" />
        <span className="text-xs text-text-muted uppercase tracking-wider">Live Theme</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        <span className="text-sm text-text font-medium">{info.label}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ ITEM COMPONENT
// ─────────────────────────────────────────────────────────────
function FAQItem({ 
  question, 
  answer, 
  delay = 0 
}: { 
  question: string; 
  answer: string; 
  delay?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="border-b border-border/50 last:border-b-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-text group-hover:text-accent transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-soft text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// FLOATING SHAPES (DECORATIVE)
// ─────────────────────────────────────────────────────────────
function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full 
                   bg-gradient-to-br from-accent/5 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 right-[5%] w-96 h-96 rounded-full 
                   bg-gradient-to-br from-accent/3 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, -15, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full 
                   bg-gradient-to-br from-accent/4 to-transparent blur-3xl"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCROLL INDICATOR
// ─────────────────────────────────────────────────────────────
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-text-muted text-xs tracking-wider uppercase">Scroll to explore</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-5 h-5 text-text-muted" />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING THEME SELECTOR (self-contained for landing page)
// ─────────────────────────────────────────────────────────────
const MOOD_THEMES: MoodTheme[] = ['sage', 'storm', 'sand', 'plum', 'ink'];

function LandingThemeSelector() {
  const { activeMood, setMood } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (mood: MoodTheme | null) => {
    setMood(mood);
    if (!mood) {
      // Reset to time-based theme
      const timeTheme = getTimeTheme();
      applyTheme(timeTheme);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md text-sm text-text-soft
                   hover:bg-surface/50 transition-colors duration-150"
        aria-label="Select theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">{activeMood ? THEME_LABELS[activeMood] : 'Auto'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-surface border border-border
                         rounded-lg shadow-lg p-1.5 min-w-[140px] sm:min-w-[160px]"
            >
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 flex items-center gap-2',
                  !activeMood 
                    ? 'bg-accent/10 text-text' 
                    : 'text-text-soft hover:bg-surface hover:text-text'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
              <div className="h-px bg-border my-1" />
              {MOOD_THEMES.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleSelect(mood)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150',
                    activeMood === mood 
                      ? 'bg-accent/10 text-text' 
                      : 'text-text-soft hover:bg-surface hover:text-text'
                  )}
                >
                  {THEME_LABELS[mood]}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────
function Navigation({ onGetStarted, onPresentation }: { onGetStarted: () => void; onPresentation: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { label: 'Features', id: 'features' },
    { label: 'How it Works', id: 'workflow' },
    { label: 'Themes', id: 'themes' },
    { label: 'Why Quietude', id: 'why' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || mobileMenuOpen ? 'bg-bg/95 backdrop-blur-lg border-b border-border/50' : 'bg-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="font-display text-xl text-text">quietude</span>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-text-soft hover:text-text transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Selector - visible on all screens */}
              <LandingThemeSelector />
              
              {/* Presentation button - hidden on very small screens */}
              <button
                onClick={onPresentation}
                className="hidden sm:flex px-3 lg:px-4 py-2 rounded-lg border border-accent/50 text-accent text-sm font-medium
                           hover:bg-accent/10 transition-colors"
              >
                <span className="hidden lg:inline">Presentation</span>
                <span className="lg:hidden">Demo</span>
              </button>
              
              {/* Get Started button */}
              <button
                onClick={onGetStarted}
                className="hidden sm:flex px-3 lg:px-4 py-2 rounded-lg bg-accent text-accent-text text-sm font-medium
                           hover:opacity-90 transition-opacity"
              >
                <span className="hidden lg:inline">Get Started</span>
                <span className="lg:hidden">Start</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-text hover:bg-surface/50 transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-surface border-b border-border shadow-lg"
            >
              <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left px-4 py-3 rounded-lg text-text-soft hover:text-text 
                               hover:bg-bg-2 transition-colors text-base"
                  >
                    {item.label}
                  </button>
                ))}
                
                <div className="h-px bg-border my-2" />
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onPresentation();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-accent hover:bg-accent/10 
                             transition-colors text-base font-medium"
                >
                  View Presentation
                </button>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-accent text-accent-text 
                             hover:opacity-90 transition-opacity text-base font-medium text-center"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LANDING PAGE
// ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState(0);
  const [activeQuestionType, setActiveQuestionType] = useState<'mcq' | 'tf' | 'fill'>('mcq');
  const [currentTimeTheme, setCurrentTimeTheme] = useState<TimedTheme>(getTimeTheme());
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Get active mood from store to react to theme selector changes
  const activeMood = useUIStore((s) => s.activeMood);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  // Apply theme to landing page (respects mood theme if set, otherwise time-based)
  useEffect(() => {
    const updateTheme = () => {
      // If a mood theme is selected, use it; otherwise use time-based theme
      if (activeMood) {
        applyTheme(activeMood);
      } else {
        const theme = getTimeTheme();
        setCurrentTimeTheme(theme);
        applyTheme(theme);
      }
    };

    updateTheme();
    
    // Update theme every minute (only matters when using auto/time-based theme)
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [activeMood]);

  const goToLogin = () => navigate('/login');

  const themes = [
    { name: 'Morning Mist', time: '05:00 - 10:59', colors: { bg: '#faf8f5', accent: '#c2703a', text: '#3d2c22' }, icon: Sunrise },
    { name: 'Afternoon Focus', time: '11:00 - 15:59', colors: { bg: '#f5f5f5', accent: '#4a6fa5', text: '#1a1a1a' }, icon: Sun },
    { name: 'Golden Hour', time: '16:00 - 18:59', colors: { bg: '#fdf6e3', accent: '#b8860b', text: '#2d1f0e' }, icon: Sunset },
    { name: 'Evening Wind', time: '19:00 - 21:59', colors: { bg: '#f9f5f6', accent: '#9b4d6a', text: '#2d1a22' }, icon: CloudSun },
    { name: 'Midnight Study', time: '22:00 - 04:59', colors: { bg: '#13151a', accent: '#c9a227', text: '#e0d5c0' }, icon: Moon },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingShapes />
      <Navigation onGetStarted={goToLogin} onPresentation={() => navigate('/presentation')} />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Live Theme Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <LiveThemeIndicator currentTheme={currentTimeTheme} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                       bg-accent/10 text-accent text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning Platform
          </motion.div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text mb-6 leading-tight">
            Learn with
            <span className="relative mx-3">
              <span className="relative z-10">Calm</span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-2 left-0 h-3 bg-accent/20 -z-0"
              />
            </span>
            and
            <span className="relative mx-3">
              <span className="relative z-10">Clarity</span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute bottom-2 left-0 h-3 bg-accent/20 -z-0"
              />
            </span>
          </h1>

          <p className="text-text-soft text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform any study material into an interactive learning journey. 
            Upload your content, let AI generate quizzes and notes, 
            and track your progress in an environment designed for focus.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={goToLogin}
              className="px-8 py-4 rounded-xl bg-accent text-accent-text font-medium
                         hover:opacity-90 transition-all duration-200 flex items-center gap-2
                         shadow-lg shadow-accent/20"
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl border border-border text-text font-medium
                         hover:bg-surface transition-all duration-200"
            >
              See How It Works
            </button>
          </motion.div>
        </motion.div>

        <ScrollIndicator />
      </motion.div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FEATURES SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
              Capabilities
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              Everything You Need to Master Any Subject
            </h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              Quietude combines cutting-edge AI with thoughtful design to create 
              a learning experience that adapts to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="AI Content Analysis"
              description="Upload any study material and watch as our AI engine identifies key topics, concepts, and learning objectives automatically."
              delay={0}
            />
            <FeatureCard
              icon={Sparkles}
              title="Smart Quiz Generation"
              description="Three question types - multiple choice, true/false, and fill-in-blank - with intelligent distractors and fuzzy answer matching."
              delay={0.1}
            />
            <FeatureCard
              icon={FileText}
              title="Auto-Generated Notes"
              description="When you need extra help, AI generates comprehensive study notes with examples, key terms, and actionable takeaways."
              delay={0.2}
            />
            <FeatureCard
              icon={Palette}
              title="Adaptive Themes"
              description="Five time-based themes shift with your day, plus five mood overrides. Your interface naturally adapts to support focus."
              delay={0.3}
            />
            <FeatureCard
              icon={WifiOff}
              title="Offline-First Design"
              description="Study anywhere without internet. Changes sync automatically when you reconnect, with intelligent conflict resolution."
              delay={0.4}
            />
            <FeatureCard
              icon={BarChart3}
              title="Learning Analytics"
              description="Track scores, view activity heatmaps, discover your best study times, and monitor streaks to stay motivated."
              delay={0.5}
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* CONTENT TYPES SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section className="py-24 px-4 bg-bg-2/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
                Flexible Input
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-text mb-6">
                Upload Anything, Learn Everything
              </h2>
              <p className="text-text-soft mb-8 leading-relaxed">
                Whether you have lecture slides, textbook chapters, voice recordings, 
                or handwritten notes, Quietude can process it all. Our multimodal AI 
                understands text, images, and audio to extract the knowledge you need.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: FileText, label: 'PDF Documents', desc: 'Textbooks, papers, slides' },
                  { icon: Image, label: 'Images', desc: 'Photos, diagrams, screenshots' },
                  { icon: Headphones, label: 'Audio Files', desc: 'Lectures, podcasts, recordings' },
                  { icon: PenLine, label: 'Plain Text', desc: 'Notes, articles, markdown' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{item.label}</p>
                      <p className="text-sm text-text-muted">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="p-8 rounded-2xl bg-surface border border-border shadow-lg">
                <div className="border-2 border-dashed border-border rounded-xl p-12 
                               flex flex-col items-center justify-center text-center
                               hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-text font-medium mb-2">Drop your files here</p>
                  <p className="text-text-muted text-sm">or click to browse</p>
                  <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
                    <span>PDF</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span>PNG</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span>JPG</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span>MP3</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span>WAV</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-accent/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-accent/5 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* WORKFLOW SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section id="workflow" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
              The Process
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              From Upload to Mastery in Minutes
            </h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              A streamlined workflow that transforms your study material into 
              an engaging learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <WorkflowStep
                step={1}
                title="Upload Your Content"
                description="Drop any PDF, image, audio file, or paste text directly. Our system accepts multiple formats to match your study material."
                icon={Upload}
              />
              <WorkflowStep
                step={2}
                title="AI Analyzes Everything"
                description="Gemini AI processes your content, identifying topics, key concepts, and creating a structured learning map."
                icon={Brain}
              />
              <WorkflowStep
                step={3}
                title="Configure Your Quiz"
                description="Choose your question types, set the number of questions, and optionally enable a timer for focused practice."
                icon={Layers}
              />
              <WorkflowStep
                step={4}
                title="Learn and Improve"
                description="Take quizzes, review explanations, generate study notes when needed, and track your progress over time."
                icon={TrendingUp}
                isLast
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative lg:sticky lg:top-24 h-fit"
            >
              <div className="p-6 rounded-2xl bg-surface border border-border shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-incorrect/60" />
                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                    <div className="w-3 h-3 rounded-full bg-correct/60" />
                  </div>
                  <span className="text-xs text-text-muted">Quiz Preview</span>
                </div>

                {/* Question type selector */}
                <div className="flex gap-2 mb-6 p-1 rounded-lg bg-bg-2">
                  {[
                    { type: 'mcq' as const, label: 'Multiple Choice', icon: ListChecks },
                    { type: 'tf' as const, label: 'True/False', icon: HelpCircle },
                    { type: 'fill' as const, label: 'Fill Blank', icon: PenLine },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setActiveQuestionType(item.type)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-all',
                        activeQuestionType === item.type
                          ? 'bg-surface text-text shadow-sm'
                          : 'text-text-muted hover:text-text'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Question demo */}
                <AnimatePresence mode="wait">
                  <QuestionTypeDemo type={activeQuestionType} isActive={true} />
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* THEME SYSTEM SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section id="themes" className="py-24 px-4 bg-bg-2/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
                Circadian Design
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-text mb-6">
                An Interface That Breathes With Your Day
              </h2>
              <p className="text-text-soft mb-6 leading-relaxed">
                Modern learning tools often overwhelm with visual noise. Quietude takes 
                a different approach - your interface naturally transitions through five 
                time-based themes, from warm morning tones to eye-friendly midnight hues.
              </p>
              <p className="text-text-soft mb-8 leading-relaxed">
                Plus, five mood overrides let you take control whenever you need a specific 
                atmosphere: Sage for nature-inspired calm, Storm for deep focus, Sand for 
                comfortable reading, Plum for creative sessions, or Ink for true dark mode.
              </p>

              <div className="flex flex-wrap gap-2">
                {['Sage', 'Storm', 'Sand', 'Plum', 'Ink'].map((mood) => (
                  <span 
                    key={mood}
                    className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-soft"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="space-y-3">
              {themes.map((theme, i) => (
                <ThemeCard
                  key={theme.name}
                  {...theme}
                  isActive={activeTheme === i}
                  onClick={() => setActiveTheme(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* WHY QUIETUDE SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section id="why" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
              The Difference
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              Why Quietude Stands Apart
            </h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              In a world of noisy, gamified learning apps, we chose intentional simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: 'Reliable AI Infrastructure',
                description: 'Six API keys with automatic rotation ensure consistent service. If one key hits quota limits, we instantly switch to another with zero interruption.',
              },
              {
                icon: Zap,
                title: 'Intelligent Answer Matching',
                description: 'Fill-in-blank questions use fuzzy matching that understands variations in spelling, capitalization, and phrasing. Close enough counts.',
              },
              {
                icon: RefreshCw,
                title: 'Seamless Synchronization',
                description: 'Work offline without worry. Your progress queues locally and syncs automatically when you reconnect, with smart conflict resolution.',
              },
              {
                icon: Target,
                title: 'Progressive Difficulty',
                description: 'Pass at 75% to unlock the next topic. Score lower? Get AI-generated study notes. Want more challenge? The "Dig Deeper" feature awaits.',
              },
              {
                icon: Clock,
                title: 'Crash Recovery Built In',
                description: 'If your browser closes mid-quiz, your progress is saved. Resume exactly where you left off without losing a single answer.',
              },
              {
                icon: BookOpen,
                title: 'Notes That Actually Help',
                description: 'AI-generated notes feature hierarchical structure, concrete examples, key terms, and actionable takeaways. Export to PDF anytime.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 p-6 rounded-xl bg-surface border border-border/50"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-text mb-2">{item.title}</h3>
                  <p className="text-text-soft text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* STATS SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section className="py-16 px-4 bg-bg-2/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="3" label="Question Types" icon={ListChecks} delay={0} />
            <StatCard value="5" label="Time Themes" icon={Clock} delay={0.1} />
            <StatCard value="5" label="Mood Overrides" icon={Palette} delay={0.2} />
            <StatCard value="100%" label="Offline Ready" icon={Wifi} delay={0.3} />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PHILOSOPHY QUOTE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl sm:text-3xl text-text leading-relaxed mb-6"
          >
            "In the midst of movement and chaos, keep stillness inside of you."
          </motion.blockquote>
          <p className="text-text-soft">Deepak Chopra</p>
          <div className="w-16 h-px bg-accent/30 mx-auto mt-8" />
          <p className="text-text-muted text-sm mt-8 max-w-xl mx-auto">
            This philosophy guides everything we build. Learning doesn't have to be 
            overwhelming. With the right environment and tools, even the most complex 
            subjects become approachable.
          </p>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FAQ SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section id="faq" className="py-24 px-4 bg-bg-2/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
              Questions
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-text-soft">
              Everything you need to know about Quietude.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-border/50 p-6 sm:p-8">
            <FAQItem
              question="What file formats does Quietude support?"
              answer="Quietude supports a wide range of formats including PDF documents, images (PNG, JPEG, WebP), audio files (MP3, WAV, M4A), and plain text. Our multimodal AI can extract knowledge from any of these formats and turn them into interactive quizzes."
              delay={0}
            />
            <FAQItem
              question="How does the AI quiz generation work?"
              answer="When you upload content, our Gemini AI analyzes it to identify key topics and concepts. It then generates three types of questions: multiple choice with intelligent distractors, true/false statements testing conceptual understanding, and fill-in-the-blank with fuzzy answer matching that accepts variations in spelling and phrasing."
              delay={0.1}
            />
            <FAQItem
              question="Can I use Quietude offline?"
              answer="Yes! Quietude is built as an offline-first Progressive Web App (PWA). You can study without internet connection, and all your progress will sync automatically when you reconnect. We even have crash recovery that saves your quiz progress if your browser closes unexpectedly."
              delay={0.2}
            />
            <FAQItem
              question="What happens if I score below 75%?"
              answer="If you score below the 75% passing threshold, Quietude automatically generates comprehensive study notes for that topic. These notes include hierarchical structure, concrete examples, key term highlights, and actionable takeaways. You can also export them to PDF for offline review."
              delay={0.3}
            />
            <FAQItem
              question="How does the time-based theming work?"
              answer="Quietude automatically adjusts its visual theme based on the time of day to support your natural focus patterns. Morning themes are warm and energizing, afternoon themes are clean and productive, and midnight themes are dark and eye-friendly. You can also override this with five mood themes anytime."
              delay={0.4}
            />
            <FAQItem
              question="Is my data secure?"
              answer="Your data is stored locally first using IndexedDB, and synced securely to Firebase when online. We use industry-standard encryption and never share your learning data with third parties. The AI processing happens through secure API calls to Google's Gemini."
              delay={0.5}
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TECH STACK SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase mb-4 block">
              Built With
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              Modern Technology Stack
            </h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              Quietude is built on a foundation of reliable, modern technologies 
              chosen for performance, developer experience, and user satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Code2, label: 'React 18', desc: 'UI Library' },
              { icon: Zap, label: 'Vite', desc: 'Build Tool' },
              { icon: Cpu, label: 'Gemini AI', desc: 'Intelligence' },
              { icon: Database, label: 'Firebase', desc: 'Backend' },
              { icon: Globe, label: 'PWA', desc: 'Offline-First' },
              { icon: Lock, label: 'TypeScript', desc: 'Type Safety' },
            ].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex flex-col items-center p-4 rounded-xl bg-surface border border-border/50
                           hover:border-accent/30 transition-colors"
              >
                <tech.icon className="w-8 h-8 text-accent mb-2" />
                <p className="font-medium text-text text-sm">{tech.label}</p>
                <p className="text-text-muted text-xs">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FINAL CTA SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Section className="py-24 px-4 bg-bg-2/50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl text-text mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-text-soft mb-8 max-w-xl mx-auto">
              Join thousands of learners who have discovered a calmer, more effective 
              way to study. No credit card required, no complex setup.
            </p>
            <button
              onClick={goToLogin}
              className="px-8 py-4 rounded-xl bg-accent text-accent-text font-medium
                         hover:opacity-90 transition-all duration-200 inline-flex items-center gap-2
                         shadow-lg shadow-accent/20"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-text-muted mt-4">
              Sign up with just your email. Start learning in seconds.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ─────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-text">quietude</span>
              <span className="text-text-muted text-sm">Your calm, intelligent learning partner</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <span>Built with care</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>Powered by Gemini AI</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>Offline-first PWA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
