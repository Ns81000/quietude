export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  transcript: string;
  duration?: string;
  characters?: number;
  wasTruncated?: boolean;
}

export type YouTubeErrorType = 
  | 'INVALID_URL'
  | 'NO_CAPTIONS'
  | 'VIDEO_UNAVAILABLE'
  | 'AGE_RESTRICTED'
  | 'PRIVATE_VIDEO'
  | 'NETWORK_ERROR'
  | 'EMPTY_TRANSCRIPT'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export interface YouTubeError {
  type: YouTubeErrorType;
  message: string;
  userMessage: string;
}

const YOUTUBE_URL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export function extractVideoId(url: string): string | null {
  const trimmedUrl = url.trim();
  
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

function categorizeError(error: unknown): YouTubeError {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  if (errorMessage.includes('no captions') ||
      errorMessage.includes('transcript') && errorMessage.includes('disabled') ||
      errorMessage.includes('captions') && errorMessage.includes('not') ||
      errorMessage.includes('subtitles')) {
    return {
      type: 'NO_CAPTIONS',
      message: errorMessage,
      userMessage: "This video doesn't have captions available. Try a video with subtitles or auto-generated captions enabled.",
    };
  }
  
  if (errorMessage.includes('unavailable') || 
      errorMessage.includes('not found') ||
      errorMessage.includes('does not exist')) {
    return {
      type: 'VIDEO_UNAVAILABLE',
      message: errorMessage,
      userMessage: "This video is unavailable or doesn't exist. Please check the link and try again.",
    };
  }
  
  if (errorMessage.includes('age') || 
      errorMessage.includes('restricted') ||
      errorMessage.includes('sign in')) {
    return {
      type: 'AGE_RESTRICTED',
      message: errorMessage,
      userMessage: "This video is age-restricted. Please try a different video.",
    };
  }
  
  if (errorMessage.includes('private')) {
    return {
      type: 'PRIVATE_VIDEO',
      message: errorMessage,
      userMessage: "This video is private. Please try a public video.",
    };
  }
  
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429')) {
    return {
      type: 'RATE_LIMITED',
      message: errorMessage,
      userMessage: "Too many requests. Please wait a moment and try again.",
    };
  }
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('cors') ||
      errorMessage.includes('failed to fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMessage,
      userMessage: "Couldn't connect. Please check your internet connection and try again.",
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: "Something went wrong. Please try another video or paste the content manually.",
  };
}

// API endpoint - uses serverless function on Vercel, falls back to CORS proxy locally
async function fetchFromApi(url: string): Promise<YouTubeVideoInfo> {
  // Try the serverless API first (works on Vercel deployment)
  const apiUrl = '/api/fetch-transcript';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transcript');
    }
    
    return {
      videoId: data.videoId,
      title: data.title,
      transcript: data.transcript,
      characters: data.characters,
      wasTruncated: data.wasTruncated,
    };
  } catch (err) {
    // If API fails (e.g., local dev without serverless), fall back to CORS proxy
    console.warn('[YouTube] API route failed, trying CORS proxy fallback:', err);
    return fetchViaCorsProxy(url);
  }
}

// CORS proxy fallback for local development
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (response.ok) {
        return await response.text();
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn('[YouTube] Proxy failed, trying next...', err);
    }
  }
  
  throw lastError || new Error('All proxies failed');
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

function extractCaptionTracks(html: string): CaptionTrack[] {
  const patterns = [
    /"captionTracks":\s*(\[[\s\S]*?\])/,
    /\\"captionTracks\\":\s*(\[[\s\S]*?\])/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        let jsonStr = match[1]
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\u0026/g, '&');
        
        const tracks = JSON.parse(jsonStr) as CaptionTrack[];
        if (Array.isArray(tracks) && tracks.length > 0) {
          return tracks;
        }
      } catch {
        // Try next pattern
      }
    }
  }
  
  return [];
}

function selectBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  
  const preferences = [
    (t: CaptionTrack) => t.languageCode === 'en' && t.kind !== 'asr',
    (t: CaptionTrack) => t.languageCode === 'en',
    (t: CaptionTrack) => t.languageCode?.startsWith('en'),
    (t: CaptionTrack) => t.kind !== 'asr',
    () => true,
  ];
  
  for (const pref of preferences) {
    const track = tracks.find(pref);
    if (track) return track;
  }
  
  return tracks[0];
}

async function fetchViaCorsProxy(url: string): Promise<YouTubeVideoInfo> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw { type: 'INVALID_URL', message: 'Invalid URL', userMessage: 'Please enter a valid YouTube URL.' } as YouTubeError;
  }
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const html = await fetchWithProxy(videoUrl);
  
  if (html.includes('Video unavailable') || html.includes('is not available')) {
    throw { type: 'VIDEO_UNAVAILABLE', message: 'Video unavailable', userMessage: "This video is unavailable." } as YouTubeError;
  }
  
  const captionTracks = extractCaptionTracks(html);
  
  if (captionTracks.length === 0) {
    throw { type: 'NO_CAPTIONS', message: 'No captions', userMessage: "This video doesn't have captions. Try another video." } as YouTubeError;
  }
  
  const bestTrack = selectBestTrack(captionTracks);
  if (!bestTrack?.baseUrl) {
    throw { type: 'NO_CAPTIONS', message: 'No caption URL', userMessage: "Couldn't access captions. Try another video." } as YouTubeError;
  }
  
  const xml = await fetchWithProxy(bestTrack.baseUrl);
  
  const segments: string[] = [];
  const textPattern = /<text[^>]*>([^<]*)<\/text>/g;
  let match;
  while ((match = textPattern.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
    if (text) segments.push(text);
  }
  
  const transcript = segments.join(' ').replace(/\s+/g, ' ').replace(/\[.*?\]/g, '').trim();
  
  if (transcript.length < 100) {
    throw { type: 'EMPTY_TRANSCRIPT', message: 'Too short', userMessage: "Transcript is too short. Try a longer video." } as YouTubeError;
  }
  
  const title = await fetchVideoTitle(videoId);
  
  return { videoId, title, transcript, characters: transcript.length };
}

export async function fetchTranscript(url: string): Promise<YouTubeVideoInfo> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    const error: YouTubeError = {
      type: 'INVALID_URL',
      message: 'Invalid YouTube URL format',
      userMessage: "Please paste a valid YouTube link (e.g., youtube.com/watch?v=... or youtu.be/...)",
    };
    throw error;
  }
  
  try {
    return await fetchFromApi(url);
  } catch (error) {
    if ((error as YouTubeError).type) {
      throw error;
    }
    
    const categorizedError = categorizeError(error);
    throw categorizedError;
  }
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const oEmbedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(oEmbedUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.title) {
        return data.title;
      }
    }
  } catch {
    // Silently fail
  }
  
  return `YouTube Video`;
}

export function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
