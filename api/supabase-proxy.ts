import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Supabase Proxy API Route
 * 
 * This proxies all Supabase REST API requests through Vercel to bypass
 * ISP-level blocks on supabase.co domains in certain regions (e.g., India).
 * 
 * Flow: Frontend → Vercel API → Supabase → Vercel API → Frontend
 * 
 * The ISP only sees traffic to your Vercel domain, not to supabase.co
 */

export const config = {
  maxDuration: 30,
};

// Get Supabase config from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, Prefer, X-Client-Info, Accept, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Preference-Applied');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Validate configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Proxy] Missing Supabase configuration');
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  
  try {
    // Get the path to proxy from query parameter
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    
    // The path comes URL-encoded and may contain query params
    // e.g., "rest/v1/profiles?select=*&id=eq.xxx"
    // We need to properly construct the full URL
    
    // Ensure SUPABASE_URL doesn't have trailing slash
    const baseUrl = SUPABASE_URL!.replace(/\/$/, '');
    
    // Construct full URL - path already contains query string if any
    const targetUrl = `${baseUrl}/${path}`;
    
    console.log(`[Proxy] ${req.method} -> ${path.split('?')[0]}`);
    
    // Prepare headers for Supabase
    const headers: Record<string, string> = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    // Forward specific headers from the request
    if (req.headers['prefer']) {
      headers['Prefer'] = req.headers['prefer'] as string;
    }
    if (req.headers['x-client-info']) {
      headers['X-Client-Info'] = req.headers['x-client-info'] as string;
    }
    if (req.headers['accept']) {
      headers['Accept'] = req.headers['accept'] as string;
    }
    if (req.headers['range']) {
      headers['Range'] = req.headers['range'] as string;
    }
    // If client sends their own Authorization (e.g., user-specific token), use it
    if (req.headers['authorization'] && !req.headers['authorization'].includes('undefined')) {
      headers['Authorization'] = req.headers['authorization'] as string;
    }
    
    // Make the request to Supabase
    const supabaseResponse = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body 
        ? JSON.stringify(req.body) 
        : undefined,
    });
    
    // Get response data
    const contentType = supabaseResponse.headers.get('content-type') || '';
    let data: unknown;
    
    if (contentType.includes('application/json')) {
      data = await supabaseResponse.json();
    } else {
      data = await supabaseResponse.text();
    }
    
    // Forward relevant headers from Supabase response
    const contentRange = supabaseResponse.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }
    
    const preferenceApplied = supabaseResponse.headers.get('preference-applied');
    if (preferenceApplied) {
      res.setHeader('Preference-Applied', preferenceApplied);
    }
    
    // Return the response with same status code
    return res.status(supabaseResponse.status).json(data);
    
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
