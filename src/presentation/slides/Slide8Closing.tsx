import { useState, useEffect, useCallback, useRef } from 'react';
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
  Smartphone,
  Users,
  Mic,
  Globe2,
  Library,
  Rocket,
  ChevronRight,
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

// Future Plans Data
const futurePlans = [
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'Native Mobile Apps',
    tagline: 'iOS & Android',
    description: 'Dedicated native apps for seamless learning on the go with push notifications and deeper OS integration.',
    color: '#4a6fa5',
    gradient: 'from-blue-500/20 to-blue-600/5',
    features: ['Push notifications', 'Offline sync', 'Native performance', 'Widget support'],
  },
  {
    id: 'srs',
    icon: Brain,
    title: 'Spaced Repetition',
    tagline: 'SRS Algorithm',
    description: 'Intelligent scheduling of quiz reviews based on memory science for maximum retention.',
    color: '#7b4b94',
    gradient: 'from-purple-500/20 to-purple-600/5',
    features: ['Optimal intervals', 'Memory tracking', 'Auto-scheduling', 'Retention scores'],
  },
  {
    id: 'collab',
    icon: Users,
    title: 'Collaborative Learning',
    tagline: 'Study Together',
    description: 'Study groups, shared learning paths, and multiplayer quiz sessions.',
    color: '#22c55e',
    gradient: 'from-green-500/20 to-green-600/5',
    features: ['Study groups', 'Shared paths', 'Live quizzes', 'Peer reviews'],
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice-Based Learning',
    tagline: 'Hands-Free',
    description: 'Voice commands, audio playback of notes, and voice answers for multitasking.',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    features: ['Voice commands', 'Audio notes', 'Voice answers', 'Podcast mode'],
  },
  {
    id: 'language',
    icon: Globe2,
    title: 'Multi-Language',
    tagline: 'Global Reach',
    description: 'Full internationalization with AI content generation in multiple languages.',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-pink-600/5',
    features: ['UI translation', 'AI in 20+ langs', 'RTL support', 'Auto-detect'],
  },
  {
    id: 'library',
    icon: Library,
    title: 'Content Library',
    tagline: 'Templates & Sharing',
    description: 'Community-shared study paths, pre-made templates, and content marketplace.',
    color: '#c2703a',
    gradient: 'from-orange-500/20 to-orange-600/5',
    features: ['Exam templates', 'Community paths', 'Import/Export', 'Curated content'],
  },
];

