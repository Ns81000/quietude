import { useEffect, useState, memo, useCallback } from 'react';
import { useFocusStore } from '@/store/focus';
import type { Sound } from '@/lib/focus/audioData';
import { Slider } from '@/components/ui/slider';
import { audioManager } from '@/lib/focus/audioManager';

interface AudioCardProps {
  sound: Sound;
  isSelected: boolean;
}

export const AudioCard = memo(function AudioCard({ sound, isSelected }: AudioCardProps) {
  // Use selective subscriptions to prevent unnecessary re-renders
  const soundVolume = useFocusStore(state => state.soundVolumes[sound.id] ?? 0.5);
  const globalVolume = useFocusStore(state => state.globalVolume);
  const isActive = useFocusStore(state => state.isActive);
  const isPaused = useFocusStore(state => state.isPaused);
  const setSoundVolume = useFocusStore(state => state.setSoundVolume);
  const toggleSound = useFocusStore(state => state.toggleSound);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const adjustedVolume = soundVolume * globalVolume;
  
  // Stable toggle handler
  const handleToggle = useCallback(() => {
    toggleSound(sound.id);
  }, [toggleSound, sound.id]);
  
  // Get or create Howl instance from global manager (persists across re-renders)
  const howl = audioManager.getOrCreate(sound.id, sound.src, adjustedVolume);
  
  // Update volume when it changes
  useEffect(() => {
    howl.volume(adjustedVolume);
  }, [howl, adjustedVolume]);
  
  // Handle play/pause based on selection AND session state
  useEffect(() => {
    const shouldPlay = isSelected && (!isActive || (isActive && !isPaused));
    
    if (shouldPlay) {
      if (!howl.playing()) {
        howl.play();
      }
    } else if (isSelected && isActive && isPaused) {
      if (howl.playing()) {
        howl.pause();
      }
    } else if (!isSelected) {
      if (howl.playing()) {
        howl.stop();
      }
    }
  }, [howl, isSelected, isActive, isPaused]);
  
  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (howl.playing()) {
        howl.stop();
      }
    };
  }, [howl]);
  
  const handleVolumeChange = (value: number[]) => {
    if (isSelected) {
      setSoundVolume(sound.id, value[0] / 100);
    }
  };
  
  const handleVolumeClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`relative rounded-xl border-2 transition-all group touch-manipulation active:scale-95 ${
        isSelected
          ? 'border-accent bg-accent/10'
          : 'border-border active:border-accent/50 bg-surface active:bg-accent/5'
      } p-2 md:p-2.5 flex flex-col`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Sound Info */}
      <div className="flex flex-col items-center gap-1 text-center mb-1.5">
        <div className={`text-lg md:text-xl transition-colors ${isSelected ? 'text-accent' : 'text-text-soft group-active:text-text'}`}>
          {isLoading ? (
            <div className="animate-spin">⏳</div>
          ) : (
            sound.icon
          )}
        </div>
        <span className={`text-xs font-medium transition-colors line-clamp-2 min-h-[1.75rem] flex items-center ${isSelected ? 'text-accent' : 'text-text'}`}>
          {sound.label}
        </span>
      </div>
      
      {/* Volume Slider - Always visible, disabled when not selected */}
      <div 
        className={`flex items-center pt-1.5 border-t transition-all ${
          isSelected ? 'border-accent/30' : 'border-border/30'
        } ${!isSelected ? 'pointer-events-none' : ''}`}
        onClick={handleVolumeClick}
        onTouchStart={handleVolumeClick}
      >
        <Slider
          value={[soundVolume * 100]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          disabled={!isSelected}
          className={`flex-1 ${!isSelected ? 'opacity-40' : 'opacity-100'}`}
        />
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if sound.id or isSelected changes
  return prevProps.sound.id === nextProps.sound.id && 
         prevProps.isSelected === nextProps.isSelected;
});
