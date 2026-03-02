import { registerSW } from 'virtual:pwa-register';

let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Auto-update silently in background - no user prompt
        console.log('[PWA] New content available, auto-updating...');
        // Trigger the actual update immediately
        if (updateSW) {
          updateSW(true).catch(err => {
            console.error('[PWA] Auto-update failed:', err);
          });
        }
      },
      onOfflineReady() {
        console.log('[PWA] App ready to work offline');
      },
      onRegistered(registration) {
        if (registration) {
          // Check for updates every 5 minutes for faster update propagation
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);
          
          // Also check immediately on visibility change (tab becomes active)
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update();
            }
          });
        }
      },
      onRegisterError(error) {
        console.error('[PWA] Service worker registration error:', error);
      },
    });
  }
}

export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
