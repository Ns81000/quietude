import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

const architectureLayers = [
  {
    name: 'Presentation',
    tech: 'React 18',
    color: 'bg-blue-500',
    items: ['Pages', 'Components', 'Hooks'],
  },
  {
    name: 'State',
    tech: 'Zustand',
    color: 'bg-purple-500',
    items: ['Auth', 'Quiz', 'Notes', 'UI'],
  },
  {
    name: 'Services',
    tech: 'Gemini + Firebase',
    color: 'bg-orange-500',
    items: ['AI Engine', 'Sync', 'Auth'],
  },
  {
    name: 'Storage',
    tech: 'Multi-layer',
    color: 'bg-green-500',
    items: ['localStorage', 'IndexedDB', 'Firestore'],
  },
];

const techStack = [
  { category: 'Frontend', items: ['React 18', 'TypeScript', 'TailwindCSS', 'Framer Motion'] },
  { category: 'State', items: ['Zustand', 'Persist', 'Selectors'] },
  { category: 'AI', items: ['Gemini 2.5 Flash', 'Multi-modal', 'Prompt Engineering'] },
  { category: 'Backend', items: ['Firebase', 'Firestore', 'Auth', 'OTP'] },
  { category: 'PWA', items: ['Workbox', 'IndexedDB', 'Service Worker'] },
];

export default function Slide6Architecture({}: SlideProps) {
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
          Engineering
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-text mt-2">
          Architecture & Tech Stack
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Architecture Layers */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
            Layered Architecture
          </h3>
          
          <div className="space-y-3">
            {architectureLayers.map((layer, i) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="relative"
              >
                <div className="flex items-stretch rounded-xl overflow-hidden border border-border/50 bg-surface">
                  {/* Color Bar */}
                  <div className={cn('w-2', layer.color)} />
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-text">{layer.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-bg-2 text-text-muted">
                        {layer.tech}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {layer.items.map((item) => (
                        <span 
                          key={item}
                          className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Arrow */}
                {i < architectureLayers.length - 1 && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-4 h-4 rotate-45 border-r-2 border-b-2 border-border/50 bg-bg" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Tech Stack */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
            Tech Stack
          </h3>
          
          <div className="space-y-4">
            {techStack.map((group, i) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-xl bg-surface border border-border/50"
              >
                <h4 className="text-xs font-medium text-accent uppercase tracking-wider mb-2">
                  {group.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span 
                      key={item}
                      className="text-sm px-3 py-1 rounded-lg bg-bg-2 text-text"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom: Key Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'TypeScript', value: 'Strict Mode' },
          { label: 'Test Coverage', value: 'Vitest' },
          { label: 'Bundle', value: 'Vite 5' },
          { label: 'Deploy', value: 'Vercel' },
        ].map((stat, i) => (
          <div 
            key={i}
            className="text-center p-3 rounded-xl bg-surface/50 border border-border/50"
          >
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="text-sm font-medium text-text mt-1">{stat.value}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
