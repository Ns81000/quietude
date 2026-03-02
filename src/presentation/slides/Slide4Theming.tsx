import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Sunrise, 
  Sunset, 
  CloudSun, 
  Moon,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

const timeThemes = [
  {
    id: 'morning',
    name: 'Morning Mist',
    time: '05:00 - 10:59',
    icon: Sunrise,
    description: 'Warm, energizing tones to start your day',
    tagline: 'Rise and learn',
    colors: { 
      bg: '#faf8f5', 
      surface: '#f5f0ea',
      accent: '#c2703a', 
      text: '#3d2c22',
      textSoft: '#6b5547',
      border: '#e8ddd2',
    },
  },
  {
    id: 'afternoon',
    name: 'Afternoon Focus',
    time: '11:00 - 15:59',
    icon: Sun,
    description: 'Clean, bright interface for peak productivity',
    tagline: 'Deep work mode',
    colors: { 
      bg: '#f8f9fa', 
      surface: '#ffffff',
      accent: '#4a6fa5', 
      text: '#1a1a2e',
      textSoft: '#5a5a7a',
      border: '#e2e8f0',
    },
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    time: '16:00 - 18:59',
    icon: Sunset,
    description: 'Warm amber transition as day winds down',
    tagline: 'Golden productivity',
    colors: { 
      bg: '#fdf6e3', 
      surface: '#fff8e7',
      accent: '#b8860b', 
      text: '#2d1f0e',
      textSoft: '#6b5530',
      border: '#e8dcc0',
    },
  },
  {
    id: 'evening',
    name: 'Evening Wind',
    time: '19:00 - 21:59',
    icon: CloudSun,
    description: 'Gentle, calming tones for relaxed study',
    tagline: 'Wind down wisely',
    colors: { 
      bg: '#f9f5f6', 
      surface: '#fff7f8',
      accent: '#9b4d6a', 
      text: '#2d1a22',
      textSoft: '#6b4555',
      border: '#e8d5da',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Study',
    time: '22:00 - 04:59',
    icon: Moon,
    description: 'Dark theme protects eyes during late sessions',
    tagline: 'Night owl mode',
    colors: { 
      bg: '#13151a', 
      surface: '#1a1d24',
      accent: '#c9a227', 
      text: '#e0d5c0',
      textSoft: '#9a9285',
      border: '#2a2d35',
    },
  },
];

export default function Slide4Theming({}: SlideProps) {
  const [activeTheme, setActiveTheme] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through themes
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveTheme((prev) => (prev + 1) % timeThemes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const theme = timeThemes[activeTheme];
  const Icon = theme.icon;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ 
        backgroundColor: theme.colors.bg,
        transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
        {/* Floating shapes in theme color */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{ 
                backgroundColor: theme.colors.accent,
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
          {/* Theme Progress Indicator */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {timeThemes.map((t, i) => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    i === activeTheme 
                      ? 'scale-110' 
                      : 'opacity-50 hover:opacity-75'
                  }`}
                  style={{ 
                    backgroundColor: i === activeTheme ? theme.colors.surface : 'transparent',
                    border: `2px solid ${i === activeTheme ? theme.colors.accent : theme.colors.border}`,
                    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <TIcon 
                    className="w-5 h-5" 
                    style={{ 
                      color: i === activeTheme ? theme.colors.accent : theme.colors.textSoft,
                      transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }} 
                  />
                  <span 
                    className="text-sm font-medium hidden sm:inline"
                    style={{ 
                      color: i === activeTheme ? theme.colors.text : theme.colors.textSoft,
                      transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {t.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{ 
                backgroundColor: theme.colors.accent + '15',
                border: `1px solid ${theme.colors.accent}40`,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: theme.colors.accent, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
              <span className="font-medium" style={{ color: theme.colors.accent, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
                Unique Feature
              </span>
            </motion.div>

            {/* Title */}
            <h1 
              className="font-display text-5xl sm:text-6xl lg:text-7xl mb-4"
              style={{ color: theme.colors.text, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              Time-Aware Theming
            </h1>

            {/* Subtitle */}
            <p 
              className="text-xl sm:text-2xl mb-10"
              style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              "Environment shapes cognition"
            </p>

            {/* Large Theme Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
              className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-3xl flex items-center justify-center mb-8 shadow-xl"
              style={{ 
                backgroundColor: theme.colors.surface,
                border: `3px solid ${theme.colors.accent}`,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Icon className="w-16 h-16 sm:w-20 sm:h-20" style={{ color: theme.colors.accent, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </motion.div>

            {/* Theme Name */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-display text-3xl sm:text-4xl mb-3"
              style={{ color: theme.colors.text, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              {theme.name}
            </motion.h2>

            {/* Time Range */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6"
              style={{ 
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Clock className="w-4 h-4" style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
              <span className="font-mono text-sm" style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {theme.time}
              </span>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg sm:text-xl max-w-2xl mx-auto"
              style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              {theme.description}
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-2xl font-display italic"
              style={{ color: theme.colors.accent, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              "{theme.tagline}"
            </motion.p>
          </motion.div>

          {/* Bottom Controls */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full"
            style={{ 
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="text-sm font-medium px-3 py-1 rounded-lg"
              style={{ 
                color: theme.colors.textSoft,
                backgroundColor: isPaused ? theme.colors.accent + '20' : 'transparent',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
            <div className="flex gap-2">
              {timeThemes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTheme(i)}
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: i === activeTheme ? 32 : 10,
                    backgroundColor: i === activeTheme ? theme.colors.accent : theme.colors.border,
                    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-mono" style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
              Auto-switching
            </span>
          </div>

          {/* Key Feature Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-sm" style={{ color: theme.colors.textSoft, transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
              Theme changes automatically based on your local time
            </p>
          </motion.div>
        </div>
      </div>
  );
}
