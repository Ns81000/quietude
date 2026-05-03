import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFocusStore } from '@/store/focus';
import { getSoundById } from '@/lib/focus/audioData';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SelectedSoundsSidebarProps {
  onBack: () => void;
  onNext: () => void;
  onRemoveSound: (soundId: string) => void;
  onClearAll: () => void;
}

export function SelectedSoundsSidebar({
  onBack,
  onNext,
  onRemoveSound,
  onClearAll,
}: SelectedSoundsSidebarProps) {
  const { selectedSounds } = useFocusStore();
  
  if (selectedSounds.length === 0) {
    return (
      <div className="hidden lg:flex lg:flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-3 opacity-30">🎵</div>
          <p className="text-sm text-text-muted">
            Select sounds to build your mix
          </p>
        </div>
        
        <div className="p-4 border-t border-border space-y-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full gap-2 touch-manipulation active:scale-95"
            style={{ touchAction: 'manipulation' }}
            aria-label="Go back to time selection"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          
          <Button
            onClick={onNext}
            disabled
            className="w-full gap-2 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Start session (disabled - select sounds first)"
          >
            Start Session
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden lg:flex lg:flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text">Your Mix</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-semibold">
            {selectedSounds.length}
          </span>
        </div>
        <Button
          onClick={onClearAll}
          variant="ghost"
          size="sm"
          className="w-full text-incorrect hover:text-incorrect h-8"
        >
          Clear All
        </Button>
      </div>
      
      {/* Selected Sounds List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {selectedSounds.map((soundId) => {
            const sound = getSoundById(soundId);
            if (!sound) return null;
            
            return (
              <motion.div
                key={soundId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border hover:border-accent/50 transition-all group"
              >
                <div className="text-xl flex-shrink-0">{sound.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {sound.label}
                  </p>
                  <p className="text-xs text-text-muted">
                    {sound.category}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveSound(soundId)}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-bg-2 active:bg-incorrect/10 text-text-muted hover:text-incorrect active:text-incorrect transition-all duration-200 touch-manipulation active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                  title={`Remove ${sound.label}`}
                  aria-label={`Remove ${sound.label}`}
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full gap-2 touch-manipulation active:scale-95"
          style={{ touchAction: 'manipulation' }}
          aria-label="Go back to time selection"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
        
        <Button
          onClick={onNext}
          className="w-full gap-2 touch-manipulation active:scale-95 shadow-lg hover:shadow-xl"
          style={{ touchAction: 'manipulation' }}
          aria-label="Start focus session"
        >
          Start Focus Session
          <ArrowRight size={18} />
        </Button>
      </div>
    </motion.div>
  );
}
