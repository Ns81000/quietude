import type { VercelRequest, VercelResponse } from '@vercel/node';

const TRANSCRIPT_CHAR_LIMIT = 50_000;

// Noise tokens to strip from auto-generated captions
const NOISE_RE = /\[(?:music|applause|laughter|inaudible|crosstalk|silence|sound|noise|cheering|clapping)[^\]]*\]/gi;
const MUSIC_LINE_RE = /♪[^♪]*♪/g;

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
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

// Fetch video title via oEmbed
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

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\n/g, ' ');
}

// Parse caption XML to segments
function parseXmlCaptions(xml: string): string[] {
  const segments: string[] = [];
  
  // Try parsing <text> or <p> tags
  const re = /<(?:text|p)[^>]*>([\s\S]*?)<\/(?:text|p)>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[1])
      .replace(/<[^>]+>/g, '')
      .trim();
    if (text) segments.push(text);
  }

  // Fallback: strip all tags
  if (segments.length === 0) {
    const plain = decodeHtmlEntities(xml)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (plain.length > 50) segments.push(plain);
  }

  return segments;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  vssId?: string;
}

// Method 1: Scrape YouTube page and extract captions from ytInitialPlayerResponse
async function fetchViaPageScrape(videoId: string): Promise<{ segments: string[]; method: string } | null> {
  console.log('[scrape] Fetching YouTube page...');
  
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!pageRes.ok) {
      console.warn(`[scrape] Page fetch failed: HTTP ${pageRes.status}`);
      return null;
    }

    const html = await pageRes.text();
    
    // Check for unavailable/private
    if (html.includes('Video unavailable') || html.includes('This video is private')) {
      throw new Error('UNAVAILABLE');
    }

    // Extract ytInitialPlayerResponse
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:\s*var|<\/script>)/s);
    if (!playerMatch) {
      console.warn('[scrape] Could not find ytInitialPlayerResponse');
      return null;
    }

    let playerData: {
      playabilityStatus?: { status: string };
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: CaptionTrack[];
        };
      };
    };

    try {
      playerData = JSON.parse(playerMatch[1]);
    } catch (e) {
      console.warn('[scrape] Failed to parse player response');
      return null;
    }

    if (playerData.playabilityStatus?.status !== 'OK') {
      console.warn(`[scrape] Playability status: ${playerData.playabilityStatus?.status}`);
      return null;
    }

    const tracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      console.warn('[scrape] No caption tracks found');
      return null;
    }

    // Prefer English manual > English auto > any
    const track =
      tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ||
      tracks.find((t) => t.languageCode === 'en') ||
      tracks.find((t) => t.languageCode?.startsWith('en')) ||
      tracks[0];

    console.log(`[scrape] Found caption track: ${track.languageCode} (${track.kind || 'manual'})`);

    // Fetch caption XML
    let captionUrl = track.baseUrl;
    if (!captionUrl.includes('fmt=')) {
      captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=srv3';
    }

    const xmlRes = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!xmlRes.ok) {
      console.warn(`[scrape] Caption XML fetch failed: HTTP ${xmlRes.status}`);
      return null;
    }

    const xml = await xmlRes.text();
    const segments = parseXmlCaptions(xml);

    if (segments.length > 0) {
      console.log(`[scrape] Success: ${segments.length} segments`);
      return { segments, method: 'page-scrape' };
    }

    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'UNAVAILABLE' || msg === 'PRIVATE') throw err;
    console.warn(`[scrape] Error: ${msg}`);
    return null;
  }
}

// Method 2: Use Innertube API with WEB_CREATOR client (works better from servers)
async function fetchViaInnertube(videoId: string): Promise<{ segments: string[]; method: string } | null> {
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
      label: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
      context: {
        client: {
          clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
          clientVersion: '2.0',
          hl: 'en',
          gl: 'US',
        },
        thirdParty: {
          embedUrl: 'https://www.youtube.com/',
        },
      },
    },
    {
      label: 'WEB',
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20241203.06.00',
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
            'X-Youtube-Client-Name': '1',
            'X-Youtube-Client-Version': '2.20241203.06.00',
          },
          body: JSON.stringify({
            context: client.context,
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
          }),
        }
      );

      if (!res.ok) {
        console.warn(`[innertube] ${client.label}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const status = data.playabilityStatus?.status;

      if (status !== 'OK') {
        const reason = data.playabilityStatus?.reason || status;
        console.warn(`[innertube] ${client.label}: ${reason}`);
        if (reason?.toLowerCase().includes('private')) throw new Error('PRIVATE');
        continue;
      }

      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) {
        console.warn(`[innertube] ${client.label}: no caption tracks`);
        continue;
      }

      const track =
        tracks.find((t: CaptionTrack) => t.languageCode === 'en' && t.kind !== 'asr') ||
        tracks.find((t: CaptionTrack) => t.languageCode === 'en') ||
        tracks.find((t: CaptionTrack) => t.languageCode?.startsWith('en')) ||
        tracks[0];

      let captionUrl = track.baseUrl;
      if (!captionUrl.includes('fmt=')) {
        captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=srv3';
      }

      const xmlRes = await fetch(captionUrl);
      if (!xmlRes.ok) continue;

      const xml = await xmlRes.text();
      const segments = parseXmlCaptions(xml);

      if (segments.length > 0) {
        console.log(`[innertube] ${client.label}: ${segments.length} segments`);
        return { segments, method: `innertube-${client.label}` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'PRIVATE' || msg === 'UNAVAILABLE') throw err;
      console.warn(`[innertube] ${client.label}: ${msg}`);
    }
  }

  return null;
}

// Method 3: Use timedtext API directly (sometimes works when others don't)
async function fetchViaTimedText(videoId: string): Promise<{ segments: string[]; method: string } | null> {
  const langs = ['en', 'en-US', 'en-GB', 'a.en'];
  
  for (const lang of langs) {
    try {
      console.log(`[timedtext] Trying lang=${lang}...`);
      
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!res.ok) continue;

      const xml = await res.text();
      if (!xml || xml.length < 100) continue;

      const segments = parseXmlCaptions(xml);
      if (segments.length > 0) {
        console.log(`[timedtext] Success with lang=${lang}: ${segments.length} segments`);
        return { segments, method: `timedtext-${lang}` };
      }
    } catch (err) {
      console.warn(`[timedtext] ${lang}: ${err}`);
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

    // Fetch title in parallel
    const titlePromise = fetchVideoTitle(videoId);

    // Try multiple methods in order of reliability
    let result: { segments: string[]; method: string } | null = null;
    let lastError: Error | null = null;

    // Method 1: Page scrape (most reliable from servers)
    try {
      result = await fetchViaPageScrape(videoId);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message === 'UNAVAILABLE') {
        return res.status(422).json({ error: 'This video is unavailable or private.' });
      }
      if (lastError.message === 'PRIVATE') {
        return res.status(422).json({ error: 'This video is private.' });
      }
    }

    // Method 2: Innertube API
    if (!result) {
      try {
        result = await fetchViaInnertube(videoId);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message === 'PRIVATE') {
          return res.status(422).json({ error: 'This video is private.' });
        }
      }
    }

    // Method 3: Direct timedtext API
    if (!result) {
      result = await fetchViaTimedText(videoId);
    }

    if (!result || result.segments.join(' ').length < 50) {
      return res.status(422).json({
        error: "Could not retrieve transcript. This video may not have captions enabled, or it's region-restricted.",
      });
    }

    // Clean and return
    const rawText = result.segments.join(' ');
    const { transcript, wasTruncated } = cleanTranscript(rawText);
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
