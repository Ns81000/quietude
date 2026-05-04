import { useState, useCallback } from 'react';
import { renderParserClient, ParseResult } from '@/lib/markitdown/render-client';
import { toast } from 'sonner';

interface UseMarkitdownParserReturn {
  isParsing: boolean;
  progress: number;
  result: ParseResult | null;
  error: Error | null;
  parseFile: (file: File) => Promise<ParseResult | null>;
  reset: () => void;
}

/**
 * Sophisticated React hook bridging the frontend to the Render Markitdown pipeline.
 * Includes state management, progress tracking, and resilient error recovery.
 */
export function useMarkitdownParser(): UseMarkitdownParserReturn {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Validating file constraints before hitting the Render backend
      if (file.size > 50 * 1024 * 1024) { // 50MB hard limit for Render instances
        throw new Error('File exceeds the 50MB maximum pipeline limit.');
      }

      const parsedData = await renderParserClient.parseDocument(file, (currentProgress) => {
        setProgress(currentProgress);
      });

      setResult(parsedData);
      return parsedData;
    } catch (err) {
      const resultingError = err instanceof Error ? err : new Error('An unknown parsing error occurred');
      setError(resultingError);
      toast.error('Markitdown Parsing Failed', {
        description: resultingError.message
      });
      return null;
    } finally {
      setIsParsing(false);
      // reset progress after a slight delay for better UX
      setTimeout(() => setProgress(0), 1500);
    }
  }, []);

  const reset = useCallback(() => {
    setIsParsing(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    isParsing,
    progress,
    result,
    error,
    parseFile,
    reset
  };
}
