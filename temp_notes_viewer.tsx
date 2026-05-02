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
        'prose prose-quietude max-w-prose mx-auto font-body text-text leading-[1.8]',
        // Custom styling for notes
        '[&_h1]:font-display [&_h1]:text-4xl [&_h1]:text-text [&_h1]:font-normal [&_h1]:tracking-tight [&_h1]:mb-8 [&_h1]:mt-0',
        '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-text [&_h2]:font-normal [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border/50',
        '[&_h3]:font-display [&_h3]:text-xl [&_h3]:text-text [&_h3]:font-normal [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-4',
        '[&_p]:text-text-soft [&_p]:text-lg [&_p]:mx-auto [&_p]:mb-6 [&_p]:font-normal',
        '[&_strong]:text-text [&_strong]:font-medium',
        '[&_em]:italic [&_em]:text-text-muted',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-lg [&_ul]:text-text-soft',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:space-y-2 [&_ol]:text-lg [&_ol]:text-text-soft',
        '[&_li::marker]:text-accent/60',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-accent/40 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-xl [&_blockquote]:text-text-muted [&_blockquote]:py-1 [&_blockquote]:my-8',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
