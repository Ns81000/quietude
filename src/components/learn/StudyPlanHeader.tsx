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
      className="bg-surface rounded-2xl p-6 border border-accent/8 relative overflow-hidden mb-8"
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      
      {/* Header row */}
      <div className="relative flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {plan.subject}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-text leading-tight truncate">
            {plan.title}
          </h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-accent/5">
              <MoreHorizontal className="w-5 h-5 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
            {onSharePlan && (
              <DropdownMenuItem onClick={onSharePlan} className="cursor-pointer">
                Share Plan
              </DropdownMenuItem>
            )}
            {onDeletePlan && (
              <DropdownMenuItem 
                onClick={onDeletePlan}
                className="text-incorrect focus:text-incorrect cursor-pointer"
              >
                Delete Plan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modern Stats Grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold leading-none mb-1">Topics</p>
            <p className="text-xl font-display text-text">{plan.totalTopics}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold leading-none mb-1">Est. Time</p>
            <p className="text-xl font-display text-text">{plan.estimatedHours}h</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold leading-none mb-1">Mastery</p>
            <p className="text-xl font-display text-text">{progress}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold leading-none mb-1">Last seen</p>
            <p className="text-xl font-display text-text truncate">{formatLastStudied(plan.lastStudied)}</p>
          </div>
        </div>
      </div>

      {/* Progress section */}
      <div className="relative space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <span className="text-text-soft">
            {plan.completedTopics} of {plan.totalTopics} topics mastered
          </span>
          <span className="text-accent uppercase tracking-tighter tabular-nums font-bold">
            {progress}% COMPLETE
          </span>
        </div>
        <div className="h-2.5 bg-accent/5 rounded-full overflow-hidden p-[1px] border border-accent/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              "h-full rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]",
              progress === 100 ? "bg-correct" : "bg-accent"
            )}
          />
        </div>
      </div>
      
      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-50" />
    </motion.div>
  );
}
}

export default StudyPlanHeader;
