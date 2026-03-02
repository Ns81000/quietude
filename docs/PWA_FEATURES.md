# PWA Features

[![Vite PWA](https://img.shields.io/badge/Vite_PWA-Plugin-646cff?style=flat-square)](https://vite-pwa-org.netlify.app/)
[![Workbox](https://img.shields.io/badge/Workbox-7.0-orange?style=flat-square)](https://developers.google.com/web/tools/workbox)
[![Service Worker](https://img.shields.io/badge/Service_Worker-Enabled-green?style=flat-square)](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)

Quietude is a **Progressive Web App (PWA)** that provides native app-like experiences including offline functionality, installability, and optimized caching strategies. The PWA implementation uses Vite PWA plugin with Workbox for service worker generation.

---

## Table of Contents

- [Overview](#overview)
- [Service Worker Configuration](#service-worker-configuration)
- [Caching Strategies](#caching-strategies)
- [Offline Storage](#offline-storage)
- [Install Experience](#install-experience)
- [Web App Manifest](#web-app-manifest)
- [Update Handling](#update-handling)
- [Performance Optimizations](#performance-optimizations)

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PWA CAPABILITIES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐             │
│   │   INSTALLABLE   │   │    OFFLINE      │   │   FAST LOAD     │             │
│   │                 │   │                 │   │                 │             │
│   │  Add to home    │   │  Full offline   │   │  Cached assets  │             │
│   │  screen on any  │   │  functionality  │   │  load instantly │             │
│   │  platform       │   │  with IndexedDB │   │  from SW cache  │             │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘             │
│                                                                                 │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐             │
│   │   BACKGROUND    │   │  PUSH READY     │   │   APP-LIKE      │             │
│   │     SYNC        │   │                 │   │                 │             │
│   │                 │   │  Infrastructure │   │  Standalone     │             │
│   │  Sync data when │   │  for future     │   │  window, no     │             │
│   │  online returns │   │  notifications  │   │  browser UI     │             │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Worker Configuration

### Vite PWA Plugin Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      
      manifest: {
        name: 'Quietude - Mindful Learning',
        short_name: 'Quietude',
        description: 'AI-powered educational platform for focused learning',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // API caching strategies defined below
        ]
      }
    })
  ]
});
```

### Service Worker Registration

```typescript
// src/lib/pwa/register.ts
import { registerSW } from 'virtual:pwa-register';

export function initServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // New content available, prompt user
      if (confirm('New version available. Reload to update?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      showToast('Ready to work offline!');
    },
    onRegistered(registration) {
      console.log('SW registered:', registration);
      
      // Check for updates periodically
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000); // Every hour
    },
    onRegisterError(error) {
      console.error('SW registration failed:', error);
    }
  });
  
  return updateSW;
}
```

---

## Caching Strategies

### Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CACHING STRATEGIES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Strategy           │ Use Case                 │ Behavior                      │
│   ───────────────────┼──────────────────────────┼────────────────────────────  │
│   CacheFirst         │ Static assets            │ Cache → Network (fallback)   │
│   NetworkFirst       │ API responses            │ Network → Cache (fallback)   │
│   StaleWhileRevalid  │ Frequently updated       │ Cache + Background refresh   │
│   NetworkOnly        │ Authentication           │ Always from network          │
│   CacheOnly          │ Offline fallback pages   │ Only from cache              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Workbox Runtime Caching

```typescript
// vite.config.ts - workbox.runtimeCaching
runtimeCaching: [
  // Static assets - CacheFirst
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  
  // Fonts - CacheFirst with long expiration
  {
    urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'fonts-cache',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      }
    }
  },
  
  // Google Fonts stylesheets - StaleWhileRevalidate
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-stylesheets'
    }
  },
  
  // Google Fonts webfonts - CacheFirst
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60
      }
    }
  },
  
  // Firebase API - NetworkFirst
  {
    urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'firebase-api-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 1 day
      }
    }
  },
  
  // Gemini API - NetworkOnly (no caching for AI responses)
  {
    urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
    handler: 'NetworkOnly'
  }
]
```

### Cache Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CACHE FLOW: STATIC ASSETS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Request: /images/logo.png                                                     │
│       │                                                                         │
│       ▼                                                                         │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                    SERVICE WORKER                                  │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│       │                                                                         │
│       ▼                                                                         │
│   ┌───────────────────┐                                                        │
│   │ Check Cache First │                                                        │
│   └─────────┬─────────┘                                                        │
│             │                                                                   │
│      ┌──────┴──────┐                                                           │
│      │             │                                                           │
│   Cache Hit    Cache Miss                                                      │
│      │             │                                                           │
│      ▼             ▼                                                           │
│   ┌───────┐   ┌───────────────────┐                                           │
│   │ Return│   │ Fetch from Network│                                           │
│   │ Cached│   └─────────┬─────────┘                                           │
│   │ Asset │             │                                                      │
│   └───────┘             ▼                                                      │
│                   ┌───────────────────┐                                        │
│                   │ Store in Cache    │                                        │
│                   │ Return Response   │                                        │
│                   └───────────────────┘                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Offline Storage

### Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE STORAGE LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Layer 1: Service Worker Cache (via Workbox)                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  • Static assets (JS, CSS, images, fonts)                               │  │
│   │  • HTML shell for app                                                   │  │
│   │  • API response cache (with expiration)                                 │  │
│   │  • Managed automatically by Workbox strategies                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Layer 2: localStorage (via Zustand persist)                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  • Application state (quiz sessions, notes, user data)                  │  │
│   │  • Theme and UI preferences                                             │  │
│   │  • Authentication tokens                                                │  │
│   │  • ~5MB limit, synchronous access                                       │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Layer 3: IndexedDB (via idb-keyval)                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  • Sync queue for offline changes                                       │  │
│   │  • Large content cache (PDFs, extracted text)                           │  │
│   │  • Gemini API response cache                                            │  │
│   │  • Virtually unlimited storage, async access                            │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Offline Fallback Page

```typescript
// src/lib/pwa/offline.ts
export function setupOfflineFallback() {
  // Precache offline fallback page
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('offline-fallback').then((cache) => {
        return cache.addAll([
          '/offline.html',
          '/offline.css',
          '/offline-icon.svg'
        ]);
      })
    );
  });

  // Serve fallback for navigation requests when offline
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/offline.html');
        })
      );
    }
  });
}
```

---

## Install Experience

### Install Prompt Handling

```typescript
// src/lib/pwa/install.ts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent automatic prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    trackEvent('pwa_installed');
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}
```

### Install Button Component

```typescript
// src/components/pwa/InstallButton.tsx
import { useState, useEffect } from 'react';
import { canInstall, promptInstall } from '@/lib/pwa/install';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function InstallButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const checkInstallable = () => {
      setShowButton(canInstall());
    };

    checkInstallable();
    window.addEventListener('beforeinstallprompt', checkInstallable);
    window.addEventListener('appinstalled', () => setShowButton(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable);
    };
  }, []);

  if (!showButton) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const installed = await promptInstall();
        if (installed) {
          setShowButton(false);
        }
      }}
    >
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}
```

---

## Web App Manifest

### Complete Manifest Configuration

```json
// public/site.webmanifest
{
  "name": "Quietude - Mindful Learning",
  "short_name": "Quietude",
  "description": "AI-powered educational platform for focused learning",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "categories": ["education", "productivity"],
  "lang": "en",
  "dir": "ltr",
  
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard view"
    },
    {
      "src": "/screenshots/quiz.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Quiz interface"
    }
  ],
  
  "shortcuts": [
    {
      "name": "New Quiz",
      "short_name": "Quiz",
      "description": "Start a new quiz session",
      "url": "/quiz/new",
      "icons": [{ "src": "/icons/quiz-shortcut.png", "sizes": "96x96" }]
    },
    {
      "name": "My Notes",
      "short_name": "Notes",
      "description": "View your notes",
      "url": "/notes",
      "icons": [{ "src": "/icons/notes-shortcut.png", "sizes": "96x96" }]
    }
  ],
  
  "related_applications": [],
  "prefer_related_applications": false
}
```

---

## Update Handling

### Update Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PWA UPDATE FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                    NEW DEPLOYMENT                                  │        │
│   │              (Updated assets on server)                            │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                              │                                                  │
│                              ▼                                                  │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                  SW CHECKS FOR UPDATE                              │        │
│   │             (Automatic hourly + on page load)                      │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                              │                                                  │
│                              ▼                                                  │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                 NEW SW DETECTED                                    │        │
│   │            (Different hash in sw.js)                               │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                              │                                                  │
│                              ▼                                                  │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │               DOWNLOAD IN BACKGROUND                               │        │
│   │          (New SW + updated cache assets)                           │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                              │                                                  │
│                              ▼                                                  │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │                NOTIFY USER (onNeedRefresh)                         │        │
│   │              "New version available. Update?"                      │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                              │                                                  │
│               ┌──────────────┴──────────────┐                                  │
│               │                             │                                  │
│            Accept                        Dismiss                               │
│               │                             │                                  │
│               ▼                             ▼                                  │
│   ┌───────────────────────┐   ┌───────────────────────┐                       │
│   │ skipWaiting() called  │   │ Update waits for all  │                       │
│   │ Page reloads with     │   │ tabs to close, then   │                       │
│   │ new version           │   │ activates on next     │                       │
│   └───────────────────────┘   │ visit                 │                       │
│                               └───────────────────────┘                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Update Toast Component

```typescript
// src/components/pwa/UpdateToast.tsx
import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const sw = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        // Optionally show offline ready notification
      }
    });
    
    setUpdateSW(() => sw);
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert>
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          A new version of Quietude is available.
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => updateSW?.(true)}
            >
              Update Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNeedRefresh(false)}
            >
              Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

