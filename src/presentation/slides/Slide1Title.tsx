import { motion } from 'framer-motion';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
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
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#c26838' }} />
          <stop offset="100%" style={{ stopColor: '#a85a32' }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#logo-gradient)" />
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

export default function Slide1Title({}: SlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
            opacity: 0.08,
            filter: 'blur(60px)',
          }}
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--color-correct) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Logo + Title Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center mb-8"
      >
        {/* Actual Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100 }}
          className="mb-6 relative"
        >
          <QuietudeLogo className="w-20 h-20 drop-shadow-lg" />
          {/* Glow effect */}
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-[#c26838]/30 blur-xl -z-10" />
        </motion.div>

        {/* Main Title */}
        <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl text-text tracking-tight">
          quietude
        </h1>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-xl sm:text-2xl text-text-soft mb-12 max-w-2xl"
      >
        Turn any study material into personalized AI quizzes
      </motion.p>

      {/* Divider with gradient */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="relative z-10 w-32 h-0.5 mb-12 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
        }}
      />

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 max-w-xl"
      >
        <p className="text-lg sm:text-xl text-text-soft italic leading-relaxed">
          "Learning should feel like a gentle stream, not a raging torrent."
        </p>
        <footer className="mt-4 text-sm text-text-muted">
          — The Quietude Philosophy
        </footer>
      </motion.blockquote>
    </motion.div>
  );
}
