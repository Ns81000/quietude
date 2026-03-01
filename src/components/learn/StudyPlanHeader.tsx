import { motion } from "framer-motion";
import { BookOpen, Clock, TrendingUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  totalTopics: number;
  completedTopics: number;
  estimatedHours: number;
  lastStudied?: Date;
  createdAt: Date;
}

interface StudyPlanHeaderProps {
  plan: StudyPlan;
  onEditPlan?: () => void;
  onDeletePlan?: () => void;
  onSharePlan?: () => void;
}

export function StudyPlanHeader({
  plan,
  onEditPlan,
  onDeletePlan,
  onSharePlan,
}: StudyPlanHeaderProps) {
  const progress = Math.round((plan.completedTopics / plan.totalTopics) * 100);
  
  const formatLastStudied = (date?: Date) => {
    if (!date) return "Not started";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-xl p-6 border border-border"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {plan.subject}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-text font-bold truncate">
            {plan.title}
          </h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onSharePlan && (
              <DropdownMenuItem onClick={onSharePlan}>
                Share Plan
              </DropdownMenuItem>
            )}
            {onDeletePlan && (
              <DropdownMenuItem 
                onClick={onDeletePlan}
                className="text-incorrect focus:text-incorrect"
              >
                Delete Plan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{plan.totalTopics}</p>
            <p className="text-xs text-text-muted">Topics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{plan.estimatedHours}h</p>
            <p className="text-xs text-text-muted">Est. Time</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{progress}%</p>
            <p className="text-xs text-text-muted">Complete</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-soft">
            {plan.completedTopics} of {plan.totalTopics} topics completed
          </span>
          <span className="text-text-muted">
            Last studied: {formatLastStudied(plan.lastStudied)}
          </span>
        </div>
        <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              progress === 100 ? "bg-correct" : "bg-accent"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default StudyPlanHeader;
