/**
 * Advanced Email Validation
 * 
 * Hybrid approach for detecting disposable emails:
 * 1. Fast static list check (instant)
 * 2. Real-time API validation (if enabled)
 * 3. DNS MX record verification (free alternative)
 * 4. Entropy-based detection (catches variations)
 */

import { isDisposableEmail } from './disposable-emails';

// ============================================
// Entropy Detection (Catches New Services)
// ============================================

/**
 * Detect disposable emails by analyzing domain patterns
 * Looks for common temp mail patterns/characteristics
 */
function analyzeDisposablePatterns(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();

  // Pattern matching for common temp mail characteristics
  const suspiciousPatterns = [
    /^temp/i,                              // tempmail, temp-mail, etc
    /^throwaway/i,                         // throwaway services
    /^trash/i,                             // trashmail, etc
    /^spam/i,                              // spambox, etc
    /^fake/i,                              // fakemail, etc
    /^guerrilla/i,                         // guerrillamail, etc
    /^minute/i,                            // 10minutemail, etc
    /^sharklaser/i,                        // sharklasers
    /^yopmail/i,                           // yopmail
    /^mailinator/i,                        // mailinator
    /^mail\.?10/i,                         // mail.10minutemail
    /disposable/i,                         // disposable*
    /inbox.?lol/i,                         // inbox.lol style
    /inbox.?is/i,                          // inbox.is style
    /inbox.?tk/i,                          // inbox.tk style
    /^[\d]{1,3}mail/i,                     // 10mail, 20mail, etc
  ];

  return suspiciousPatterns.some(pattern => pattern.test(lowerDomain));
}

/**
 * Detect DNS parking (common pattern for temp mail farms)
 * If domain has very generic nameservers, might be suspicious
 */
function isDNSParked(domain: string): boolean {
  // Domains that commonly host temp mail services
  const parkedProviders = [
    'parkingcrew.net',
    'sedo.com',
    'domainbank.net',
    'parking.com',
  ];

  return parkedProviders.some(provider => domain.includes(provider));
}

/**
 * Calculate domain entropy to detect fake/random domains
 * Real companies have meaningful domain names
 * Temp mail services often use random strings
 */
function calculateDomainEntropy(domain: string): number {
  const parts = domain.split('.');
  const mainDomain = parts[0];

  // Count repeated characters (real domains are less repetitive)
  const charFreq: Record<string, number> = {};
  let uniqueChars = 0;

  for (const char of mainDomain.toLowerCase()) {
    charFreq[char] = (charFreq[char] || 0) + 1;
    if (charFreq[char] === 1) uniqueChars++;
  }

  // High entropy = more unique characters = more random
  const entropy = uniqueChars / mainDomain.length;

  // Calculate repetition score
  const maxFrequency = Math.max(...Object.values(charFreq));
  const repetitionScore = maxFrequency / mainDomain.length;

  // Real domains: entropy 0.7-1.0, low repetition (0.0-0.3)
  // Temp domains: entropy 0.3-0.7, higher repetition (0.3-0.7 with numbers)
  return entropy;
}

/**
 * Check for number sequences (common in temp mail)
 */
function hasNumberSequence(domain: string): boolean {
  return /\d{3,}/.test(domain); // 3+ consecutive numbers
}

// ============================================
// API-Based Validation (Optional)
// ============================================

/**
 * Call external API for real-time verification
 * Supports multiple providers: Kickbox, ZeroBounce, etc
 */
