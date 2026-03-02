import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Github,
  Globe,
  Brain,
  Upload,
  Palette,
  WifiOff,
  Shield,
  Zap,
  FileText,
  Youtube,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
  registerNavHandler?: (handler: (direction: 'prev' | 'next') => boolean) => void;
}

// Quietude Logo SVG Component (clean Q)
function QuietudeLogo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32"
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient-closing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#c26838' }} />
          <stop offset="100%" style={{ stopColor: '#a85a32' }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#logo-gradient-closing)" />
      <text 
        x="16" 
        y="23" 
        fontFamily="Georgia, serif" 
        fontSize="22" 
        fontWeight="500"
        fill="#ffffff" 
        textAnchor="middle"
        fontStyle="italic"
      >Q</text>
    </svg>
  );
}

const competitors = [
  {
    id: 'quizlet',
    name: 'Quizlet',
    logoImage: '/quizlet.png',
    features: {
      aiFromYourContent: false,
      youtubeTranscript: false,
      customQuizGeneration: false,
      notesGeneration: true,
      offlineFirst: false,
      calmDesign: false,
    },
    cons: ['Pre-made content only', 'Subscription required', 'Ads in free tier'],
  },
  {
    id: 'anki',
    name: 'Anki',
    logoImage: '/anki.png',
    features: {
      aiFromYourContent: false,
      youtubeTranscript: false,
      customQuizGeneration: false,
      notesGeneration: false,
      offlineFirst: true,
      calmDesign: false,
    },
    cons: ['Steep learning curve', 'Manual card creation', 'Outdated UI'],
  },
  {
    id: 'notion',
    name: 'Notion',
    logoImage: '/Notion.png',
    features: {
      aiFromYourContent: false,
      youtubeTranscript: false,
      customQuizGeneration: false,
      notesGeneration: true,
      offlineFirst: true,
      calmDesign: true,
    },
    cons: ['Not study-focused', 'No quiz generation', 'Limited offline'],
  },
  {
    id: 'kahoot',
    name: 'Kahoot',
    logoImage: '/kahoot.png',
    features: {
      aiFromYourContent: false,
      youtubeTranscript: false,
      customQuizGeneration: false,
      notesGeneration: false,
      offlineFirst: false,
      calmDesign: false,
    },
    cons: ['Gamification overload', 'Group-focused only', 'No personal study'],
  },
  {
    id: 'revision',
    name: 'Re-vision',
    logoImage: '/revision.svg',
    features: {
      aiFromYourContent: true,
      youtubeTranscript: true,
      customQuizGeneration: true,
      notesGeneration: false,
      offlineFirst: false,
      calmDesign: false,
    },
    cons: ['Requires account', 'No offline support', 'Gamification (confetti)'],
  },
];

const features = [
  { key: 'aiFromYourContent', label: 'AI from YOUR content', icon: Brain },
  { key: 'youtubeTranscript', label: 'YouTube Learning', icon: Youtube },
  { key: 'customQuizGeneration', label: 'Custom Quiz Generation', icon: Zap },
  { key: 'notesGeneration', label: 'AI Notes Generation', icon: FileText },
  { key: 'offlineFirst', label: 'Offline-First PWA', icon: WifiOff },
  { key: 'calmDesign', label: 'Calm, focused design', icon: Sparkles },
];

const quietudeFeatures = {
  aiFromYourContent: true,
  youtubeTranscript: true,
  customQuizGeneration: true,
  notesGeneration: true,
  offlineFirst: true,
  calmDesign: true,
};

