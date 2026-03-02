import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Supadata } from '@supadata/js';

// Vercel serverless config
export const config = {
  maxDuration: 30,
};

const TRANSCRIPT_CHAR_LIMIT = 50_000;

// Noise tokens to strip from auto-generated captions
const NOISE_RE = /\[(?:music|applause|laughter|inaudible|crosstalk|silence|sound|noise|cheering|clapping)[^\]]*\]/gi;
const MUSIC_LINE_RE = /♪[^♪]*♪/g;

// ---------------------------------------------------------------------------
// Supadata Key Pool (like Gemini key rotation)
// ---------------------------------------------------------------------------
function getSupadataKeys(): string[] {
  const keys: string[] = [];
  
  // Support SUPADATA_API_KEY, SUPADATA_API_KEY_1, SUPADATA_API_KEY_2, etc.
  if (process.env.SUPADATA_API_KEY) {
    keys.push(process.env.SUPADATA_API_KEY);
  }
  
  // Check for numbered keys (1-10)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`SUPADATA_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  return keys;
}

// Round-robin key selection with random start
let keyIndex = Math.floor(Math.random() * 100);

function getNextSupadataClient(): Supadata | null {
  const keys = getSupadataKeys();
  if (keys.length === 0) return null;
  
  keyIndex = (keyIndex + 1) % keys.length;
  const key = keys[keyIndex];
  
  console.log(`[supadata] Using key ${keyIndex + 1}/${keys.length}`);
  return new Supadata({ apiKey: key });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  } catch {
    // Not a valid URL
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
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
  if (wasTruncated) {
    transcript = transcript.slice(0, TRANSCRIPT_CHAR_LIMIT);
  }

  return { transcript, wasTruncated };
}

// ---------------------------------------------------------------------------
// Strategy 1: Supadata (PRIMARY - works from datacenter IPs)
// ---------------------------------------------------------------------------

async function fetchViaSupadata(videoId: string): Promise<{ text: string; method: string } | null> {
  const keys = getSupadataKeys();
  if (keys.length === 0) {
    console.warn('[supadata] No API keys configured');
    return null;
  }

  // Try each key until one works
  const startIndex = keyIndex;
  let attempts = 0;

  while (attempts < keys.length) {
    const client = getNextSupadataClient();
    if (!client) break;

    try {
      console.log(`[supadata] Fetching transcript for ${videoId}...`);

      const result = await client.transcript({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        lang: 'en',
        text: true,
      });

      // Handle async job case
      if ('jobId' in result) {
        console.warn('[supadata] Got async job ID, skipping...');
        attempts++;
        continue;
      }

      const content = result.content;
      if (!content) {
        console.warn('[supadata] Empty transcript content');
        attempts++;
        continue;
      }

      let text: string;
      if (typeof content === 'string') {
        text = content;
      } else {
        // Array of TranscriptChunk
        text = content.map((c) => c.text).join(' ');
      }

      if (text.length < 50) {
        console.warn(`[supadata] Transcript too short: ${text.length} chars`);
        attempts++;
        continue;
      }

      console.log(`[supadata] Success: ${text.length} chars`);
      return { text, method: 'supadata' };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[supadata] Error: ${msg}`);
      
      // Check if it's a quota/rate limit error - try next key
      if (msg.includes('quota') || msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
        console.log('[supadata] Quota/rate limit hit, trying next key...');
        attempts++;
        continue;
      }
      
      // For other errors (video unavailable, no captions), don't retry
      if (msg.includes('unavailable') || msg.includes('private') || msg.includes('caption')) {
        throw new Error(msg);
      }
      
      attempts++;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Strategy 2: Innertube API (FALLBACK - free, works sometimes)
// ---------------------------------------------------------------------------

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

async function fetchViaInnertube(videoId: string): Promise<{ text: string; method: string } | null> {
  const clients = [
    {
      label: 'WEB_CREATOR',
      context: {
        client: {
          clientName: 'WEB_CREATOR',
          clientVersion: '1.20241203.01.00',
          hl: 'en',
          gl: 'US',
        },
      },
    },
    {
      label: 'ANDROID',
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '20.10.38',
          androidSdkVersion: 34,
          hl: 'en',
          gl: 'US',
        },
      },
    },
  ];

  for (const client of clients) {
    try {
      console.log(`[innertube] Trying ${client.label}...`);

      const res = await fetch(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
          },
          body: JSON.stringify({
            context: client.context,
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
          }),
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const status = data.playabilityStatus?.status;

      if (status !== 'OK') continue;

      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) continue;

      const track =
        tracks.find((t: CaptionTrack) => t.languageCode === 'en' && t.kind !== 'asr') ||
        tracks.find((t: CaptionTrack) => t.languageCode === 'en') ||
        tracks[0];

      let captionUrl = track.baseUrl;
      if (!captionUrl.includes('fmt=')) {
        captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=srv3';
      }

      const xmlRes = await fetch(captionUrl);
      if (!xmlRes.ok) continue;

      const xml = await xmlRes.text();
      
      // Parse segments
      const segments: string[] = [];
      const re = /<(?:text|p)[^>]*>([\s\S]*?)<\/(?:text|p)>/gi;
      let match;
      while ((match = re.exec(xml)) !== null) {
        const text = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\n/g, ' ')
          .trim();
        if (text) segments.push(text);
      }

      if (segments.length > 0) {
        const text = segments.join(' ');
        console.log(`[innertube] ${client.label}: ${text.length} chars`);
        return { text, method: `innertube-${client.label}` };
      }
    } catch (err) {
      console.warn(`[innertube] ${client.label}: ${err}`);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({
        error: 'Invalid YouTube URL. Use a youtube.com/watch, youtu.be, or Shorts link.',
      });
    }

    console.log(`[fetch-transcript] Processing video: ${videoId}`);

    // Fetch title in parallel
    const titlePromise = fetchVideoTitle(videoId);

    // Try strategies in order
    let result: { text: string; method: string } | null = null;

    // Strategy 1: Supadata (primary - works from datacenter IPs)
    try {
      result = await fetchViaSupadata(videoId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[supadata] Failed: ${msg}`);
      
      // If video is unavailable/private, return error immediately
      if (msg.includes('unavailable') || msg.includes('private')) {
        return res.status(422).json({ error: 'This video is unavailable or private.' });
      }
    }

    // Strategy 2: Innertube (fallback - free)
    if (!result) {
      try {
        result = await fetchViaInnertube(videoId);
      } catch (err) {
        console.warn(`[innertube] Failed: ${err}`);
      }
    }

    if (!result || result.text.length < 50) {
      return res.status(422).json({
        error: "Could not retrieve transcript. This video may not have captions enabled.",
      });
    }

    // Clean and return
    const { transcript, wasTruncated } = cleanTranscript(result.text);
    const title = await titlePromise;

    if (transcript.length < 50) {
      return res.status(422).json({
        error: 'Transcript is too short to generate content from.',
      });
    }

    console.log(`[fetch-transcript] Success via ${result.method}: ${transcript.length} chars`);

    return res.status(200).json({
      transcript,
      videoId,
      title,
      characters: transcript.length,
      wasTruncated,
      method: result.method,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[fetch-transcript] Error:', msg);

    return res.status(500).json({
      error: 'Failed to fetch transcript. Please try another video.',
    });
  }
}
