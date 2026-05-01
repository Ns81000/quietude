import { motion } from 'framer-motion';
import { FileText, Clock } from 'lucide-react';
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left p-5 rounded-2xl border border-border bg-surface shadow-sm',
        'hover:border-accent/30 hover:shadow-md transition-all duration-300 group',
        className
      )}
    >
      <div>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center flex-shrink-0
                          group-hover:bg-accent/15 transition-colors duration-300">
            <FileText size={20} className="text-accent" strokeWidth={1.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg text-text truncate mb-1">
              {topicTitle}
            </h3>
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-accent/8 text-accent">
              {subject}
            </span>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="w-1 h-1 rounded-full bg-text-muted/40" />
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