export default function Slide8Closing({ registerNavHandler }: SlideProps) {
  const [view, setView] = useState<'comparison' | 'closing'>('comparison');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);

  // Handle internal navigation - returns true if handled internally, false to pass to parent
  const handleInternalNav = useCallback((direction: 'prev' | 'next'): boolean => {
    if (direction === 'next' && view === 'comparison') {
      // On comparison tab, pressing right goes to closing
      setView('closing');
      return true; // Handled internally
    }
    if (direction === 'prev' && view === 'closing') {
      // On closing tab, pressing left goes to comparison
      setView('comparison');
      return true; // Handled internally
    }
    return false; // Not handled, let parent navigate
  }, [view]);

  // Register the navigation handler with parent
  useEffect(() => {
    if (registerNavHandler) {
      registerNavHandler(handleInternalNav);
    }
  }, [registerNavHandler, handleInternalNav]);

  // Auto-switch to closing view after some time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'comparison') {
        // Optional: auto-switch
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [view]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto"
    >
      {/* View Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setView('comparison')}
          className={`px-6 py-2.5 rounded-full font-medium transition-all ${
            view === 'comparison'
              ? 'bg-accent text-white'
              : 'bg-surface border border-border text-text-soft hover:border-accent/50'
          }`}
        >
          Why Quietude?
        </button>
        <button
          onClick={() => setView('closing')}
          className={`px-6 py-2.5 rounded-full font-medium transition-all ${
            view === 'closing'
              ? 'bg-accent text-white'
              : 'bg-surface border border-border text-text-soft hover:border-accent/50'
          }`}
        >
          Get Started
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'comparison' ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-display text-4xl sm:text-5xl text-text mb-3">
                What Makes Us Different
              </h2>
              <p className="text-text-soft text-lg">
                A detailed comparison with popular alternatives
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                {/* Table Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  <div className="col-span-1" /> {/* Feature column */}
                  
                  {/* Quietude Column Header */}
                  <div className="col-span-1 text-center">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="inline-flex flex-col items-center gap-2 px-4 py-3 rounded-xl 
                                 bg-accent/10 border-2 border-accent"
                    >
                      <QuietudeLogo className="w-12 h-12" />
                      <span className="font-medium text-accent">Quietude</span>
                    </motion.div>
                  </div>
                  
                  {/* Competitor Column Headers */}
                  {competitors.map((comp) => (
                    <div key={comp.id} className="col-span-1 text-center">
                      <div className="inline-flex flex-col items-center gap-2 px-4 py-3 rounded-xl 
                                      bg-surface border border-border">
                        <img 
                          src={comp.logoImage}
                          alt={comp.name}
                          className="w-12 h-12 rounded-xl object-contain"
                        />
                        <span className="font-medium text-text-soft">{comp.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Rows */}
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  const isHighlighted = highlightedFeature === feature.key;
                  
                  return (
                    <motion.div
                      key={feature.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onMouseEnter={() => setHighlightedFeature(feature.key)}
                      onMouseLeave={() => setHighlightedFeature(null)}
                      className={`grid grid-cols-7 gap-2 py-3 px-4 rounded-xl mb-2 transition-all ${
                        isHighlighted ? 'bg-accent/5' : ''
                      }`}
                    >
                      {/* Feature Name */}
                      <div className="col-span-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isHighlighted ? 'bg-accent/20' : 'bg-surface'
                        }`}>
                          <Icon className={`w-4 h-4 ${isHighlighted ? 'text-accent' : 'text-text-soft'}`} />
                        </div>
                        <span className={`text-sm font-medium ${
                          isHighlighted ? 'text-text' : 'text-text-soft'
                        }`}>
                          {feature.label}
                        </span>
                      </div>

                      {/* Quietude */}
                      <div className="col-span-1 flex justify-center items-center">
                        {quietudeFeatures[feature.key as keyof typeof quietudeFeatures] ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-emerald-500" />
                          </motion.div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <X className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Competitors */}
                      {competitors.map((comp) => (
                        <div key={comp.id} className="col-span-1 flex justify-center items-center">
                          {comp.features[feature.key as keyof typeof comp.features] ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center">
                              <X className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  );
                })}

                {/* Summary Row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-7 gap-2 py-4 px-4 mt-4 rounded-xl bg-surface border border-border"
                >
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-medium text-text">Total Features</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className="text-2xl font-bold text-emerald-500">6/6</span>
                  </div>
                  {competitors.map((comp) => {
                    const count = Object.values(comp.features).filter(Boolean).length;
                    return (
                      <div key={comp.id} className="col-span-1 flex justify-center">
                        <span className={`text-2xl font-bold ${
                          count >= 3 ? 'text-amber-500' : 'text-red-400'
                        }`}>
                          {count}/6
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="closing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            {/* Philosophy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text mb-6">
                Built for Focus.
                <br />
                <span className="text-accent">Designed for Calm.</span>
              </h2>
              <p className="text-xl text-text-soft max-w-2xl mx-auto">
                "Learning should feel like a gentle stream, not a raging torrent."
              </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto"
            >
              {[
                { value: '5', label: 'Time-based themes' },
                { value: '3', label: 'Quiz types' },
                { value: '100%', label: 'Offline capable' },
                { value: '0', label: 'Distractions' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-4 rounded-xl bg-surface border border-border"
                >
                  <div className="text-3xl font-bold text-accent">{stat.value}</div>
                  <div className="text-sm text-text-soft">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="https://quietude-one.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-accent text-white font-medium text-lg
                           hover:opacity-90 transition-all shadow-lg shadow-accent/20"
              >
                <Globe className="w-5 h-5" />
                Try Quietude
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Ns81000/quietude"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-surface border border-border text-text font-medium text-lg
                           hover:border-accent/50 transition-all"
              >
                <Github className="w-5 h-5" />
                View Source
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Thank You */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12"
            >
              <p className="text-text-muted">
                Thank you for your attention
              </p>
              <p className="font-display text-2xl text-accent mt-2">
                Questions?
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
