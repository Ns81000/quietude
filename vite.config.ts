import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// YouTube transcript API plugin for local development
function youtubeTranscriptPlugin(): Plugin {
  return {
    name: 'youtube-transcript-api',
    configureServer(server) {
      server.middlewares.use('/api/fetch-transcript', async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Parse body
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        let url: string;
        try {
          const parsed = JSON.parse(body);
          url = parsed.url;
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        if (!url || typeof url !== 'string') {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'No URL provided' }));
          return;
        }

        // Extract video ID
        const videoId = extractVideoId(url);
        if (!videoId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid YouTube URL' }));
          return;
        }

        console.log(`[youtube-api] Processing video: ${videoId}`);

        try {
          // Fetch title in parallel
          const titlePromise = fetchVideoTitle(videoId);

          // Fetch transcript via Innertube
          const result = await fetchViaInnertube(videoId);

          if (!result || result.segments.join(' ').length < 50) {
            res.statusCode = 422;
            res.end(JSON.stringify({ 
              error: "Could not retrieve transcript. This video may not have captions enabled." 
            }));
            return;
          }

          const rawText = result.segments.join(' ');
          const { transcript, wasTruncated } = cleanTranscript(rawText);
          const title = await titlePromise;

          if (transcript.length < 50) {
            res.statusCode = 422;
            res.end(JSON.stringify({ error: 'Transcript is too short.' }));
            return;
          }

          console.log(`[youtube-api] Success: ${transcript.length} chars via ${result.method}`);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            transcript,
            videoId,
            title,
            characters: transcript.length,
            wasTruncated,
          }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[youtube-api] Error:', msg);
          
          if (msg === 'PRIVATE') {
            res.statusCode = 422;
            res.end(JSON.stringify({ error: 'This video is private.' }));
            return;
          }
          if (msg === 'UNAVAILABLE') {
            res.statusCode = 422;
            res.end(JSON.stringify({ error: 'This video is unavailable.' }));
            return;
          }

          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch transcript.' }));
        }
      });
    },
  };
}

// --- YouTube transcript helper functions ---
const TRANSCRIPT_CHAR_LIMIT = 50_000;
const NOISE_RE = /\[(?:music|applause|laughter|inaudible|crosstalk|silence|sound|noise|cheering|clapping)[^\]]*\]/gi;
const MUSIC_LINE_RE = /♪[^♪]*♪/g;

const INNERTUBE_CLIENTS = [
  {
    label: 'ANDROID',
    apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 34,
        hl: 'en',
        gl: 'US',
      },
    },
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14; en_US)',
  },
  {
    label: 'WEB',
    apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20241126.01.00',
        hl: 'en',
        gl: 'US',
      },
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
] as const;

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null;
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].split('?')[0] || null;
    if (u.pathname.startsWith('/live/')) return u.pathname.split('/live/')[1].split('?')[0] || null;
    if (u.pathname.startsWith('/v/')) return u.pathname.split('/v/')[1].split('?')[0] || null;
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0] || null;
    const v = u.searchParams.get('v');
    if (v) return v;
  } catch { /* Not a valid URL */ }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return videoId;
    const data = await res.json();
    return (data.title as string) || videoId;
  } catch {
    return videoId;
  }
}

function cleanTranscript(raw: string): { transcript: string; wasTruncated: boolean } {
  let transcript = raw
    .replace(NOISE_RE, '')
    .replace(MUSIC_LINE_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const wasTruncated = transcript.length > TRANSCRIPT_CHAR_LIMIT;
  if (wasTruncated) transcript = transcript.slice(0, TRANSCRIPT_CHAR_LIMIT);
  return { transcript, wasTruncated };
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface InnertubePlayerResponse {
  playabilityStatus?: { status: string; reason?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

async function fetchViaInnertube(videoId: string): Promise<{ segments: string[]; method: string } | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      console.log(`[innertube] Trying ${client.label}`);

      const res = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${client.apiKey}&prettyPrint=false`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': client.userAgent,
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
          },
          body: JSON.stringify({ context: client.context, videoId }),
        }
      );

      if (!res.ok) {
        console.warn(`[innertube] ${client.label}: HTTP ${res.status}`);
        continue;
      }

      const data: InnertubePlayerResponse = await res.json();
      const status = data.playabilityStatus?.status;

      if (status && status !== 'OK') {
        const reason = data.playabilityStatus?.reason || status;
        if (reason.toLowerCase().includes('private')) throw new Error('PRIVATE');
        if (reason.toLowerCase().includes('unavailable')) throw new Error('UNAVAILABLE');
        console.warn(`[innertube] ${client.label}: ${reason}`);
        continue;
      }

      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) {
        console.warn(`[innertube] ${client.label}: no caption tracks`);
        continue;
      }

      // Prefer manual English → auto English → first available
      const track =
        tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ||
        tracks.find((t) => t.languageCode === 'en') ||
        tracks.find((t) => t.languageCode?.startsWith('en')) ||
        tracks[0];

      let captionUrl = track.baseUrl;
      if (!captionUrl.includes('fmt=')) {
        captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=srv3';
      }

      const xmlRes = await fetch(captionUrl, {
        headers: {
          'User-Agent': client.userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!xmlRes.ok) {
        console.warn(`[innertube] Caption XML: HTTP ${xmlRes.status}`);
        continue;
      }

      const xml = await xmlRes.text();
      if (!xml || xml.length === 0) {
        console.warn(`[innertube] Caption XML empty`);
        continue;
      }

      // Parse segments
      const segments: string[] = [];
      const re = /<(?:p|text)[^>]*>([\s\S]*?)<\/(?:p|text)>/g;
      let match;
      while ((match = re.exec(xml)) !== null) {
        const text = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\n/g, ' ')
          .trim();
        if (text) segments.push(text);
      }

      if (segments.length === 0) {
        // Fallback: strip all XML tags
        const plain = xml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (plain.length > 50) segments.push(plain);
      }

      if (segments.length > 0) {
        console.log(`[innertube] ${client.label}: got ${segments.length} segments`);
        return { segments, method: `innertube-${client.label}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'PRIVATE' || msg === 'UNAVAILABLE') throw err;
      console.warn(`[innertube] ${client.label}: ${msg}`);
    }
  }
  return null;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && youtubeTranscriptPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.svg', 'robots.txt'],
      manifest: {
        name: 'Quietude',
        short_name: 'Quietude',
        description: 'Your calm, intelligent learning partner',
        theme_color: '#c26838',
        background_color: '#faf7f3',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Ensure assets are properly cached
    assetsInlineLimit: 0, // Don't inline assets, better caching
  },
}));
