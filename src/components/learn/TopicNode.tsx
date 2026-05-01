import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  FileText,
  ChevronRight,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TopicStatus = "locked" | "available" | "in-progress" | "completed";

export interface Topic {
  id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  quizScore?: number; // 0-100
  notesGenerated?: boolean;
  estimatedMinutes?: number;
}

interface TopicNodeProps {
  topic: Topic;
  index: number;
  isLast?: boolean;
  onClick?: () => void;
  onFlashcardClick?: () => void;
  onNotesClick?: () => void;
}

export function TopicNode({
  topic,
  index,
  isLast = false,
  onClick,
  onFlashcardClick,
  onNotesClick,
}: TopicNodeProps) {
  const isClickable = topic.status !== "locked";
  // Show action buttons for all non-locked topics
  const showActionButtons = topic.status !== "locked" && (onFlashcardClick || onNotesClick);

  const getStatusIcon = () => {
    switch (topic.status) {
      case "locked":
        return <Lock className="w-5 h-5 text-text-muted" />;
      case "available":
        return <Circle className="w-5 h-5 text-accent" />;
      case "in-progress":
        return <Play className="w-5 h-5 text-accent" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-correct" />;
    }
  };

  const getStatusText = () => {
    switch (topic.status) {
      case "locked":
        return "Locked";
      case "available":
        return "Start Learning";
      case "in-progress":
        return "Continue";
      case "completed":
        return topic.quizScore !== undefined
          ? `Score: ${topic.quizScore}%`
          : "Completed";
    }
  };

  const getMainButtonText = () => {
    if (topic.status === "completed") return "Retake Quiz";
    if (topic.status === "in-progress") return "Continue";
    return "Start Quiz";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
        // Locked
        topic.status === "locked" && [
          "bg-bg-2 border-border/50 opacity-60",
        ],
        // Available
        topic.status === "available" && [
          "bg-surface border-border hover:border-accent hover:shadow-md hover:-translate-y-1",
        ],
        // In progress
        topic.status === "in-progress" && [
          "bg-accent/5 border-accent shadow-md hover:-translate-y-1",
          "ring-2 ring-accent/20",
        ],
        // Completed
        topic.status === "completed" && [
          "bg-correct/5 border-correct/30 hover:border-correct/50",
        ]
      )}
    >
      {/* Topic number & icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          topic.status === "locked" && "bg-bg-2",
          topic.status === "available" && "bg-accent/10",
          topic.status === "in-progress" && "bg-accent/20",
          topic.status === "completed" && "bg-correct/20"
        )}
      >
        {getStatusIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-text-muted">Topic {index + 1}</span>
          {topic.notesGenerated && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <FileText className="w-3 h-3" />
              Notes
            </span>
          )}
        </div>
        <h3
          className={cn(
            "font-medium text-base mb-1 truncate",
            topic.status === "locked" ? "text-text-muted" : "text-text"
          )}
        >
          {topic.title}
        </h3>
        {topic.description && (
          <p className="text-sm text-text-soft line-clamp-2">
            {topic.description}
          </p>
        )}
        
        {/* Footer info */}
        <div className="flex items-center justify-between mt-3">
          <span
            className={cn(
              "text-sm font-medium",
              topic.status === "locked" && "text-text-muted",
              topic.status === "available" && "text-accent",
              topic.status === "in-progress" && "text-accent",
              topic.status === "completed" && "text-correct"
            )}
          >
            {getStatusText()}
          </span>
          {topic.estimatedMinutes && topic.status !== "locked" && (
            <span className="text-xs text-text-muted">
              ~{topic.estimatedMinutes} min
            </span>
          )}
        </div>

        {/* Action buttons for all non-locked topics */}
        {showActionButtons && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            {/* Main action button (Start/Continue/Retake) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg
                         bg-surface border border-border text-text hover:border-text-muted transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">{getMainButtonText()}</span>
              <span className="sm:hidden">
                {topic.status === "completed" ? "Retake" : topic.status === "in-progress" ? "Continue" : "Start"}
              </span>
            </button>

            {/* Flashcards button */}
            {onFlashcardClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFlashcardClick();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg
                           bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Flashcards</span>
              </button>
            )}

            {/* Generate Notes button - available for all non-locked topics */}
            {onNotesClick && topic.status !== "locked" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNotesClick();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg
                           bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 
                           hover:bg-blue-500/20 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Generate Notes</span>
                <span className="sm:hidden">Notes</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Arrow indicator - only show if not showing action buttons */}
      {isClickable && !showActionButtons && (
        <button
          onClick={onClick}
          className="flex-shrink-0 mt-3"
        >
          <ChevronRight
            className={cn(
              "w-5 h-5",
              topic.status === "completed" ? "text-correct" : "text-accent"
            )}
          />
        </button>
      )}
    </motion.div>
  );
}

export default TopicNode;
