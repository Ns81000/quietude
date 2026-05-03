import { useState, useCallback, useRef, useEffect } from 'react';
import { Howl } from 'howler';

export function useAudioPreview(src: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const howlRef = useRef<Howl | null>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, []);
  
  const play = useCallback(() => {
    if (!howlRef.current) {
      setIsLoading(true);
      howlRef.current = new Howl({
        src: [src],
        volume: 0.5,
        html5: true,
        onload: () => {
          setIsLoading(false);
          howlRef.current?.play();
          setIsPlaying(true);
        },
        onend: () => {
          setIsPlaying(false);
        },
        onloaderror: () => {
          setIsLoading(false);
          console.error('Failed to load preview');
        }
      });
    } else {
      howlRef.current.play();
      setIsPlaying(true);
    }
  }, [src]);
  
  const pause = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.pause();
      setIsPlaying(false);
    }
  }, []);
  
  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      setIsPlaying(false);
    }
  }, []);
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  return {
    isPlaying,
    isLoading,
    play,
    pause,
    stop,
    toggle
  };
}
