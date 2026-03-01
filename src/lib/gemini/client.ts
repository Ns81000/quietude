/**
 * Gemini API Client with Production-Grade Key Pool Management
 * 
 * Features:
 * - Supports unlimited API keys (5-6+ recommended)
 * - Instant failover when a key hits quota or errors
 * - Exhausted keys are disabled for 24 hours automatically
 * - Smart key rotation based on usage and health
 * - Detailed error tracking per key
 * - Robust retry mechanism with automatic key switching
 * - Zero delay key switching on failures
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// ============= API KEYS CONFIGURATION =============
// Add as many keys as you want - they will all be used in rotation
const API_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
  import.meta.env.VITE_GEMINI_KEY_5,
  import.meta.env.VITE_GEMINI_KEY_6,
].filter(Boolean) as string[];

// Log keys status on load
console.log(`[Gemini] Loaded ${API_KEYS.length} API key(s)`);

// ============= KEY STATE MANAGEMENT =============
interface KeyState {
  index: number;
  requestsToday: number;
  lastUsed: number;
  lastError: string | null;
  lastErrorTime: number | null;
  consecutiveErrors: number;
  isExhausted: boolean;        // True if key hit quota limit
  exhaustedAt: number | null;  // Timestamp when key was marked exhausted
  resetAt: number;             // When daily counters reset (midnight UTC)
}

const STORAGE_KEY = "quietude_gemini_keys_v2";
const DAILY_LIMIT = 250;                    // Conservative estimate per key
const EXHAUSTED_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_CONSECUTIVE_ERRORS = 3;           // Mark key as problematic after this many errors

// ============= STATE PERSISTENCE =============

function getNextMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function initializeKeyStates(): KeyState[] {
  return API_KEYS.map((_, index) => ({
    index,
    requestsToday: 0,
    lastUsed: 0,
    lastError: null,
    lastErrorTime: null,
    consecutiveErrors: 0,
    isExhausted: false,
    exhaustedAt: null,
    resetAt: getNextMidnight(),
  }));
}

function loadKeyStates(): KeyState[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initializeKeyStates();
    
    const states = JSON.parse(stored) as KeyState[];
    const now = Date.now();
    
    // Ensure we have states for all keys (in case new keys were added)
    const updatedStates: KeyState[] = API_KEYS.map((_, index) => {
      const existing = states.find(s => s.index === index);
      
      if (!existing) {
        // New key added
        return {
          index,
          requestsToday: 0,
          lastUsed: 0,
          lastError: null,
          lastErrorTime: null,
          consecutiveErrors: 0,
          isExhausted: false,
          exhaustedAt: null,
          resetAt: getNextMidnight(),
        };
      }
      
      // Reset daily counters if past midnight
      if (now >= existing.resetAt) {
        return {
          ...existing,
          requestsToday: 0,
          consecutiveErrors: 0,
          isExhausted: false,
          exhaustedAt: null,
          lastError: null,
          lastErrorTime: null,
          resetAt: getNextMidnight(),
        };
      }
      
      // Check if exhausted key's 24h cooldown has passed
      if (existing.isExhausted && existing.exhaustedAt) {
        if (now - existing.exhaustedAt >= EXHAUSTED_COOLDOWN) {
          return {
            ...existing,
            isExhausted: false,
            exhaustedAt: null,
            consecutiveErrors: 0,
            lastError: null,
          };
        }
      }
      
      return existing;
    });
    
    return updatedStates;
  } catch {
    return initializeKeyStates();
  }
}

function saveKeyStates(states: KeyState[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch {
    // Storage unavailable - continue without persistence
  }
}

// In-memory cache for performance (synced with localStorage)
let keyStatesCache: KeyState[] | null = null;

function getKeyStates(): KeyState[] {
  if (!keyStatesCache) {
    keyStatesCache = loadKeyStates();
  }
  return keyStatesCache;
}

function updateKeyStates(updater: (states: KeyState[]) => KeyState[]): void {
  const states = getKeyStates();
  const updated = updater(states);
  keyStatesCache = updated;
  saveKeyStates(updated);
}

// ============= KEY SELECTION =============

/**
 * Get all available (non-exhausted) keys sorted by preference
 */
