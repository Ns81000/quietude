import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
