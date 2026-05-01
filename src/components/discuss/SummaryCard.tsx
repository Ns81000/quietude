import { motion } from 'framer-motion';
import { Sparkles, Lightbulb } from 'lucide-react';

interface SummaryCardProps {
  strengths: string[];
  areasToExplore: string[];
  closingThought: string;
}

export function SummaryCard({ strengths, areasToExplore, closingThought }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-6 space-y-5"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-2" />

      <h3 className="font-display text-xl md:text-2xl text-text">Your Understanding</h3>

      {/* Strengths */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border/60 rounded-2xl p-5"
      >
        <p className="text-sm font-medium text-correct flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-lg bg-correct/10 flex items-center justify-center">
            <Sparkles size={12} className="text-correct" />
          </span>
          What you demonstrated
        </p>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-text text-sm leading-relaxed flex items-start gap-2"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-correct/60 flex-shrink-0" />
              {s}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Areas to explore */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-surface border border-border/60 rounded-2xl p-5"
      >
        <p className="text-sm font-medium text-accent flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
            <Lightbulb size={12} className="text-accent" />
          </span>
          Worth exploring further
        </p>
        <ul className="space-y-2">
          {areasToExplore.map((a, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="text-text text-sm leading-relaxed flex items-start gap-2"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0" />
              {a}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Closing thought */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-text-soft font-display italic text-base pt-2 px-4"
      >
        &ldquo;{closingThought}&rdquo;
      </motion.p>
    </motion.div>
  );
}