function getAvailableKeys(): KeyState[] {
  const states = getKeyStates();
  
  return states
    .filter(s => {
      // Skip exhausted keys
      if (s.isExhausted) return false;
      // Skip keys with too many consecutive errors (temporary cooldown)
      if (s.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return false;
      // Skip keys at daily limit
      if (s.requestsToday >= DAILY_LIMIT) return false;
      return true;
    })
    .sort((a, b) => {
      // Prefer keys with fewer errors
      if (a.consecutiveErrors !== b.consecutiveErrors) {
        return a.consecutiveErrors - b.consecutiveErrors;
      }
      // Then prefer keys with lower usage
      return a.requestsToday - b.requestsToday;
    });
}

/**
 * Select the best available key
 */
function selectKey(excludeIndices: number[] = []): { key: string; index: number } | null {
  const available = getAvailableKeys().filter(s => !excludeIndices.includes(s.index));
  
  if (available.length === 0) {
    return null;
  }
  
  const selected = available[0];
  
  // Update usage count
  updateKeyStates(states => 
    states.map(s => 
      s.index === selected.index
        ? { ...s, requestsToday: s.requestsToday + 1, lastUsed: Date.now() }
        : s
    )
  );
  
  return { key: API_KEYS[selected.index], index: selected.index };
}

/**
 * Mark a key as having an error
 */
function markKeyError(index: number, error: string, isQuotaError: boolean = false): void {
  updateKeyStates(states =>
    states.map(s => {
      if (s.index !== index) return s;
      
      const newConsecutiveErrors = s.consecutiveErrors + 1;
      
      // If quota error, mark as exhausted for 24 hours
      if (isQuotaError) {
        console.log(`[Gemini] Key ${index + 1} marked as EXHAUSTED (quota limit)`);
        return {
          ...s,
          lastError: error,
          lastErrorTime: Date.now(),
          consecutiveErrors: newConsecutiveErrors,
          isExhausted: true,
          exhaustedAt: Date.now(),
        };
      }
      
      return {
        ...s,
        lastError: error,
        lastErrorTime: Date.now(),
        consecutiveErrors: newConsecutiveErrors,
      };
    })
  );
}

/**
 * Mark a key as successful (reset error counters)
 */
function markKeySuccess(index: number): void {
  updateKeyStates(states =>
    states.map(s =>
      s.index === index
        ? { ...s, consecutiveErrors: 0, lastError: null, lastErrorTime: null }
        : s
    )
  );
}

// ============= PUBLIC API =============

/**
 * Check if any API keys are configured
 */
export function hasApiKeys(): boolean {
  return API_KEYS.length > 0;
}

/**
 * Get a Gemini client with a specific key index
 */
function getClientWithKey(keyIndex: number): GoogleGenerativeAI {
  return new GoogleGenerativeAI(API_KEYS[keyIndex]);
}

/**
 * Get a model instance (will select best available key)
 */
export function getModel(modelName: string = "gemini-2.5-flash"): GenerativeModel {
  const selected = selectKey();
  if (!selected) {
    throw new Error("QUOTA_EXHAUSTED: All API keys have reached their daily limit. Please try again tomorrow.");
  }
  const client = new GoogleGenerativeAI(selected.key);
  return client.getGenerativeModel({ model: modelName });
}

/**
 * Create a Gemini client (for backwards compatibility)
 */
export function getGeminiClient(): GoogleGenerativeAI {
  const selected = selectKey();
  if (!selected) {
    throw new Error("QUOTA_EXHAUSTED: All API keys have reached their daily limit. Please try again tomorrow.");
  }
  return new GoogleGenerativeAI(selected.key);
}

/**
 * Check if an error indicates quota exhaustion
 */
function isQuotaError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("resource exhausted") ||
    message.includes("limit exceeded")
  );
}

/**
 * Check if an error is retryable (not a permanent failure)
 */
function isRetryableError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  // Don't retry invalid content, bad requests, or authentication errors
  if (message.includes("invalid") || message.includes("400") || message.includes("401") || message.includes("403")) {
    return false;
  }
  return true;
}

/**
 * Create a promise that rejects after a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`TIMEOUT: Request timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Production-grade API call wrapper with:
 * - Automatic key rotation on failures
 * - Instant failover (no delays for key switching)
 * - Smart retry logic
 * - Quota tracking and 24h cooldown
 */
