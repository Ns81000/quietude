import type { GenerativeModel } from '@google/generative-ai';

const GEMINI_API_ROUTE = '/api/gemini-generate';

type ProxyGenerateResponse = {
  response: {
    text: () => string;
  };
};

function createProxyModel(modelName: string): GenerativeModel {
  const proxyModel = {
    async generateContent(contents: unknown): Promise<ProxyGenerateResponse> {
      const response = await fetch(GEMINI_API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName,
          contents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Gemini request failed');
      }

      const text = typeof data?.text === 'string' ? data.text : '';
      return {
        response: {
          text: () => text,
        },
      };
    },
  };

  return proxyModel as unknown as GenerativeModel;
}

export interface KeyState {
  index: number;
  requestsToday: number;
  lastUsed: number;
  lastError: string | null;
  lastErrorTime: number | null;
  consecutiveErrors: number;
  isExhausted: boolean;
  exhaustedAt: number | null;
  resetAt: number;
}

export function hasApiKeys(): boolean {
  return true;
}

export function getModel(modelName: string = 'gemini-2.5-flash-lite'): GenerativeModel {
  return createProxyModel(modelName);
}

export function getGeminiClient(): { getGenerativeModel: (args: { model: string }) => GenerativeModel } {
  return {
    getGenerativeModel: ({ model }) => createProxyModel(model),
  };
}

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

function isRetryableError(error: Error): boolean {
  const message = error.message?.toLowerCase() || '';
  if (message.includes('invalid') || message.includes('400') || message.includes('401') || message.includes('403')) {
    return false;
  }
  return true;
}

export async function safeGeminiCall<T>(
  fn: (model: GenerativeModel) => Promise<T>,
  maxRetries: number = 2,
  timeoutMs: number = 60000,
  modelName: string = 'gemini-2.5-flash-lite'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = createProxyModel(modelName);
      return await withTimeout(fn(model), timeoutMs);
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Unknown Gemini error');
}

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
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Unknown Gemini error');
}

export async function safeGeminiCallLegacy<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  timeoutMs: number = 60000
): Promise<T> {
  return safeGeminiCall(async () => fn(), retries, timeoutMs);
}

export function clearQuotaCache(): void {
  // No-op: key state is server-side now.
}

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
  return {
    available: 0,
    total: 0,
    keysTotal: 0,
    keysAvailable: 0,
    keysExhausted: 0,
    details: [],
  };
}

export function refreshKeyStates(): void {
  // No-op: key state is server-side now.
}

export async function fileToGenerativePart(
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
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

export function getSupportedMimeTypes(): string[] {
  return [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/aiff',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'audio/mp4',
    'text/plain',
    'text/markdown',
  ];
}

export function isMultimodalSupported(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType);
}
