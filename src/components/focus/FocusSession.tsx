import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, Volume1, VolumeX, Loader2, Keyboard, Palette, Check } from 'lucide-react';
import { useFocusStore } from '@/store/focus';
import { useFocusHistoryStore } from '@/store/focusHistory';
import { getSoundById } from '@/lib/focus/audioData';
import { useFocusAudio } from '@/hooks/useFocusAudio';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type MoodTheme, THEME_LABELS, getTimeTheme, applyTheme, persistMood } from '@/lib/theme';
import { useUIStore } from '@/store/ui';
import { HiddenAudioCards } from './HiddenAudioCards';

export function FocusSession() {
  const navigate = useNavigate();
  const {
    duration,
    remainingTime,
    isActive,
    isPaused,
    selectedSounds,
    globalVolume,
    soundVolumes,
    setGlobalVolume,
    setSoundVolume,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    tick
  } = useFocusStore();
  
  const { isLoading, hasErrors, fadeOut, getAudioLevel } = useFocusAudio();
  const { startSession: startHistorySession, endSession: endHistorySession } = useFocusHistoryStore();
  const { activeMood, setMood } = useUIStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Timer logic
  useEffect(() => {
    if (!isActive) {
      const id = startHistorySession(duration, selectedSounds);
      setSessionId(id);
      startSession();
    }
  }, [isActive, startSession, duration, selectedSounds, startHistorySession]);
  
  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        tick();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, tick]);
  
  // Check if session is complete
  useEffect(() => {
    if (remainingTime === 0 && isActive) {
      fadeOut(3000);
      toast.success('Focus session complete! Great work! 🎉');
      setTimeout(() => {
        handleEnd();
      }, 3000);
    }
  }, [remainingTime, isActive, fadeOut]);
  
  // Update audio level for visualizer
  useEffect(() => {
    if (!isPaused && isActive) {
      const interval = setInterval(() => {
        setAudioLevel(getAudioLevel());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPaused, isActive, getAudioLevel]);
  
  // Callback functions - defined before keyboard shortcuts
  const handleEnd = useCallback(() => {
    if (sessionId) {
      endHistorySession(sessionId, remainingTime === 0);
    }
    fadeOut(1000);
    setTimeout(() => {
      endSession();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      navigate('/dashboard');
    }, 1000);
  }, [sessionId, remainingTime, endHistorySession, fadeOut, endSession, navigate]);
  
  const handlePlayPause = useCallback(() => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [isPaused, resumeSession, pauseSession]);
  
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  }, []);
  
  const handleThemeSelect = useCallback((mood: MoodTheme | null) => {
    setMood(mood);
    persistMood(mood);
    if (!mood) {
      applyTheme(getTimeTheme());
    } else {
      applyTheme(mood);
    }
    setShowThemeSelector(false);
  }, [setMood]);
  
  // Cycle through themes with keyboard shortcut
  const cycleTheme = useCallback(() => {
    const themes: (MoodTheme | null)[] = [null, 'sage', 'storm', 'sand', 'plum', 'golden-glow', 'morning-mist', 'midnight'];
    const currentIndex = themes.indexOf(activeMood);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    handleThemeSelect(nextTheme);
    
    // Show toast with theme name
    const themeName = nextTheme ? THEME_LABELS[nextTheme] : 'Auto (Time-based)';
    toast.success(`Theme: ${themeName}`, { duration: 1500 });
  }, [activeMood, handleThemeSelect]);
  
  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: ' ',
      callback: handlePlayPause,
      description: 'Play/Pause'
    },
    {
      key: 'f',
      callback: toggleFullscreen,
      description: 'Toggle Fullscreen'
    },
    {
      key: 'Escape',
      callback: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          handleEnd();
        }
      },
      description: 'Exit'
    },
    {
      key: 'ArrowUp',
      callback: () => setGlobalVolume(Math.min(1, globalVolume + 0.1)),
      description: 'Volume Up'
    },
    {
      key: 'ArrowDown',
      callback: () => setGlobalVolume(Math.max(0, globalVolume - 0.1)),
      description: 'Volume Down'
    },
    {
      key: 'm',
      callback: () => setGlobalVolume(globalVolume === 0 ? 0.7 : 0),
      description: 'Mute/Unmute'
    },
    {
      key: 't',
      callback: cycleTheme,
      description: 'Cycle Theme'
    },
    {
      key: '?',
      shift: true,
      callback: () => setShowShortcuts(!showShortcuts),
      description: 'Show Shortcuts'
    }
  ], true);
  
  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Auto-hide controls after 2 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }
      
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 2000);
      
      setMouseIdleTimer(timer);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }
    };
  }, [mouseIdleTimer]);
  
  const handleBack = useCallback(() => {
    if (sessionId) {
      endHistorySession(sessionId, false);
    }
    // Immediate navigation without fade - much faster
    endSession();
    const setStep = useFocusStore.getState().setStep;
    setStep('audio');
  }, [sessionId, endHistorySession, endSession]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progress = ((duration - remainingTime) / duration) * 100;
  
  // Get volume icon
  const getVolumeIcon = () => {
    if (globalVolume === 0) return <VolumeX size={20} />;
    if (globalVolume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-b from-bg via-bg to-bg-2">
      {/* Hidden AudioCards to maintain audio playback */}
      <HiddenAudioCards />
      
      {/* ═══ Beautiful Flowing Background ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden">

        {/* Flowing wave layers at bottom - enhanced and more visible */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none">
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: '100%' }}
          >
            {/* Wave 1 - Deepest layer */}
            <motion.path
              initial={{ d: 'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z' }}
              d="M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z"
              fill="hsl(var(--accent) / 0.15)"
              animate={{
                d: [
                  'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                  'M0,180 C240,140 480,240 720,200 C960,160 1200,220 1440,180 L1440,320 L0,320 Z',
                  'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Wave 2 */}
            <motion.path
              initial={{ d: 'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z' }}
              d="M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z"
              fill="hsl(var(--accent) / 0.20)"
              animate={{
                d: [
                  'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                  'M0,235 C320,260 640,210 960,245 C1120,255 1280,225 1440,242 L1440,320 L0,320 Z',
                  'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
            
            {/* Wave 3 */}
            <motion.path
              initial={{ d: 'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z' }}
              d="M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z"
              fill="hsl(var(--accent) / 0.28)"
              animate={{
                d: [
                  'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                  'M0,260 C180,278 420,248 720,270 C1020,282 1260,255 1440,268 L1440,320 L0,320 Z',
                  'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            
            {/* Wave 4 - Top layer */}
            <motion.path
              initial={{ d: 'M0,290 C360,278 720,298 1080,285 C1260,278 1380,292 1440,288 L1440,320 L0,320 Z' }}
              d="M0,290 C360,278 720,298 1080,285 C1260,278 1380,292 1440,288 L1440,320 L0,320 Z"
              fill="hsl(var(--accent) / 0.35)"
              animate={{
                d: [
                  'M0,290 C360,278 720,298 1080,285 C1260,278 1380,292 1440,288 L1440,320 L0,320 Z',
                  'M0,286 C360,296 720,280 1080,292 C1260,298 1380,282 1440,290 L1440,320 L0,320 Z',
                  'M0,290 C360,278 720,298 1080,285 C1260,278 1380,292 1440,288 L1440,320 L0,320 Z',
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </svg>
        </div>

        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* Back Button - Auto-hide (z-10 to stay above background layers) */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleBack}
            className="absolute top-4 left-4 md:top-8 md:left-8 z-20 group touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            title="Go Back"
            aria-label="Go back to sound selection"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-surface hover:border-border hover:shadow-xl active:scale-95 transition-all duration-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-soft group-hover:text-text transition-colors">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm text-text-soft group-hover:text-text hidden md:inline transition-colors">Back</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Bottom Controls - Keyboard Shortcuts + Theme Selector */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex gap-2 z-20"
          >
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-surface hover:border-border hover:shadow-xl active:scale-95 transition-all duration-200 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              title="Keyboard Shortcuts"
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard size={20} className="text-text-soft" />
            </button>
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="p-2.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-surface hover:border-border hover:shadow-xl active:scale-95 transition-all duration-200 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              title="Change Theme"
              aria-label="Change theme"
            >
              <Palette size={20} className="text-text-soft" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-20"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border"
            >
              <h3 className="text-xl font-display font-semibold mb-4 text-text">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'Space', desc: 'Play/Pause' },
                  { key: 'F', desc: 'Toggle Fullscreen' },
                  { key: 'Esc', desc: 'Exit Session' },
                  { key: '↑', desc: 'Volume Up' },
                  { key: '↓', desc: 'Volume Down' },
                  { key: 'M', desc: 'Mute/Unmute' },
                  { key: 'T', desc: 'Cycle Theme' },
                  { key: '?', desc: 'Show Shortcuts' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-text-soft">{desc}</span>
                    <kbd className="px-2 py-1 bg-bg-2 rounded text-sm font-mono text-text">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowShortcuts(false)}
                className="w-full mt-4"
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-20"
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border"
            >
              <h3 className="text-xl font-display font-semibold mb-4 text-text">
                Choose Theme
              </h3>
              <div className="space-y-2">
                {/* Auto Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleThemeSelect(null)}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 touch-manipulation active:scale-[0.98]
                    ${
                      !activeMood
                        ? 'bg-accent text-accent-text shadow-lg'
                        : 'bg-bg-2 text-text-soft hover:text-text hover:bg-bg-2/80 active:bg-bg-2/60'
                    }`}
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Auto theme (time-based)"
                  aria-pressed={!activeMood}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent/60 to-accent opacity-80" />
                    <span className="font-medium">Auto (Time-based)</span>
                  </div>
                  {!activeMood && <Check size={18} />}
                </motion.button>

                {/* Theme Buttons */}
                {(['sage', 'storm', 'sand', 'plum', 'golden-glow', 'morning-mist', 'midnight'] as MoodTheme[]).map((mood, index) => {
                  const colors: Record<MoodTheme, string> = {
                    sage: '#4A7A38',
                    storm: '#3058A0',
                    sand: '#8A6840',
                    plum: '#703888',
                    'golden-glow': '#d97706',
                    'morning-mist': '#C2704F',
                    midnight: '#10141a',
                  };
                  
                  return (
                    <motion.button
                      key={mood}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.05 }}
                      onClick={() => handleThemeSelect(mood)}
                      className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 touch-manipulation active:scale-[0.98]
                        ${
                          activeMood === mood
                            ? 'bg-accent text-accent-text shadow-lg'
                            : 'bg-bg-2 text-text-soft hover:text-text hover:bg-bg-2/80 active:bg-bg-2/60'
                        }`}
                      style={{ touchAction: 'manipulation' }}
                      aria-label={`${THEME_LABELS[mood]} theme`}
                      aria-pressed={activeMood === mood}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2"
                          style={{
                            backgroundColor: colors[mood],
                            borderColor: activeMood === mood ? 'currentColor' : 'transparent',
                          }}
                        />
                        <span className="font-medium">{THEME_LABELS[mood]}</span>
                      </div>
                      {activeMood === mood && <Check size={18} />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 backdrop-blur-sm z-20">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span className="text-sm text-text-soft">Loading sounds...</span>
        </div>
      )}
      
      {/* Exit Button - Auto-hide */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={handleEnd}
            className="absolute top-4 right-4 md:top-8 md:right-8 z-20 group touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            title="Exit Session"
            aria-label="Exit focus session"
          >
            <div className="p-2.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-surface hover:border-border hover:shadow-xl active:scale-95 transition-all duration-200">
              <X size={20} className="text-text-soft group-hover:text-text transition-colors" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl space-y-12 text-center relative z-10"
      >
        {/* Timer Display */}
        <div className="space-y-4 relative">
          {/* Audio-reactive glow halo behind the timer */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full pointer-events-none -z-10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.25), hsl(var(--accent) / 0.08), transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{
              scale: isPaused ? [1, 1.05, 1] : [1 + audioLevel * 0.3, 1.05 + audioLevel * 0.4, 1 + audioLevel * 0.3],
              opacity: isPaused ? [0.3, 0.4, 0.3] : [0.4 + audioLevel * 0.3, 0.6 + audioLevel * 0.2, 0.4 + audioLevel * 0.3],
            }}
            transition={{
              duration: isPaused ? 4 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <div className="font-display text-8xl md:text-9xl text-accent font-bold tracking-tight">
            {formatTime(remainingTime)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-bg-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* Audio Visualizer */}
        <div className="flex items-center justify-center gap-1 h-16">
          {Array.from({ length: 40 }).map((_, i) => {
            const baseHeight = 4;
            const maxHeight = 60;
            const animatedHeight = !isPaused && isActive 
              ? baseHeight + (audioLevel * maxHeight * (0.5 + Math.random() * 0.5))
              : baseHeight;
            
            return (
              <motion.div
                key={i}
                className="w-1 bg-accent/60 rounded-full"
                animate={!isPaused && isActive ? {
                  height: [
                    animatedHeight * 0.8,
                    animatedHeight,
                    animatedHeight * 0.9,
                  ],
                } : { height: baseHeight }}
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
        
        {/* Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  className="w-16 h-16 rounded-full p-0 touch-manipulation shadow-xl hover:shadow-2xl active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                  aria-label={isPaused ? 'Resume session' : 'Pause session'}
                >
                  {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </Button>
              </div>
              
              {/* Volume Control */}
              <div className="space-y-4 max-w-md mx-auto">
                {/* Global Volume */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowVolumeControls(!showVolumeControls)}
                    className="text-text-soft hover:text-text active:text-accent transition-all duration-200 touch-manipulation active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                    aria-label={showVolumeControls ? 'Hide individual volume controls' : 'Show individual volume controls'}
                    aria-expanded={showVolumeControls}
                  >
                    {getVolumeIcon()}
                  </button>
                  <Slider
                    value={[globalVolume * 100]}
                    onValueChange={(value) => setGlobalVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-text-soft w-12 text-right">
                    {Math.round(globalVolume * 100)}%
                  </span>
                </div>
                
                {/* Per-Sound Volume Controls */}
                {showVolumeControls && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2 border-t border-border/30"
                  >
                    {selectedSounds.map(soundId => {
                      const sound = getSoundById(soundId);
                      if (!sound) return null;
                      
                      const volume = soundVolumes[soundId] ?? 0.5;
                      
                      return (
                        <div key={soundId} className="flex items-center gap-3">
                          <span className="text-lg">{sound.icon}</span>
                          <span className="text-xs text-text-soft flex-1 truncate">
                            {sound.label}
                          </span>
                          <Slider
                            value={[volume * 100]}
                            onValueChange={(value) => setSoundVolume(soundId, value[0] / 100)}
                            max={100}
                            step={1}
                            className="w-24"
                          />
                          <span className="text-xs text-text-soft w-8 text-right">
                            {Math.round(volume * 100)}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
              
              {/* Selected Sounds */}
              <div className="flex flex-wrap justify-center gap-2">
                {selectedSounds.map(soundId => {
                  const sound = getSoundById(soundId);
                  return sound ? (
                    <div
                      key={soundId}
                      className="px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm text-sm text-text-soft flex items-center gap-2"
                    >
                      <span className="text-base">{sound.icon}</span>
                      {sound.label}
                    </div>
                  ) : null;
                })}
              </div>
              
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="text-sm text-text-soft hover:text-text active:text-accent transition-all duration-200 touch-manipulation active:scale-95"
                style={{ touchAction: 'manipulation' }}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
