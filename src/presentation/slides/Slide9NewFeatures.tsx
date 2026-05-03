import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Focus,
  Volume2,
  Sparkles,
  Clock,
  Palette,
  Waves,
  Headphones,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

export default function Slide9NewFeatures({}: SlideProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [focusTime, setFocusTime] = useState(25 * 60); // 25 minutes in seconds

  // Simulate audio level for focus mode
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.6 + 0.2);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Working timer for focus mode
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusTime((prev) => {
        if (prev <= 0) return 25 * 60; // Reset to 25 minutes
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#13151a]">
      {/* Focus Mode Screen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 flex items-center justify-center"
      >
            {/* Focus Mode Background - Midnight Theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#13151a] via-[#13151a] to-[#1a1d24]" />
            
            {/* Flowing Waves */}
            <div className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none opacity-80">
              <svg
                className="absolute bottom-0 w-full"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                style={{ height: '100%' }}
              >
                <motion.path
                  d="M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.15)"
                  animate={{
                    d: [
                      'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                      'M0,180 C240,140 480,240 720,200 C960,160 1200,220 1440,180 L1440,320 L0,320 Z',
                      'M0,200 C240,260 480,140 720,180 C960,220 1200,150 1440,190 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.20)"
                  animate={{
                    d: [
                      'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                      'M0,235 C320,260 640,210 960,245 C1120,255 1280,225 1440,242 L1440,320 L0,320 Z',
                      'M0,240 C320,200 640,270 960,235 C1120,220 1280,250 1440,238 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />
                <motion.path
                  d="M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z"
                  fill="rgba(201, 162, 39, 0.28)"
                  animate={{
                    d: [
                      'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                      'M0,260 C180,278 420,248 720,270 C1020,282 1260,255 1440,268 L1440,320 L0,320 Z',
                      'M0,268 C180,250 420,285 720,262 C1020,240 1260,275 1440,260 L1440,320 L0,320 Z',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              </svg>
            </div>

            {/* Audio-reactive glow */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 162, 39, 0.25), rgba(201, 162, 39, 0.08), transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                scale: [1 + audioLevel * 0.3, 1.05 + audioLevel * 0.4, 1 + audioLevel * 0.3],
                opacity: [0.4 + audioLevel * 0.3, 0.6 + audioLevel * 0.2, 0.4 + audioLevel * 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Content - Grid Layout */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="grid grid-cols-12 gap-8 w-full max-w-7xl">
                
                {/* Left Column - Feature Cards */}
                <div className="col-span-4 flex flex-col gap-6">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full self-start"
                    style={{ 
                      backgroundColor: 'rgba(201, 162, 39, 0.15)',
                      border: '1px solid rgba(201, 162, 39, 0.4)',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-[#c9a227]" />
                    <span className="font-medium text-[#c9a227]">New Feature</span>
                  </motion.div>

                  {/* Feature Card 1 - Time-Aware Theming */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Palette className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Time-Aware Theming</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Automatically adapts to your local time with 5 unique themes from morning mist to midnight study mode
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 2 - Ambient Soundscapes */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Ambient Soundscapes</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Mix multiple nature sounds, white noise, and ambient audio with individual volume controls
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature Card 3 - Pomodoro Timer */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-[#c9a227]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e0d5c0] mb-2">Flexible Timer</h3>
                        <p className="text-sm text-[#9a9285] leading-relaxed">
                          Customizable focus sessions with session history tracking and completion statistics
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Center Column - Timer & Visualizer */}
                <div className="col-span-4 flex flex-col items-center justify-center gap-8">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Focus className="w-8 h-8 text-[#c9a227]" />
                      <h2 className="font-display text-4xl text-[#e0d5c0]">Focus Mode</h2>
                    </div>
                    <p className="text-base text-[#9a9285]">
                      Deep work environment
                    </p>
                  </motion.div>

                  {/* Timer */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="font-display text-8xl text-[#c9a227] font-bold tracking-tight"
                  >
                    {formatTime(focusTime)}
                  </motion.div>

                  {/* Audio Visualizer */}
                  <div className="flex items-center justify-center gap-1 h-20">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const baseHeight = 4;
                      const maxHeight = 70;
                      const animatedHeight = baseHeight + (audioLevel * maxHeight * (0.5 + Math.random() * 0.5));
                      
                      return (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-[#c9a227]/60 rounded-full"
                          animate={{
                            height: [
                              animatedHeight * 0.8,
                              animatedHeight,
                              animatedHeight * 0.9,
                            ],
                          }}
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

                  {/* Volume Control */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-4 w-full max-w-xs"
                  >
                    <Volume2 className="w-5 h-5 text-[#9a9285]" />
                    <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden border border-[#2a2d35]">
                      <div className="h-full w-3/4 bg-[#c9a227] rounded-full" />
                    </div>
                    <span className="text-sm text-[#9a9285] w-12 text-right">75%</span>
                  </motion.div>
                </div>

                {/* Right Column - Active Sounds & Stats */}
                <div className="col-span-4 flex flex-col gap-6">
                  {/* Active Sounds Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Waves className="w-5 h-5 text-[#c9a227]" />
                      <h3 className="text-lg font-semibold text-[#e0d5c0]">Active Sounds</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Ocean Waves', icon: '🌊', volume: 80 },
                        { name: 'Campfire', icon: '🔥', volume: 60 },
                        { name: 'Light Rain', icon: '🌧️', volume: 70 },
                      ].map((sound, i) => (
                        <motion.div
                          key={sound.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-2xl">{sound.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm text-[#e0d5c0] mb-1">{sound.name}</div>
                            <div className="h-1.5 bg-[#13151a] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#c9a227]/80 rounded-full"
                                style={{ width: `${sound.volume}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-[#9a9285] w-8 text-right">{sound.volume}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Session Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#1a1d24]/60 backdrop-blur-xl border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-lg font-semibold text-[#e0d5c0] mb-4">Session Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">47</div>
                        <div className="text-xs text-[#9a9285]">Total Sessions</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">84%</div>
                        <div className="text-xs text-[#9a9285]">Completion</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">18h</div>
                        <div className="text-xs text-[#9a9285]">Focus Time</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#c9a227] mb-1">12d</div>
                        <div className="text-xs text-[#9a9285]">Streak</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Keyboard Shortcuts Hint */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#1a1d24]/40 backdrop-blur-xl border border-[#2a2d35]/50 rounded-xl p-4"
                  >
                    <div className="text-xs text-[#9a9285] space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Space</span>
                        <span className="text-[#e0d5c0]">Play/Pause</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>T</span>
                        <span className="text-[#e0d5c0]">Cycle Theme</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>F</span>
                        <span className="text-[#e0d5c0]">Fullscreen</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.div>
    </div>
  );
}
