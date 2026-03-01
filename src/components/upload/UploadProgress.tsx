import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  onCancel?: () => void;
  className?: string;
}

export function UploadProgress({
  filename,
  progress,
  status,
  error,
  onCancel,
  className,
}: UploadProgressProps) {
  const statusText = {
    uploading: 'Uploading...',
    processing: 'Processing...',
    complete: 'Complete',
    error: 'Failed',
  };

  return (
    <div
      className={cn(
        'border border-border rounded-xl p-4 bg-surface',
        status === 'error' && 'border-incorrect/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            status === 'error' ? 'bg-incorrect/10' : 'bg-accent-soft'
          )}
        >
          {status === 'uploading' || status === 'processing' ? (
            <Loader2
              size={20}
              className="animate-spin text-accent"
            />
          ) : status === 'complete' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-correct"
            >
              <path
                d="M4 10.5L8 14.5L16 6.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-incorrect"
            >
              <path
                d="M6 6L14 14M14 6L6 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-text font-medium truncate pr-2">
              {filename}
            </p>
            {status !== 'error' && status !== 'complete' && onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-text-muted hover:text-text transition-colors flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Progress bar or error message */}
          {status === 'error' && error ? (
            <p className="text-xs text-incorrect">{error}</p>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-bg-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    status === 'complete' ? 'bg-correct' : 'bg-accent'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <span className="text-xs text-text-muted tabular-nums w-14 text-right flex-shrink-0">
                {status === 'complete' ? statusText[status] : `${Math.round(Math.min(100, progress))}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
