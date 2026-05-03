import { useFocusStore } from '@/store/focus';
import { getSoundById } from '@/lib/focus/audioData';
import { AudioCard } from './AudioCard';

/**
 * Hidden component that keeps AudioCard components mounted
 * to maintain audio playback across all steps
 */
export function HiddenAudioCards() {
  const selectedSounds = useFocusStore(state => state.selectedSounds);
  
  return (
    <div className="hidden" aria-hidden="true">
      {selectedSounds.map(soundId => {
        const sound = getSoundById(soundId);
        if (!sound) return null;
        
        return (
          <AudioCard
            key={soundId}
            sound={sound}
            isSelected={true}
          />
        );
      })}
    </div>
  );
}
