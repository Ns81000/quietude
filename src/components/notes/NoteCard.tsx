import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  id: string;
  topicTitle: string;
  subject: string;
  wordCount: number;
  createdAt: string;
  onClick: (id: string) => void;
  className?: string;
}

export function NoteCard({
  id,
  topicTitle,
  subject,
  wordCount,
  createdAt,
  onClick,
  className,
}: NoteCardProps) {
  // Safely parse the date, fallback to "recently" if invalid
  let timeAgo = 'recently';
  try {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      timeAgo = formatDistanceToNow(date, { addSuffix: true });
    }
  } catch {
    // Keep default "recently"
  }

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'w-full text-left p-5 rounded-xl border border-border bg-surface',
        'hover:border-text-muted transition-colors duration-150',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-accent" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-text truncate mb-1">
            {topicTitle}
          </h3>
          <p className="text-sm text-text-soft">{subject}</p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
            <span>{wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
