import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Monitor,
  Smartphone,
  Play,
  Pause,
  Upload,
  FileText,
  Brain,
  CheckCircle,
  BarChart3,
  BookOpen,
  Moon,
  Settings,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

// Screens to showcase with realistic UI mockups
const screens = [
  {
    id: 'landing',
    title: 'Landing Page',
    description: 'Clean, welcoming entry point with time-aware theming',
    desktop: {
      component: LandingMockup,
    },
    mobile: {
      component: LandingMobileMockup,
    },
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Your personalized learning hub with quick actions',
    desktop: {
      component: DashboardMockup,
    },
    mobile: {
      component: DashboardMobileMockup,
    },
  },
  {
    id: 'upload',
    title: 'Content Upload',
    description: 'Drag & drop your study materials - PDF, images, audio, text',
    desktop: {
      component: UploadMockup,
    },
    mobile: {
      component: UploadMobileMockup,
    },
  },
  {
    id: 'quiz',
    title: 'Quiz Experience',
    description: 'AI-generated questions with beautiful, focused interface',
    desktop: {
      component: QuizMockup,
    },
    mobile: {
      component: QuizMobileMockup,
    },
  },
  {
    id: 'stats',
    title: 'Statistics',
    description: 'Track your progress with intuitive visualizations',
    desktop: {
      component: StatsMockup,
    },
    mobile: {
      component: StatsMobileMockup,
    },
  },
  {
    id: 'notes',
    title: 'Study Notes',
    description: 'AI-generated notes when you need help understanding a topic',
    desktop: {
      component: NotesMockup,
    },
    mobile: {
      component: NotesMobileMockup,
    },
  },
];

