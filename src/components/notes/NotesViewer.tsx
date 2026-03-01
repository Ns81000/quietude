import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface NotesViewerProps {
  contentHtml: string;
  className?: string;
}

// Configure DOMPurify
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'br',
];
const ALLOWED_ATTR: string[] = [];

export function NotesViewer({ contentHtml, className }: NotesViewerProps) {
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(contentHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
  }, [contentHtml]);

  return (
    <article
      className={cn(
        'prose prose-quietude max-w-prose mx-auto',
        // Custom styling for notes
        '[&_h1]:font-display [&_h1]:text-2xl [&_h1]:text-text [&_h1]:font-normal [&_h1]:mb-6 [&_h1]:mt-0',
        '[&_h2]:font-display [&_h2]:text-xl [&_h2]:text-text [&_h2]:font-normal [&_h2]:mt-8 [&_h2]:mb-4',
        '[&_h3]:font-display [&_h3]:text-lg [&_h3]:text-text [&_h3]:font-normal [&_h3]:mt-6 [&_h3]:mb-3',
        '[&_p]:text-text [&_p]:leading-relaxed [&_p]:mb-4',
        '[&_strong]:text-text [&_strong]:font-medium',
        '[&_em]:italic',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4',
        '[&_li]:text-text [&_li]:mb-1.5',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-accent-soft/30 [&_blockquote]:rounded-r-lg',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
