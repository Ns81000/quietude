import { useState, useCallback, useRef, useEffect } from 'react';
import { Youtube, Link, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidYouTubeUrl, extractVideoId, getYouTubeThumbnail } from '@/lib/youtube';

interface YouTubeInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function YouTubeInput({ onSubmit, isLoading = false, error, className }: YouTubeInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) {
      setIsValid(null);
      setVideoId(null);
      return;
    }
    
    const valid = isValidYouTubeUrl(value);
    setIsValid(valid);
    
    if (valid) {
      setVideoId(extractVideoId(value));
    } else {
      setVideoId(null);
    }
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      validateUrl(value);
    }, 300);
  }, [validateUrl]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      const newValue = pasted.trim();
      setUrl(newValue);
      validateUrl(newValue);
    }
  }, [validateUrl]);

  const handleSubmit = () => {
    if (isValid && url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setUrl('');
    setIsValid(null);
    setVideoId(null);
  };

  const handleClear = () => {
    setUrl('');
    setIsValid(null);
    setVideoId(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Collapsed state - simple button
  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={cn(
          'w-full border border-border rounded-xl p-6 bg-surface',
          'hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 cursor-pointer text-left group',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
            <Youtube size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-text font-medium">YouTube video</p>
            <p className="text-xs text-text-muted">
              Paste a link to learn from any video with captions
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Expanded state - Thumbnail on left, Input on right
  return (
    <div className={cn('border border-border rounded-xl bg-surface overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-2/50">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Youtube size={18} className="text-red-500" />
          <span>YouTube Video</span>
        </div>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="p-1 text-text-muted hover:text-text hover:bg-bg-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main content - Thumbnail left, Input right */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left side - Thumbnail preview */}
          <div className="shrink-0">
            <div className={cn(
              "w-40 h-24 rounded-lg overflow-hidden bg-bg-2 relative",
              "flex items-center justify-center"
            )}>
              {videoId ? (
                <>
                  <img
                    src={getYouTubeThumbnail(videoId, 'medium')}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-l-[14px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                    </div>
                  </div>
                  {/* Valid checkmark */}
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={18} className="text-correct drop-shadow-lg" />
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Youtube size={32} className="text-text-muted/30 mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted">Preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Input and button */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Input field */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Link size={16} className="text-text-muted" />
              </div>
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="Paste YouTube link here..."
                disabled={isLoading}
                className={cn(
                  "w-full pl-9 pr-9 py-2.5 bg-bg-2/70 rounded-lg text-text placeholder:text-text-muted",
                  "text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed border border-transparent",
                  isValid === false && url.trim() && "border-incorrect/50 focus:ring-incorrect/30",
                  isValid === true && "border-correct/50 focus:ring-correct/30"
                )}
              />
              {/* Clear button or loading */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <Loader2 size={16} className="text-accent animate-spin" />
                ) : url ? (
                  <button
                    onClick={handleClear}
                    className="p-1 text-text-muted hover:text-text rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Validation message */}
            {isValid === false && url.trim() && (
              <p className="text-xs text-incorrect flex items-center gap-1">
                <AlertCircle size={12} />
                Invalid YouTube URL
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || isLoading || !url.trim()}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isValid && !isLoading
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-bg-2 text-text-muted"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Fetching transcript...</span>
                </>
              ) : (
                <>
                  <Youtube size={16} />
                  <span>Get Transcript</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-incorrect/10 border border-incorrect/20">
            <p className="text-sm text-incorrect flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Help text */}
        <p className="mt-3 text-[11px] text-text-muted text-center">
          Works with videos that have captions or auto-generated subtitles
        </p>
      </div>
    </div>
  );
}
