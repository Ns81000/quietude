import { useEffect, useState, useCallback, useRef } from 'react';
import { Howl } from 'howler';
import { useFocusStore } from '@/store/focus';
import { getSoundById } from '@/lib/focus/audioData';

// Simplified audio hook - AudioCard components manage their own Howl instances
// This hook only provides utility functions for the session
export function useFocusAudio() {
  const { selectedSounds } = useFocusStore();
  const [isLoading] = useState(false);
  const [hasErrors] = useState(false);
  
  // Fade out function - not used since AudioCard manages its own audio
  const fadeOut = useCallback((duration: number = 2000) => {
    // This is handled by AudioCard components now
    console.log('Fade out requested:', duration);
  }, []);
  
  // Get audio data for visualizer (simplified - returns random values for animation)
  const getAudioLevel = useCallback(() => {
    // Return a value between 0-1 for visualizer animation
    return selectedSounds.length > 0 ? 0.5 + Math.random() * 0.5 : 0;
  }, [selectedSounds]);
  
  return {
    isLoading,
    hasErrors,
    fadeOut,
    getAudioLevel
  };
}
