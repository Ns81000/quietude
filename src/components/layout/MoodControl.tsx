import { useUIStore } from '@/store/ui';
import { type MoodTheme, type AnyTheme, THEME_LABELS, getTimeTheme, applyTheme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS: MoodTheme[] = ['sage', 'storm', 'sand', 'plum', 'ink'];

const MOOD_DOTS: Record<MoodTheme, string> = {
  sage: 'bg-[#4A7A38]',
  storm: '#3058A0',
  sand: '#8A6840',
  plum: '#703888',
  ink: '#201810',
};

export function MoodControl() {
  const { activeMood, moodSelectorOpen, setMood, openMoodSelector, closeMoodSelector } = useUIStore();

  const handleSelect = (mood: MoodTheme | null) => {
    setMood(mood);
    if (!mood) applyTheme(getTimeTheme());
    closeMoodSelector();
  };

  return (
    <div className="relative">
      <button
        onClick={() => (moodSelectorOpen ? closeMoodSelector() : openMoodSelector())}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-text-soft
                   hover:bg-bg-2 transition-colors duration-150"
      >
        <span className="w-2 h-2 rounded-full bg-accent" />
        <span>{activeMood ? THEME_LABELS[activeMood] : 'Auto'}</span>
      </button>

      <AnimatePresence>
        {moodSelectorOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMoodSelector} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-surface border border-border
                         rounded-lg shadow-md p-2 min-w-[160px]"
            >
              <button
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150
                  ${!activeMood ? 'bg-accent-soft text-text' : 'text-text-soft hover:bg-bg-2'}`}
              >
                Auto (time-based)
              </button>
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleSelect(mood)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150
                    ${activeMood === mood ? 'bg-accent-soft text-text' : 'text-text-soft hover:bg-bg-2'}`}
                >
                  {THEME_LABELS[mood]}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
