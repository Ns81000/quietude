import type { VercelRequest, VercelResponse } from '@vercel/node';

const TRANSCRIPT_CHAR_LIMIT = 50_000;

// Noise tokens to strip from auto-generated captions
const NOISE_RE = /\[(?:music|applause|laughter|inaudible|crosstalk|silence|sound|noise|cheering|clapping)[^\]]*\]/gi;
const MUSIC_LINE_RE = /♪[^♪]*♪/g;

// Innertube client configurations
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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  },
] as const;

// Extract video ID from YouTube URL
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
  // Check if it's just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

// Fetch video title via oEmbed
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: 'no-store' }
    );
    if (!res.ok) return videoId;
    const data = await res.json();
    return (data.title as string) || videoId;
  } catch {
    return videoId;
  }
}

// Clean transcript text
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

interface CaptionTrack {
  baseUrl: string;
  name?: { simpleText?: string; runs?: { text: string }[] };
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

// Fetch transcript via Innertube API
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

      // Fetch caption XML
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

      // Parse segments from XML
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

    // Fetch title in parallel with transcript
    const titlePromise = fetchVideoTitle(videoId);

    // Try Innertube
    let rawText: string | null = null;
    let method = 'unknown';

    try {
      const innertubeResult = await fetchViaInnertube(videoId);
      if (innertubeResult) {
        rawText = innertubeResult.segments.join(' ');
        method = innertubeResult.method;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'PRIVATE') {
        return res.status(422).json({ error: 'This video is private.' });
      }
      if (msg === 'UNAVAILABLE') {
        return res.status(422).json({ error: 'This video is unavailable.' });
      }
      console.warn(`[fetch-transcript] Innertube failed: ${msg}`);
    }

    if (!rawText || rawText.length < 50) {
      return res.status(422).json({
        error: "Could not retrieve transcript. This video may not have captions enabled, or it's age-restricted.",
      });
    }

    // Clean and return
    const { transcript, wasTruncated } = cleanTranscript(rawText);
    const title = await titlePromise;

    if (transcript.length < 50) {
      return res.status(422).json({
        error: 'Transcript is too short to generate content from.',
      });
    }

    console.log(`[fetch-transcript] Success via ${method}: ${transcript.length} chars`);

    return res.status(200).json({
      transcript,
      videoId,
      title,
      characters: transcript.length,
      wasTruncated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[fetch-transcript] Error:', msg);

    return res.status(500).json({
      error: 'Failed to fetch transcript. Please try another video.',
    });
  }
}