export async function safeGeminiCall<T>(
  fn: (model: GenerativeModel) => Promise<T>,
  maxRetries: number = 2,
  timeoutMs: number = 60000,
  modelName: string = "gemini-2.5-flash"
): Promise<T> {
  const triedKeys: number[] = [];
  let lastError: Error | null = null;
  
  // Try each available key
  while (true) {
    const selected = selectKey(triedKeys);
    
    if (!selected) {
      // No more keys available
      const errorMsg = triedKeys.length > 0
        ? `All ${triedKeys.length} API keys failed. Last error: ${lastError?.message || "Unknown"}`
        : "No API keys available. All keys are either exhausted or at their daily limit.";
      throw new Error(`QUOTA_EXHAUSTED: ${errorMsg}`);
    }
    
    triedKeys.push(selected.index);
    console.log(`[Gemini] Using key ${selected.index + 1}/${API_KEYS.length}`);
    
    // Try this key with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = getClientWithKey(selected.index);
        const model = client.getGenerativeModel({ model: modelName });
        
        const result = await withTimeout(fn(model), timeoutMs);
        
        // Success! Reset error counters for this key
        markKeySuccess(selected.index);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        const errorMsg = lastError.message || "Unknown error";
        
        console.log(`[Gemini] Key ${selected.index + 1} attempt ${attempt + 1} failed: ${errorMsg}`);
        
        // Check if this is a quota error
        if (isQuotaError(lastError)) {
          // Mark key as exhausted and immediately try next key
          markKeyError(selected.index, errorMsg, true);
          break; // Exit retry loop, try next key
        }
        
        // Check if error is retryable
        if (!isRetryableError(lastError)) {
          // Non-retryable error (invalid content, auth error, etc.)
          throw new Error(`API_ERROR: ${errorMsg}`);
        }
        
        // Track the error
        markKeyError(selected.index, errorMsg, false);
        
        // For timeout errors, try next key immediately (no retry on same key)
        if (errorMsg.includes("TIMEOUT")) {
          break; // Try next key
        }
        
        // Wait briefly before retry on same key (only for transient errors)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        }
      }
    }
    
    // If we've tried all keys, throw the last error
    if (triedKeys.length >= API_KEYS.length) {
      throw lastError || new Error("All API keys exhausted");
    }
    
    // Otherwise, loop continues to try next key
    console.log(`[Gemini] Switching to next available key...`);
  }
}

/**
 * Simplified API call (backwards compatible)
 * For functions that already have a model instance
 * Use this when you've already called getModel() elsewhere
 */
export async function safeGeminiCallSimple<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  timeoutMs: number = 60000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      if (!isRetryableError(lastError)) {
        throw lastError;
      }
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("Unknown error");
}

/**
 * Legacy-compatible safeGeminiCall that accepts a simple function
 * This will select a key and handle retries with key rotation
 * @deprecated Use the model-based safeGeminiCall for better key rotation
 */
export async function safeGeminiCallLegacy<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  timeoutMs: number = 60000
): Promise<T> {
  // For legacy calls, wrap in the new system
  return safeGeminiCall(
    async () => fn(),
    retries,
    timeoutMs
  );
}

// ============= UTILITY FUNCTIONS =============

/**
 * Clear all key states (useful for debugging or after adding new keys)
 */
export function clearQuotaCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    keyStatesCache = null;
    console.log("[Gemini] Key states cache cleared");
  } catch {
    // Ignore
  }
}

/**
 * Get current quota status across all keys
 */
export function getQuotaStatus(): {
  available: number;
  total: number;
  keysTotal: number;
  keysAvailable: number;
  keysExhausted: number;
  details: Array<{
    index: number;
    requests: number;
    isExhausted: boolean;
    hasErrors: boolean;
  }>;
} {
  const states = getKeyStates();
  const totalCapacity = API_KEYS.length * DAILY_LIMIT;
  const used = states.reduce((sum, s) => sum + s.requestsToday, 0);
  const exhaustedCount = states.filter(s => s.isExhausted).length;
  const availableCount = states.filter(s => !s.isExhausted && s.requestsToday < DAILY_LIMIT).length;
  
  return {
    available: totalCapacity - used,
    total: totalCapacity,
    keysTotal: API_KEYS.length,
    keysAvailable: availableCount,
    keysExhausted: exhaustedCount,
    details: states.map(s => ({
      index: s.index,
      requests: s.requestsToday,
      isExhausted: s.isExhausted,
      hasErrors: s.consecutiveErrors > 0,
    })),
  };
}

/**
 * Force refresh key states from storage (useful after manual changes)
 */
export function refreshKeyStates(): void {
  keyStatesCache = null;
  getKeyStates();
}

/**
 * Convert File to base64 data for Gemini multimodal input
 */
export async function fileToGenerativePart(
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get supported MIME types for Gemini multimodal
 */
export function getSupportedMimeTypes(): string[] {
  return [
    // Images
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
    // PDFs
    "application/pdf",
    // Audio
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    // Text
    "text/plain",
    "text/markdown",
  ];
}

/**
 * Check if file type is supported for multimodal processing
 */
export function isMultimodalSupported(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType);
}

// Export types
export type { KeyState };
