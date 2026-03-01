import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  FileText,
  ChevronRight 
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
}

export function TopicNode({
  topic,
  index,
  isLast = false,
  onClick,
}: TopicNodeProps) {
  const isClickable = topic.status !== "locked";

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

  return (
    <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={cn(
          "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
          // Locked
          topic.status === "locked" && [
            "bg-bg-2 border-border/50 opacity-60 cursor-not-allowed",
          ],
          // Available
          topic.status === "available" && [
            "bg-surface border-border hover:border-accent hover:shadow-md cursor-pointer",
          ],
          // In progress
          topic.status === "in-progress" && [
            "bg-accent/5 border-accent shadow-md cursor-pointer",
            "ring-2 ring-accent/20",
          ],
          // Completed
          topic.status === "completed" && [
            "bg-correct/5 border-correct/30 cursor-pointer hover:border-correct/50",
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
        </div>

        {/* Arrow indicator */}
        {isClickable && (
          <ChevronRight
            className={cn(
              "w-5 h-5 flex-shrink-0 mt-3",
              topic.status === "completed" ? "text-correct" : "text-accent"
            )}
          />
        )}
      </motion.button>
  );
}

export default TopicNode;
