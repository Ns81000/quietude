import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://quietude-one.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function getAllowedOrigin(origin: string | undefined): string {
  if (!origin) return ALLOWED_ORIGINS[0] || 'https://quietude-one.vercel.app';
  return ALLOWED_ORIGINS.includes(origin) ? origin : '';
}

function getClientIp(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(clientId);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  return false;
}

function getGeminiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }

  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`] || process.env[`VITE_GEMINI_KEY_${i}`];
    if (key) keys.push(key);
  }

  return keys;
}

function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource exhausted')
  );
}

let keyIndex = Math.floor(Math.random() * 100);

async function generateWithFailover(
  keys: string[],
  modelName: string,
  contents: unknown
): Promise<string> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < keys.length) {
    keyIndex = (keyIndex + 1) % keys.length;
    const key = keys[keyIndex];

    try {
      const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contents as any);
      return result.response.text();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (!isQuotaError(err.message)) {
        throw err;
      }

      attempts += 1;
    }
  }

  throw lastError || new Error('All Gemini keys exhausted');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!allowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
  }

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    return res.status(503).json({ error: 'Gemini is not configured on the server.' });
  }

  try {
    const { modelName = 'gemini-2.5-flash', contents } = req.body || {};

    if (!contents) {
      return res.status(400).json({ error: 'Missing contents payload.' });
    }

    const text = await generateWithFailover(keys, modelName, contents);
    return res.status(200).json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini generation failed';
    return res.status(500).json({ error: message });
  }
}