export default function Slide8Closing({ registerNavHandler }: SlideProps) {
  const [view, setView] = useState<'comparison' | 'future' | 'closing'>('comparison');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState(0);
  const [isPlansPaused, setIsPlansPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle internal navigation - returns true if handled internally, false to pass to parent
  const handleInternalNav = useCallback((direction: 'prev' | 'next'): boolean => {
    if (direction === 'next') {
      if (view === 'comparison') {
        setView('future');
        return true;
      }
      if (view === 'future') {
        setView('closing');
        return true;
      }
    }
    if (direction === 'prev') {
      if (view === 'closing') {
        setView('future');
        return true;
      }
      if (view === 'future') {
        setView('comparison');
        return true;
      }
    }
    return false; // Not handled, let parent navigate
  }, [view]);

  // Register the navigation handler with parent
  useEffect(() => {
    if (registerNavHandler) {
      registerNavHandler(handleInternalNav);
    }
  }, [registerNavHandler, handleInternalNav]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Auto-cycle through future plans
  useEffect(() => {
    if (view !== 'future' || isPlansPaused) return;
    
    const interval = setInterval(() => {
      setActivePlan((prev) => (prev + 1) % futurePlans.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [view, isPlansPaused]);

  // Handle plan click - pause auto-cycle
  const handlePlanClick = (index: number) => {
    setActivePlan(index);
    setIsPlansPaused(true);
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPlansPaused(false);
    }, 15000);
  };

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
          onClick={() => setView('future')}
          className={`px-6 py-2.5 rounded-full font-medium transition-all ${
            view === 'future'
              ? 'bg-accent text-white'
              : 'bg-surface border border-border text-text-soft hover:border-accent/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Future Plans
          </span>
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
        ) : view === 'future' ? (
          /* FUTURE PLANS VIEW */
          <motion.div
            key="future"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative"
          >
            {/* Floating particles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {futurePlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  className="absolute rounded-full opacity-10"
                  style={{
                    width: Math.random() * 60 + 20,
                    height: Math.random() * 60 + 20,
                    backgroundColor: plan.color,
                    left: `${10 + i * 15}%`,
                    top: `${Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 6 + i,
                    delay: i * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-4"
              >
                <Rocket className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">2026 Roadmap</span>
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>

              <h2 className="font-display text-4xl sm:text-5xl text-text mb-3">
                The Road Ahead
              </h2>
              <p className="text-lg text-text-soft max-w-xl mx-auto">
                Our vision for making Quietude the ultimate learning companion
              </p>
            </div>

            {/* Roadmap visualization */}
            <div className="hidden lg:flex items-center justify-center gap-2 mb-8 relative z-10">
              {futurePlans.map((plan, i) => (
                <div key={plan.id} className="flex items-center">
                  <motion.button
                    onClick={() => handlePlanClick(i)}
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                    style={{
                      backgroundColor: i === activePlan ? plan.color : 'transparent',
                      borderColor: i <= activePlan ? plan.color : 'var(--color-border)',
                    }}
                    animate={{
                      scale: i === activePlan ? 1.2 : 1,
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {(() => {
                      const Icon = plan.icon;
                      return (
                        <Icon 
                          className="w-5 h-5 transition-colors"
                          style={{ color: i === activePlan ? 'white' : i < activePlan ? plan.color : 'var(--color-text-muted)' }}
                        />
                      );
                    })()}
                  </motion.button>
                  {i < futurePlans.length - 1 && (
                    <motion.div 
                      className="w-8 h-0.5 mx-1"
                      style={{ 
                        backgroundColor: i < activePlan ? futurePlans[i + 1].color : 'var(--color-border)',
                      }}
                      animate={{
                        scaleX: i < activePlan ? 1 : 0.5,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {futurePlans.map((plan, index) => {
                const Icon = plan.icon;
                const isActive = index === activePlan;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePlanClick(index)}
                    className="relative cursor-pointer group"
                  >
                    {/* Glow effect */}
                    <motion.div
                      className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${plan.color}30, transparent 70%)`,
                        filter: 'blur(20px)',
                      }}
                      animate={{
                        opacity: isActive ? 0.6 : 0,
                      }}
                    />
                    
                    {/* Card */}
                    <motion.div
                      className={`relative h-full p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden
                                  ${isActive 
                                    ? 'border-accent bg-surface shadow-lg' 
                                    : 'border-border/50 bg-surface/80 hover:border-accent/50'
                                  }`}
                      whileHover={{ y: -4 }}
                    >
                      {/* Background gradient */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50 transition-opacity duration-300
                                    ${isActive ? 'opacity-100' : 'group-hover:opacity-75'}`}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Icon and Phase badge */}
                        <div className="flex items-start justify-between mb-3">
                          <motion.div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${plan.color}20` }}
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon className="w-6 h-6" style={{ color: plan.color }} />
                          </motion.div>
                          <span 
                            className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: `${plan.color}15`,
                              color: plan.color,
                            }}
                          >
                            Phase {index + 1}
                          </span>
                        </div>

                        {/* Title and tagline */}
                        <h3 className="font-display text-lg text-text mb-1">{plan.title}</h3>
                        <p className="text-xs font-medium mb-2" style={{ color: plan.color }}>{plan.tagline}</p>

                        {/* Description */}
                        <p className="text-xs text-text-soft leading-relaxed mb-3">
                          {plan.description}
                        </p>

                        {/* Features */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-1"
                            >
                              <div className="h-px bg-border/50 mb-2" />
                              <div className="grid grid-cols-2 gap-1">
                                {plan.features.map((feature, i) => (
                                  <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-1"
                                  >
                                    <ChevronRight className="w-3 h-3" style={{ color: plan.color }} />
                                    <span className="text-xs text-text-muted">{feature}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expand indicator */}
                        {!isActive && (
                          <div className="flex items-center gap-1 text-xs text-text-muted mt-1 group-hover:text-accent transition-colors">
                            <span>Click to explore</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center items-center gap-4 mt-6 relative z-10">
              <button
                onClick={() => setIsPlansPaused(!isPlansPaused)}
                className="text-xs text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-full border border-border/50 hover:border-accent/50"
              >
                {isPlansPaused ? '▶ Play' : '⏸ Pause'}
              </button>
              <div className="flex gap-2">
                {futurePlans.map((plan, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handlePlanClick(i)}
                    className="h-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: i === activePlan ? plan.color : 'var(--color-border)',
                    }}
                    animate={{ 
                      width: i === activePlan ? 24 : 10,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6 relative z-10"
            >
              <p className="text-sm text-text-muted italic">
                "The best way to predict the future is to create it."
              </p>
            </motion.div>
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
