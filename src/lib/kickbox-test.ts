/**
 * Kickbox Layer 4 Integration Test Utility
 * Use this to verify Kickbox is working before deploying
 */

/**
 * Test if Kickbox API is properly configured and connected
 * 
 * @example
 * ```typescript
 * const result = await testKickboxConnection();
 * console.log(result);
 * // {
 * //   success: true,
 * //   message: "Kickbox API is working!",
 * //   email: "test@kickbox.io",
 * //   sandboxMode: true,
 * //   response: {...}
 * // }
 * ```
 */
export async function testKickboxConnection() {
  const apiKey = import.meta.env.VITE_EMAIL_VALIDATION_API_KEY;
  const provider = import.meta.env.VITE_EMAIL_VALIDATION_PROVIDER;
  const strictMode = import.meta.env.VITE_EMAIL_VALIDATION_STRICT_MODE;

  console.log('🔍 Kickbox Configuration Check:');
  console.log('  Provider:', provider);
  console.log('  Strict Mode:', strictMode);
  console.log('  API Key Present:', !!apiKey);

  if (!apiKey) {
    return {
      success: false,
      message: '❌ API Key not configured. Add VITE_EMAIL_VALIDATION_API_KEY to .env.local',
      configured: false,
    };
  }

  if (provider !== 'kickbox') {
    return {
      success: false,
      message: `❌ Wrong provider: "${provider}" (expected "kickbox")`,
      configured: false,
    };
  }

  // Test with sandbox email (no credits deducted)
  const testEmail = 'test@kickbox.io';

  try {
    console.log(`\n🧪 Testing Kickbox API with sandbox email: ${testEmail}`);

    const response = await fetch(
      `https://api.kickbox.com/v2/verify?email=${encodeURIComponent(testEmail)}&apikey=${apiKey}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `❌ Kickbox API returned ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        configured: true,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        message: `❌ Kickbox API Error: ${data.message}`,
        apiMessage: data.message,
        configured: true,
      };
    }

    console.log('✅ Kickbox API Connection Successful!');
    console.log('  Result:', data.result);
    console.log('  Reason:', data.reason);
    console.log('  Disposable:', data.disposable);
    console.log('  Sendex Score:', data.sendex);

    return {
      success: true,
      message: '✅ Kickbox API is working perfectly!',
      email: data.email,
      result: data.result,
      reason: data.reason,
      disposable: data.disposable,
      sendex: data.sendex,
      sandboxMode: true,
      response: data,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Network Error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
      configured: true,
    };
  }
}

/**
 * Test email validation with specific email address
 * 
 * @param email - Email to test
 * @example
 * ```typescript
 * const result = await testEmailValidation('user@tempmail.com');
 * console.log(result);
 * // {
 * //   valid: false,
 * //   isDisposable: true,
 * //   result: "undeliverable",
 * //   reason: "disposable_domain"
 * // }
 * ```
 */
export async function testEmailValidation(email: string) {
  const apiKey = import.meta.env.VITE_EMAIL_VALIDATION_API_KEY;

  if (!apiKey) {
    return {
      error: 'API Key not configured',
      email,
    };
  }

  try {
    console.log(`\n🧪 Testing email: ${email}`);

    const response = await fetch(
      `https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${apiKey}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return {
        error: `API Error: ${response.status}`,
        email,
        statusCode: response.status,
      };
    }

    const data = await response.json();

    console.log('  Result:', data.result);
    console.log('  Reason:', data.reason);
    console.log('  Disposable:', data.disposable);
    console.log('  Free:', data.free);
    console.log('  Sendex:', data.sendex);

    return {
      success: data.success,
      email: data.email,
      result: data.result,
      reason: data.reason,
      disposable: data.disposable,
      free: data.free,
      role: data.role,
      sendex: data.sendex,
      didYouMean: data.did_you_mean,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      email,
    };
  }
}

/**
 * Comprehensive test suite for Kickbox integration
 */
export async function runKickboxTestSuite() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Kickbox Layer 4 Integration Test Suite');
  console.log('═══════════════════════════════════════════\n');

  // Test 1: Configuration
  console.log('TEST 1: Configuration Check');
  console.log('─────────────────────────────────────────');
  const configCheck = testKickboxConnection();
  console.log('Result:', (await configCheck).success ? '✅ PASS' : '❌ FAIL');

  // Test 2: Valid email
  console.log('\nTEST 2: Valid Email (gmail.com)');
  console.log('─────────────────────────────────────────');
  const validTest = await testEmailValidation('john.doe@gmail.com');
  console.log('Result:', validTest.disposable !== true ? '✅ PASS' : '❌ FAIL');

  // Test 3: Disposable email
  console.log('\nTEST 3: Disposable Email (tempmail)');
  console.log('─────────────────────────────────────────');
  const disposableTest = await testEmailValidation('test@tempmail.com');
  console.log('Result:', disposableTest.disposable === true ? '✅ PASS' : '❌ FAIL');

  // Test 4: Invalid email
  console.log('\nTEST 4: Invalid Email');
  console.log('─────────────────────────────────────────');
  const invalidTest = await testEmailValidation('notanemail@invalid-domain-12345.xyz');
  console.log('Result:', invalidTest.result === 'undeliverable' ? '✅ PASS' : '❌ FAIL');

  console.log('\n═══════════════════════════════════════════');
  console.log('   Test Suite Complete');
  console.log('═══════════════════════════════════════════\n');
}