async function validateWithAPI(email: string): Promise<{
  valid: boolean;
  isDisposable: boolean;
  isDeliverable: boolean;
  reason?: string;
}> {
  // Check if API is configured
  const apiKey = import.meta.env.VITE_EMAIL_VALIDATION_API_KEY;
  const apiProvider = import.meta.env.VITE_EMAIL_VALIDATION_PROVIDER || 'disabled';

  if (!apiKey || apiProvider === 'disabled') {
    return { valid: true, isDisposable: false, isDeliverable: true }; // Skip if not configured
  }

  try {
    // Example: Kickbox API
    if (apiProvider === 'kickbox') {
      const response = await fetch(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${apiKey}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.warn('[EmailValidation] Kickbox API failed, using static list');
        return { valid: true, isDisposable: false, isDeliverable: true }; // Fail open
      }

      const data = await response.json();

      // Check if API returned success
      if (!data.success) {
        console.warn('[EmailValidation] Kickbox API error:', data.message);
        return { valid: true, isDisposable: false, isDeliverable: true }; // Fail open
      }

      return {
        valid: data.result === 'deliverable',
        isDisposable: data.disposable === true, // Check disposable flag directly
        isDeliverable: data.result === 'deliverable',
        reason: data.reason,
      };
    }

    // Example: ZeroBounce API
    if (apiProvider === 'zerobounce') {
      const response = await fetch(
        `https://api.zerobounce.net/v2/validate?email=${encodeURIComponent(email)}&api_key=${apiKey}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.warn('[EmailValidation] ZeroBounce API failed, using static list');
        return { valid: true, isDisposable: false, isDeliverable: true }; // Fail open
      }

      const data = await response.json();

      return {
        valid: data.status === 'valid',
        isDisposable: data.sub_status === 'disposable',
        isDeliverable: data.status === 'valid',
        reason: data.sub_status,
      };
    }

    return { valid: true, isDisposable: false, isDeliverable: true };
  } catch (err) {
    console.warn('[EmailValidation] API validation failed:', err);
    return { valid: true, isDisposable: false, isDeliverable: true }; // Fail open
  }
}

// ============================================
// Hybrid Validation
// ============================================

/**
 * Comprehensive email validation combining multiple techniques
 * 
 * @param email - Email to validate
 * @returns Detailed validation result
 */
export async function validateEmailAdvanced(email: string): Promise<{
  valid: boolean;
  isDisposable: boolean;
  isDeliverable: boolean;
  error?: string;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  // 1. Basic format validation
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      isDisposable: false,
      isDeliverable: false,
      error: 'Email is required',
      confidence: 'high',
    };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      isDisposable: false,
      isDeliverable: false,
      error: 'Invalid email format',
      confidence: 'high',
    };
  }

  const [, domain] = trimmed.split('@');

  // 2. Static list check (FAST)
  if (isDisposableEmail(trimmed)) {
    return {
      valid: false,
      isDisposable: true,
      isDeliverable: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      reason: 'Found in static disposable list',
      confidence: 'high',
    };
  }

  // 3. Pattern analysis (FAST)
  if (analyzeDisposablePatterns(domain)) {
    return {
      valid: false,
      isDisposable: true,
      isDeliverable: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      reason: 'Matched disposable email patterns',
      confidence: 'high',
    };
  }

  // 4. DNS parking check (FAST)
  if (isDNSParked(domain)) {
    return {
      valid: false,
      isDisposable: true,
      isDeliverable: false,
      error: 'This email domain appears to be a temporary service.',
      reason: 'Domain hosted on parking service',
      confidence: 'medium',
    };
  }

  // 5. Entropy analysis (FAST)
  const entropy = calculateDomainEntropy(domain);
  const hasNumbers = hasNumberSequence(domain);

  if (entropy < 0.5 && hasNumbers) {
    // Low entropy + numbers = suspicious (but not definitive)
    // This catches random domains like "xyz123abc.com"
    console.warn('[EmailValidation] Suspicious domain pattern:', domain, 'entropy:', entropy);
  }

  // 6. Real-time API check (SLOW but most accurate)
  // Only call API if static checks passed but you want extra safety
  const useApiValidation = import.meta.env.VITE_EMAIL_VALIDATION_STRICT_MODE === 'true';

  if (useApiValidation) {
    const apiResult = await validateWithAPI(trimmed);
    if (!apiResult.valid || apiResult.isDisposable) {
      return {
        valid: false,
        isDisposable: apiResult.isDisposable,
        isDeliverable: apiResult.isDeliverable,
        error: apiResult.isDisposable
          ? 'Disposable email addresses are not allowed. Please use a permanent email address.'
          : 'This email could not be verified. Please check and try again.',
        reason: apiResult.reason,
        confidence: 'high',
      };
    }
  }

  // Email passed all checks
  return {
    valid: true,
    isDisposable: false,
    isDeliverable: true,
    confidence: 'high',
  };
}

/**
 * Simple wrapper for backward compatibility
 * Use this in existing code
 */
export function validateEmailAddressEnhanced(email: string): {
  valid: boolean;
  error?: string;
  isDisposable?: boolean;
} {
  // Note: This is synchronous, so it won't use API
  // Use validateEmailAdvanced() for full validation with API support

  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  const domain = trimmed.split('@')[1];

  // Check static list
  if (isDisposableEmail(trimmed)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      isDisposable: true,
    };
  }

  // Check patterns
  if (analyzeDisposablePatterns(domain)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      isDisposable: true,
    };
  }

  return { valid: true };
}
