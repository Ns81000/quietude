import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getTimeTheme, applyTheme, type TimedTheme } from '@/lib/theme';
import { useUIStore } from '@/store/ui';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Monitor,
  Home,
} from 'lucide-react';

// Import all slides
import {
  Slide1Title,
  Slide2Problem,
  Slide3HowItWorks,
  Slide4QuizExperience,
  Slide5Theming,
  Slide6OfflineSecurity,
  Slide7Architecture,
  Slide8ProductShowcase,
  Slide9Closing,
} from './slides';

// Storage key for persisting slide
const SLIDE_STORAGE_KEY = 'quietude-presentation-slide';

const SLIDES = [
  { id: 1, component: Slide1Title, title: 'Introduction' },
  { id: 2, component: Slide2Problem, title: 'Problem & Solution' },
  { id: 3, component: Slide3HowItWorks, title: 'How It Works' },
  { id: 4, component: Slide4QuizExperience, title: 'Quiz Experience' },
  { id: 5, component: Slide5Theming, title: 'Theming' },
  { id: 6, component: Slide6OfflineSecurity, title: 'Offline & Security' },
  { id: 7, component: Slide7Architecture, title: 'Architecture' },
  { id: 8, component: Slide8ProductShowcase, title: 'Product Showcase' },
  { id: 9, component: Slide9Closing, title: 'Closing' },
];

// Floating background shapes
function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[10%] w-[500px] h-[500px] rounded-full 
                   bg-gradient-to-br from-accent/5 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 40, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 right-[5%] w-[600px] h-[600px] rounded-full 
                   bg-gradient-to-br from-accent/3 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full 
                   bg-gradient-to-br from-accent/4 to-transparent blur-3xl"
      />
    </div>
  );
}

// Progress bar component
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-1 bg-border/30 z-50">
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${((current + 1) / total) * 100}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

// Slide indicator dots
function SlideIndicator({ 
  current, 
  total, 
  onSelect 
}: { 
  current: number; 
  total: number; 
  onSelect: (index: number) => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            i === current 
              ? 'w-8 bg-accent' 
              : 'bg-text-muted/30 hover:bg-text-muted/50'
          )}
          title={SLIDES[i].title}
        />
      ))}
    </div>
  );
}

// Navigation controls
function NavigationControls({
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  isFullscreen,
  onToggleFullscreen,
  isPlaying,
  onTogglePlay,
  showPlayButton,
  currentSlide,
  totalSlides,
}: {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showPlayButton: boolean;
  currentSlide: number;
  totalSlides: number;
}) {
  return (
    <div className="fixed top-6 right-6 flex items-center gap-2 z-50">
      <span className="text-xs text-text-muted mr-2">
        {currentSlide + 1} / {totalSlides}
      </span>
      
      {showPlayButton && (
        <button
          onClick={onTogglePlay}
          className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border/50
                     hover:bg-surface transition-colors text-text-soft hover:text-text"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      )}
      
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={cn(
          'p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border/50 transition-colors',
          canGoPrev 
            ? 'hover:bg-surface text-text-soft hover:text-text' 
            : 'opacity-30 cursor-not-allowed'
        )}
        title="Previous (←)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          'p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border/50 transition-colors',
          canGoNext 
            ? 'hover:bg-surface text-text-soft hover:text-text' 
            : 'opacity-30 cursor-not-allowed'
        )}
        title="Next (→)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border/50
                   hover:bg-surface transition-colors text-text-soft hover:text-text"
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Slide transition wrapper
function SlideWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -100 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 flex items-center justify-center p-8 md:p-12 lg:p-16"
    >
      {children}
    </motion.div>
  );
}

