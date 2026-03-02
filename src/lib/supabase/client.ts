import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in production (use proxy to bypass ISP blocks)
const isProduction = import.meta.env.PROD;
const PROXY_ENDPOINT = '/api/supabase-proxy';

// Check if we have valid configuration
const hasValidConfig = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

if (!hasValidConfig) {
  console.warn(
    '[Supabase] Missing or invalid environment variables. Running in offline-only mode.',
    '\nSet VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Custom fetch that proxies requests through Vercel API in production
 * to bypass ISP-level blocks on supabase.co domains (e.g., in India)
 */
const proxyFetch: typeof fetch = async (input, init) => {
  // Only proxy in production
  if (!isProduction) {
    return fetch(input, init);
  }
  
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    
    // Only proxy requests to Supabase
    if (!url.includes(supabaseUrl!)) {
      return fetch(input, init);
    }
    
    // Extract the path after the Supabase URL
    const supabasePath = url.replace(supabaseUrl!, '').replace(/^\//, '');
    
    // Build proxy URL
    const proxyUrl = `${PROXY_ENDPOINT}?path=${encodeURIComponent(supabasePath)}`;
    
    console.log(`[Proxy] Routing request through proxy: ${supabasePath.split('?')[0]}`);
    
    // Forward the request to our proxy
    const response = await fetch(proxyUrl, {
      method: init?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> || {}),
      },
      body: init?.body,
    });
    
    return response;
  } catch (error) {
    console.error('[Proxy] Request failed, falling back to direct:', error);
    // Fallback to direct request if proxy fails
    return fetch(input, init);
  }
};

// Create the client - always create it but only use when configured
const client: SupabaseClient<Database> | null = hasValidConfig
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage,
        storageKey: 'quietude:auth',
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        // Use custom fetch that routes through proxy in production
        fetch: proxyFetch,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

// Export a getter that ensures the client exists
export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    throw new Error('Supabase is not configured. Check your environment variables.');
  }
  return client;
}

// Legacy export for compatibility - use with caution
export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return hasValidConfig && client !== null;
}

export async function checkConnection(): Promise<boolean> {
  if (!isSupabaseConfigured() || !client) return false;
  
  try {
    // Use a simple health check that doesn't require table access
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error && error.code === '42P01') {
      // Table doesn't exist yet - Supabase is connected but schema not set up
      console.warn('[Supabase] Tables not created yet. Run the schema.sql file.');
      return true;
    }
    return !error;
  } catch (err) {
    console.error('[Supabase] Connection check failed:', err);
    return false;
  }
}
