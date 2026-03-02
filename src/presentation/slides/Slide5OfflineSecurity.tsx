import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Database, 
  RefreshCw, 
  GitMerge,
  Shield,
  Mail,
  Lock,
  Users,
  Hash,
  Clock,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
}

const offlineFeatures = [
  {
    icon: Smartphone,
    title: 'Full PWA',
    description: 'Installable on any device - works like a native app',
  },
  {
    icon: Database,
    title: 'IndexedDB Storage',
    description: 'Everything stored locally for instant access',
  },
  {
    icon: RefreshCw,
    title: 'Queue-Based Sync',
    description: 'Changes sync automatically when back online',
  },
  {
    icon: GitMerge,
    title: 'Conflict Resolution',
    description: 'Smart merging handles simultaneous edits',
  },
];

const securityFeatures = [
  {
    icon: Mail,
    title: 'Passwordless OTP',
    description: 'No passwords to remember or manage',
  },
  {
    icon: Hash,
    title: 'SHA-256 Hashing',
    description: 'OTP codes securely hashed before storage',
  },
  {
    icon: Clock,
    title: '10-Min Expiry',
    description: 'Codes auto-expire for protection',
  },
  {
    icon: Users,
    title: 'Row Level Security',
    description: 'Database isolation per user',
  },
];

export default function Slide5OfflineSecurity({}: SlideProps) {
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
        className="text-center mb-10"
      >
        <span className="text-sm font-medium text-accent uppercase tracking-wider">
          Technical Excellence
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-text mt-2">
          Offline-First & Secure
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Offline-First */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-display text-xl text-text">Works Anywhere</h3>
          </div>

          <div className="space-y-3">
            {offlineFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border/50"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-text text-sm">{feature.title}</h4>
                  <p className="text-xs text-text-muted mt-0.5">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sync Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-text-muted" />
                <span className="text-text-muted">Offline</span>
              </div>
              <div className="flex-1 mx-4 flex items-center">
                <div className="flex-1 h-1 bg-text-muted/20 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-text-muted/40 via-blue-500 to-correct rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-correct" />
                <span className="text-text-muted">Synced</span>
              </div>
            </div>
            <p className="text-center text-xs text-text-muted mt-2">Auto-syncs when connection is restored</p>
          </motion.div>
        </motion.div>

        {/* Right: Security */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-correct/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-correct" />
            </div>
            <h3 className="font-display text-xl text-text">Secure by Design</h3>
          </div>

          <div className="space-y-3">
            {securityFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border/50"
              >
                <div className="w-9 h-9 rounded-lg bg-correct/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-correct" />
                </div>
                <div>
                  <h4 className="font-medium text-text text-sm">{feature.title}</h4>
                  <p className="text-xs text-text-muted mt-0.5">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-4 p-4 rounded-xl bg-correct/5 border border-correct/20"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-correct" />
              <div>
                <p className="text-sm font-medium text-text">Your data is yours</p>
                <p className="text-xs text-text-muted">
                  Row Level Security ensures complete data isolation per user
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