---

## Performance Optimizations

### Lighthouse PWA Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PWA LIGHTHOUSE REQUIREMENTS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Requirement                          │ Status │ Implementation                │
│   ─────────────────────────────────────┼────────┼────────────────────────────  │
│   HTTPS (or localhost)                 │   ✓    │ Deployed on Vercel/Netlify   │
│   Registers service worker             │   ✓    │ vite-plugin-pwa              │
│   Responds with 200 offline            │   ✓    │ Workbox precaching           │
│   Contains web app manifest            │   ✓    │ site.webmanifest             │
│   Has appropriate icons                │   ✓    │ 192x192, 512x512 minimum     │
│   Sets theme-color meta                │   ✓    │ <meta name="theme-color">    │
│   Content sized for viewport           │   ✓    │ Responsive design            │
│   Has valid start_url                  │   ✓    │ "/" in manifest              │
│   Installable                          │   ✓    │ All criteria met             │
│   Splash screen                        │   ✓    │ iOS: apple-touch-startup     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Precaching Strategy

```typescript
// vite.config.ts
workbox: {
  // Precache these patterns during SW install
  globPatterns: [
    '**/*.{js,css,html}',
    '**/*.{ico,png,svg,webp}',
    '**/*.{woff,woff2}'
  ],
  
  // Don't precache these
  globIgnores: [
    '**/node_modules/**/*',
    'sw.js',
    'workbox-*.js'
  ],
  
  // Navigation fallback
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//],
  
  // Clean old caches
  cleanupOutdatedCaches: true,
  
  // Skip waiting by default
  skipWaiting: true,
  clientsClaim: true
}
```

