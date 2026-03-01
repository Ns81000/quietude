import { useState, useCallback, useRef } from 'react';
import { FileText, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasteAreaProps {
  onPaste: (text: string) => void;
  className?: string;
}

const MAX_CHARS = 100000; // 100k character limit

export function PasteArea({ onPaste, className }: PasteAreaProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [isSyllabusLike, setIsSyllabusLike] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const detectSyllabusPattern = (content: string): boolean => {
    // Check for numbered sections, module headers, chapter patterns
    const patterns = [
      /^(?:\d+\.|\d+\)|\[?\d+\]?)\s+\w+/gm, // Numbered items: "1. Topic" or "1) Topic"
      /^(?:module|chapter|unit|section|part)\s+\d+/gim, // Module/Chapter headers
      /^(?:week|day|lesson)\s+\d+/gim, // Week/Day patterns
      /^\s*[-•*]\s+\w+/gm, // Bullet lists
    ];

    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    let matchCount = 0;

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length >= 3) {
        matchCount++;
      }
    }

    // If we have multiple pattern matches or many numbered items, it's likely a syllabus
    return matchCount >= 1 || lines.length > 10;
  };

  const handleTextChange = useCallback((value: string) => {
    const trimmed = value.slice(0, MAX_CHARS);
    setText(trimmed);
    setIsSyllabusLike(trimmed.length > 100 && detectSyllabusPattern(trimmed));
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData('text');
      if (pasted) {
        const combined = (text + pasted).slice(0, MAX_CHARS);
        handleTextChange(combined);
      }
    },
    [text, handleTextChange]
  );

  const handleSubmit = () => {
    if (text.trim().length > 0) {
      onPaste(text.trim());
    }
  };

  const charCount = text.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => textareaRef.current?.focus(), 100);
        }}
        className={cn(
          'w-full border border-border rounded-xl p-6 bg-surface',
          'hover:border-text-muted transition-colors duration-150 cursor-pointer text-left',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-text-muted" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-text font-medium">Paste text instead</p>
            <p className="text-xs text-text-muted">
              Paste notes, a syllabus, or any text content
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="border border-border rounded-xl bg-surface overflow-hidden focus-within:border-accent transition-colors duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-2/50">
          <div className="flex items-center gap-2 text-sm text-text-soft">
            <ClipboardPaste size={16} />
            <span>Paste your content</span>
          </div>
          <button
            onClick={() => {
              setIsExpanded(false);
              setText('');
            }}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste your notes, syllabus, or any study material here..."
          className="w-full h-64 px-4 py-3 bg-transparent text-text placeholder:text-text-muted
                     text-base leading-relaxed resize-none focus:outline-none"
        />

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-bg-2/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Character count */}
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-bg-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      charPercentage > 90 ? 'bg-incorrect' : 'bg-accent'
                    )}
                    style={{ width: `${Math.min(charPercentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted tabular-nums">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>

              {/* Syllabus detection badge */}
              {isSyllabusLike && (
                <span className="px-2 py-0.5 text-xs bg-accent-soft text-accent rounded-md">
                  This looks like a syllabus — we will build a full study plan
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={text.trim().length === 0}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                text.trim().length > 0
                  ? 'bg-accent text-accent-text hover:opacity-90'
                  : 'bg-bg-2 text-text-muted cursor-not-allowed'
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