// Main Presentation Component
export default function Presentation() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(() => {
    // Restore slide from localStorage
    const saved = localStorage.getItem(SLIDE_STORAGE_KEY);
    return saved ? Math.min(parseInt(saved, 10), SLIDES.length - 1) : 0;
  });
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<TimedTheme>(getTimeTheme());
  const containerRef = useRef<HTMLDivElement>(null);
  const slideNavHandlerRef = useRef<((direction: 'prev' | 'next') => boolean) | null>(null);

  // Check for mobile device and block access
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-enter fullscreen on mount (desktop only)
  useEffect(() => {
    if (!isMobile && containerRef.current && !document.fullscreenElement) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        containerRef.current?.requestFullscreen().catch(() => {
          // Fullscreen might be blocked by browser, that's okay
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Save current slide to localStorage
  useEffect(() => {
    localStorage.setItem(SLIDE_STORAGE_KEY, currentSlide.toString());
  }, [currentSlide]);

  // Get active mood from store to react to theme changes from landing page
  const activeMood = useUIStore((s) => s.activeMood);

  // Apply theme (respects mood theme if set, otherwise time-based)
  useEffect(() => {
    const updateTheme = () => {
      if (activeMood) {
        // Use the mood theme from the store
        applyTheme(activeMood);
      } else {
        // Use time-based theme
        const theme = getTimeTheme();
        setCurrentTheme(theme);
        applyTheme(theme);
      }
    };

    updateTheme();
    
    // Update theme every minute (only matters for time-based themes)
    const interval = setInterval(updateTheme, 60000);
    
    return () => clearInterval(interval);
  }, [activeMood]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          // Check if current slide wants to handle navigation internally
          if (slideNavHandlerRef.current && slideNavHandlerRef.current('next')) {
            return; // Slide handled it internally
          }
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Check if current slide wants to handle navigation internally
          if (slideNavHandlerRef.current && slideNavHandlerRef.current('prev')) {
            return; // Slide handled it internally
          }
          prevSlide();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          }
          break;
        default:
          // Number keys 1-8 for direct slide navigation
          const num = parseInt(e.key);
          if (num >= 1 && num <= SLIDES.length) {
            goToSlide(num - 1);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, isFullscreen]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Clear slide nav handler when slide changes
  useEffect(() => {
    slideNavHandlerRef.current = null;
  }, [currentSlide]);

  // Register nav handler callback for slides that need internal navigation
  const registerNavHandler = useCallback((handler: (direction: 'prev' | 'next') => boolean) => {
    slideNavHandlerRef.current = handler;
  }, []);

  // Current slide component
  const CurrentSlideComponent = SLIDES[currentSlide].component;
  const showPlayButton = currentSlide === 7; // Slide 8 (Product Showcase, index 7) has auto-play
  const isFullScreenSlide = currentSlide === 4; // Slide 5 (Theming, index 4) is full-screen
  const needsInternalNav = currentSlide === 1 || currentSlide === 8; // Slide 2 (Problem/Solution) and Slide 9 (Closing)

  // Mobile blocking screen
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center p-8 text-center z-[100]">
        <Monitor className="w-16 h-16 text-accent mb-6" />
        <h1 className="font-display text-3xl text-text mb-4">Desktop Only</h1>
        <p className="text-text-soft max-w-md mb-8">
          This presentation is optimized for desktop viewing. Please open it on a larger screen (1024px+) for the best experience.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Home className="w-5 h-5" />
          Go to Quietude
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-bg overflow-hidden select-none"
    >
      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface/80 backdrop-blur border border-border 
                   hover:border-accent/50 transition-colors group"
        title="Back to Quietude"
      >
        <Home className="w-5 h-5 text-text-soft group-hover:text-accent transition-colors" />
      </button>

      {/* Hide background shapes on full-screen slides */}
      {!isFullScreenSlide && <FloatingShapes />}
      
      <NavigationControls
        onPrev={prevSlide}
        onNext={nextSlide}
        canGoPrev={currentSlide > 0}
        canGoNext={currentSlide < SLIDES.length - 1}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        showPlayButton={showPlayButton}
        currentSlide={currentSlide}
        totalSlides={SLIDES.length}
      />
      
      <AnimatePresence mode="wait" custom={direction}>
        {isFullScreenSlide ? (
          // Full-screen slide without wrapper padding
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <CurrentSlideComponent 
              isPlaying={isPlaying} 
              onComplete={nextSlide}
              {...(needsInternalNav && { registerNavHandler })}
            />
          </motion.div>
        ) : (
          <SlideWrapper key={currentSlide} direction={direction}>
            <CurrentSlideComponent 
              isPlaying={isPlaying} 
              onComplete={nextSlide}
              {...(needsInternalNav && { registerNavHandler })}
            />
          </SlideWrapper>
        )}
      </AnimatePresence>
      
      {/* Hide indicators on full-screen slides */}
      {!isFullScreenSlide && (
        <SlideIndicator 
          current={currentSlide} 
          total={SLIDES.length} 
          onSelect={goToSlide}
        />
      )}
      
      <ProgressBar current={currentSlide} total={SLIDES.length} />
      
      {/* Keyboard hints */}
      <div className="fixed bottom-6 right-6 text-xs text-text-muted/50 z-40">
        <span className="hidden md:inline">
          ← → Navigate · F Fullscreen · 1-9 Jump
        </span>
      </div>
    </div>
  );
}