### Bundle Size Optimization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ASSET OPTIMIZATION                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Optimization              │ Tool/Method            │ Impact                   │
│   ──────────────────────────┼────────────────────────┼──────────────────────── │
│   Code splitting            │ Vite dynamic imports   │ Smaller initial bundle  │
│   Tree shaking              │ ESM + Vite             │ Remove unused code      │
│   Minification              │ Terser (Vite default)  │ ~60% size reduction     │
│   Compression               │ Brotli/Gzip (server)   │ ~70% transfer reduction │
│   Image optimization        │ WebP format            │ ~30% smaller images     │
│   Font subsetting           │ Only used characters   │ Smaller font files      │
│   CSS purging               │ Tailwind JIT           │ Only used styles        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

The Quietude PWA implementation provides:

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Offline Support | Workbox + IndexedDB | Full offline functionality |
| Installable | Web App Manifest | Native app experience |
| Fast Loading | Precaching + CacheFirst | Instant subsequent loads |
| Auto-Updates | Service Worker refresh | Always up-to-date |
| Background Sync | Sync queue + idb | Data never lost |
| Performance | Optimized bundles | Fast initial load |

---

**Related Documentation:**
- [Sync Mechanism](./SYNC_MECHANISM.md) - Offline data handling
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [State Management](./STATE_MANAGEMENT.md) - Data persistence

---

<div align="center">
  <sub>App-like experience on any device</sub>
</div>