// Mockup Components for Desktop
function LandingMockup() {
  return (
    <div className="h-full bg-gradient-to-b from-[#faf8f5] to-[#f5f0ea] p-6 flex flex-col">
      {/* Nav */}
      <div className="flex justify-between items-center mb-8">
        <span className="font-display text-xl text-[#3d2c22]">quietude</span>
        <div className="flex gap-4">
          <div className="px-3 py-1 text-sm text-[#6b5547]">Features</div>
          <div className="px-4 py-1 rounded-full bg-[#c2703a] text-white text-sm">Get Started</div>
        </div>
      </div>
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center text-center">
        <div>
          <div className="text-5xl font-display text-[#3d2c22] mb-4">Learn Calmly</div>
          <div className="text-lg text-[#6b5547] mb-6">Your personalized AI learning partner</div>
          <div className="flex gap-3 justify-center">
            <div className="px-5 py-2 rounded-lg bg-[#c2703a] text-white">Start Learning</div>
            <div className="px-5 py-2 rounded-lg border border-[#e8ddd2] text-[#3d2c22]">Watch Demo</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="h-full bg-[#f8f9fa] p-4 flex gap-4">
      {/* Sidebar */}
      <div className="w-48 bg-white rounded-xl p-4 border border-[#e2e8f0]">
        <div className="font-display text-lg text-[#1a1a2e] mb-6">quietude</div>
        <div className="space-y-2">
          {['Dashboard', 'Quizzes', 'Notes', 'Stats'].map((item, i) => (
            <div 
              key={item}
              className={`px-3 py-2 rounded-lg text-sm ${
                i === 0 ? 'bg-[#4a6fa5]/10 text-[#4a6fa5] font-medium' : 'text-[#5a5a7a]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      {/* Main */}
      <div className="flex-1">
        <div className="text-2xl font-display text-[#1a1a2e] mb-4">Good Afternoon</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
            <div className="text-sm text-[#5a5a7a] mb-1">Continue</div>
            <div className="text-lg font-medium text-[#1a1a2e]">Biology Ch. 4</div>
            <div className="mt-2 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-[#4a6fa5] rounded-full" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
            <div className="text-sm text-[#5a5a7a] mb-1">Today's Goal</div>
            <div className="text-3xl font-bold text-[#4a6fa5]">3/5</div>
            <div className="text-xs text-[#5a5a7a]">quizzes completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadMockup() {
  return (
    <div className="h-full bg-[#fdf6e3] p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-2xl font-display text-[#2d1f0e] mb-2 text-center">Upload Content</div>
        <div className="text-sm text-[#6b5530] mb-6 text-center">AI will generate quizzes from your materials</div>
        <div className="border-2 border-dashed border-[#b8860b]/40 rounded-xl p-8 text-center bg-white/50">
          <Upload className="w-12 h-12 text-[#b8860b] mx-auto mb-4" />
          <div className="text-[#2d1f0e] font-medium mb-2">Drop files here</div>
          <div className="text-sm text-[#6b5530]">PDF, Images, Audio, or Text</div>
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          {['PDF', 'Image', 'Audio', 'Text'].map(type => (
            <div key={type} className="px-3 py-1.5 rounded-lg bg-[#b8860b]/10 text-[#b8860b] text-xs">
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizMockup() {
  return (
    <div className="h-full bg-[#f9f5f6] p-6">
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-2 bg-[#e8d5da] rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-[#9b4d6a] rounded-full" />
          </div>
          <span className="text-sm text-[#6b4555]">7/10</span>
        </div>
        {/* Question Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8d5da] shadow-lg">
          <div className="text-lg font-medium text-[#2d1a22] mb-6">
            What is the primary function of mitochondria in cells?
          </div>
          <div className="space-y-3">
            {['Energy production', 'Protein synthesis', 'Cell division', 'Waste removal'].map((opt, i) => (
              <div 
                key={opt}
                className={`p-4 rounded-xl border-2 transition-all ${
                  i === 0 
                    ? 'border-[#9b4d6a] bg-[#9b4d6a]/10' 
                    : 'border-[#e8d5da] hover:border-[#9b4d6a]/50'
                }`}
              >
                <span className="text-[#2d1a22]">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="h-full bg-[#13151a] p-6">
      <div className="text-2xl font-display text-[#e0d5c0] mb-4">Your Progress</div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Quizzes', value: '47' },
          { label: 'Accuracy', value: '84%' },
          { label: 'Streak', value: '12d' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1a1d24] rounded-xl p-4 border border-[#2a2d35]">
            <div className="text-2xl font-bold text-[#c9a227]">{stat.value}</div>
            <div className="text-xs text-[#9a9285]">{stat.label}</div>
          </div>
        ))}
      </div>
      {/* Chart mockup */}
      <div className="bg-[#1a1d24] rounded-xl p-4 border border-[#2a2d35]">
        <div className="text-sm text-[#9a9285] mb-3">Weekly Activity</div>
        <div className="flex items-end gap-2 h-20">
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-[#c9a227] rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotesMockup() {
  return (
    <div className="h-full bg-[#f8f9fa] p-4 flex gap-4">
      {/* Sidebar */}
      <div className="w-48 bg-white rounded-xl p-4 border border-[#e2e8f0]">
        <div className="font-display text-lg text-[#1a1a2e] mb-4">Notes</div>
        <div className="space-y-2">
          {['Biology Ch. 4', 'Chemistry', 'Physics', 'Math'].map((item, i) => (
            <div 
              key={item}
              className={`px-3 py-2 rounded-lg text-sm ${
                i === 0 ? 'bg-[#4a6fa5]/10 text-[#4a6fa5] font-medium' : 'text-[#5a5a7a]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl p-5 border border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-1 rounded bg-[#4a6fa5]/10 text-[#4a6fa5] text-xs font-medium">
            AI Generated
          </div>
          <span className="text-xs text-[#5a5a7a]">Based on your learning style</span>
        </div>
        <h2 className="text-xl font-display text-[#1a1a2e] mb-3">Mitochondria: The Powerhouse</h2>
        <div className="space-y-3 text-sm text-[#5a5a7a]">
          <p><strong className="text-[#1a1a2e]">Key Point:</strong> Mitochondria generate ATP through cellular respiration.</p>
          <p><strong className="text-[#1a1a2e]">Remember:</strong> They have their own DNA, inherited maternally.</p>
          <div className="p-3 rounded-lg bg-[#4a6fa5]/5 border border-[#4a6fa5]/20">
            <p className="text-xs text-[#4a6fa5] font-medium mb-1">Quick Tip</p>
            <p className="text-xs">Think of mitochondria as tiny power plants inside each cell.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Mockups
function LandingMobileMockup() {
  return (
    <div className="h-full bg-gradient-to-b from-[#faf8f5] to-[#f5f0ea] pt-8 px-4 pb-4 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <span className="font-display text-lg text-[#3d2c22]">quietude</span>
        <div className="w-6 h-5 flex flex-col gap-1">
          <div className="h-0.5 bg-[#3d2c22]" />
          <div className="h-0.5 bg-[#3d2c22]" />
          <div className="h-0.5 bg-[#3d2c22]" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-center">
        <div>
          <div className="text-3xl font-display text-[#3d2c22] mb-3">Learn Calmly</div>
          <div className="text-sm text-[#6b5547] mb-4">Your AI learning partner</div>
          <div className="px-4 py-2 rounded-lg bg-[#c2703a] text-white text-sm inline-block">
            Start Learning
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMobileMockup() {
  return (
    <div className="h-full bg-[#f8f9fa] pt-8 px-4 pb-4">
      <div className="text-xl font-display text-[#1a1a2e] mb-4">Good Afternoon</div>
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
          <div className="text-xs text-[#5a5a7a] mb-1">Continue</div>
          <div className="font-medium text-[#1a1a2e]">Biology Ch. 4</div>
          <div className="mt-2 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-[#4a6fa5] rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
            <div className="text-2xl font-bold text-[#4a6fa5]">3/5</div>
            <div className="text-xs text-[#5a5a7a]">Today</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
            <div className="text-2xl font-bold text-[#4a6fa5]">12</div>
            <div className="text-xs text-[#5a5a7a]">Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadMobileMockup() {
  return (
    <div className="h-full bg-[#fdf6e3] pt-8 px-4 pb-4 flex flex-col items-center justify-center">
      <Upload className="w-10 h-10 text-[#b8860b] mb-3" />
      <div className="text-lg font-display text-[#2d1f0e] mb-1">Upload</div>
      <div className="text-xs text-[#6b5530] mb-4 text-center">Drop your files</div>
      <div className="border-2 border-dashed border-[#b8860b]/40 rounded-xl p-6 bg-white/50 w-full">
        <div className="text-center text-sm text-[#6b5530]">Tap to browse</div>
      </div>
    </div>
  );
}

function QuizMobileMockup() {
  return (
    <div className="h-full bg-[#f9f5f6] pt-8 px-4 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-[#e8d5da] rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-[#9b4d6a] rounded-full" />
        </div>
        <span className="text-xs text-[#6b4555]">7/10</span>
      </div>
      <div className="bg-white rounded-xl p-4 border border-[#e8d5da]">
        <div className="text-sm font-medium text-[#2d1a22] mb-4">
          What is the function of mitochondria?
        </div>
        <div className="space-y-2">
          {['Energy', 'Protein', 'Division'].map((opt, i) => (
            <div 
              key={opt}
              className={`p-3 rounded-lg border text-sm ${
                i === 0 ? 'border-[#9b4d6a] bg-[#9b4d6a]/10' : 'border-[#e8d5da]'
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsMobileMockup() {
  return (
    <div className="h-full bg-[#13151a] pt-8 px-4 pb-4">
      <div className="text-lg font-display text-[#e0d5c0] mb-3">Progress</div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: 'Quizzes', value: '47' },
          { label: 'Accuracy', value: '84%' },
          { label: 'Streak', value: '12d' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1a1d24] rounded-lg p-1.5 border border-[#2a2d35] text-center overflow-hidden">
            <div className="text-base font-bold text-[#c9a227]">{stat.value}</div>
            <div className="text-[8px] text-[#9a9285] truncate">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#1a1d24] rounded-lg p-3 border border-[#2a2d35]">
        <div className="flex items-end gap-1 h-16">
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-[#c9a227] rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotesMobileMockup() {
  return (
    <div className="h-full bg-[#f8f9fa] pt-8 px-4 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="px-2 py-0.5 rounded bg-[#4a6fa5]/10 text-[#4a6fa5] text-[10px] font-medium">
          AI Generated
        </div>
      </div>
      <h2 className="text-base font-display text-[#1a1a2e] mb-2">Mitochondria</h2>
      <div className="bg-white rounded-xl p-3 border border-[#e2e8f0] space-y-2">
        <p className="text-xs text-[#5a5a7a]">
          <strong className="text-[#1a1a2e]">Key:</strong> Generates ATP
        </p>
        <p className="text-xs text-[#5a5a7a]">
          <strong className="text-[#1a1a2e]">Note:</strong> Has own DNA
        </p>
        <div className="p-2 rounded-lg bg-[#4a6fa5]/5 border border-[#4a6fa5]/20">
          <p className="text-[10px] text-[#4a6fa5]">Think: tiny power plants</p>
        </div>
      </div>
    </div>
  );
}

export default function Slide7ProductShowcase({}: SlideProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle manual screen click - pause for 25 seconds then resume
  const handleScreenClick = (index: number) => {
    setCurrentScreen(index);
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

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const screen = screens[currentScreen];
  const DesktopComponent = screen.desktop.component;
  const MobileComponent = screen.mobile.component;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl sm:text-4xl text-text mb-2"
        >
          Product Walkthrough
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-text-soft"
        >
          Experience the flow
        </motion.p>
      </div>

      {/* Screen Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {screens.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleScreenClick(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              i === currentScreen
                ? 'bg-accent text-white scale-105'
                : 'bg-surface border border-border text-text-soft hover:border-accent/50'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Device Frames */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex items-end gap-6"
          >
            {/* Desktop Frame */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-text-muted" />
                <span className="text-sm text-text-muted">Desktop</span>
              </div>
              <div className="relative">
                {/* Browser Chrome */}
                <div className="bg-[#e5e5e5] rounded-t-xl px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500">
                      quietude.vercel.app
                    </div>
                  </div>
                </div>
                {/* Screen Content */}
                <div 
                  className="w-[600px] h-[360px] bg-white rounded-b-xl overflow-hidden shadow-2xl"
                  style={{ minWidth: 600 }}
                >
                  <DesktopComponent />
                </div>
              </div>
            </div>

            {/* Mobile Frame */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-5 h-5 text-text-muted" />
                <span className="text-sm text-text-muted">Mobile</span>
              </div>
              <div className="relative">
                {/* Phone Frame */}
                <div className="bg-[#1a1a1a] rounded-[2.5rem] p-2 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-full z-10" />
                  {/* Screen */}
                  <div className="w-[180px] h-[360px] bg-white rounded-[2rem] overflow-hidden">
                    <MobileComponent />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Info & Controls */}
      <div className="mt-6 text-center">
        <motion.div
          key={screen.id + '-info'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h3 className="text-xl font-display text-text">{screen.title}</h3>
          <p className="text-text-soft">{screen.description}</p>
        </motion.div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleScreenClick((currentScreen - 1 + screens.length) % screens.length)}
            className="p-2 rounded-lg bg-surface border border-border hover:border-accent/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-soft" />
          </button>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 rounded-xl bg-accent text-white hover:opacity-90 transition-opacity"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => handleScreenClick((currentScreen + 1) % screens.length)}
            className="p-2 rounded-lg bg-surface border border-border hover:border-accent/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-soft" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => handleScreenClick(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentScreen ? 'w-8 bg-accent' : 'w-2 bg-border hover:bg-accent/50'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
