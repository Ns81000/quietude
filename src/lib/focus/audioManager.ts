import { Howl } from 'howler';

// Global audio manager - keeps Howl instances alive outside React lifecycle
class AudioManager {
  private howls: Map<string, Howl> = new Map();
  
  getOrCreate(soundId: string, src: string, initialVolume: number): Howl {
    if (!this.howls.has(soundId)) {
      const howl = new Howl({
        src: [src],
        loop: true,
        volume: initialVolume,
        html5: true,
        preload: true,
      });
      this.howls.set(soundId, howl);
    }
    return this.howls.get(soundId)!;
  }
  
  get(soundId: string): Howl | undefined {
    return this.howls.get(soundId);
  }
  
  remove(soundId: string): void {
    const howl = this.howls.get(soundId);
    if (howl) {
      howl.unload();
      this.howls.delete(soundId);
    }
  }
  
  cleanup(): void {
    this.howls.forEach(howl => howl.unload());
    this.howls.clear();
  }
}

export const audioManager = new AudioManager();
