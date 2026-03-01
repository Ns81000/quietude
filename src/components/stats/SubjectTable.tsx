import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubjectStats {
  id: string;
  name: string;
  quizzesCompleted: number;
  averageScore: number;
  lastQuizScore?: number;
  lastActivity?: Date;
  trend: "up" | "down" | "neutral";
}

interface SubjectTableProps {
  subjects: SubjectStats[];
  onSubjectClick?: (subjectId: string) => void;
}

type SortField = "name" | "quizzesCompleted" | "averageScore" | "lastActivity";
type SortDirection = "asc" | "desc";

export function SubjectTable({
  subjects,
  onSubjectClick,
}: SubjectTableProps) {
  const [sortField, setSortField] = useState<SortField>("averageScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Sort subjects
  const sortedSubjects = [...subjects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "quizzesCompleted":
        comparison = a.quizzesCompleted - b.quizzesCompleted;
        break;
      case "averageScore":
        comparison = a.averageScore - b.averageScore;
        break;
      case "lastActivity": {
        const aTime = a.lastActivity?.getTime() || 0;
        const bTime = b.lastActivity?.getTime() || 0;
        comparison = aTime - bTime;
        break;
      }
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "—";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTrendIcon = (trend: SubjectStats["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-correct" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-incorrect" />;
      default:
        return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-correct";
    if (score >= 60) return "text-accent";
    if (score >= 40) return "text-yellow-500";
    return "text-incorrect";
  };

  if (subjects.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-8 border border-border text-center">
        <p className="text-text-muted">No subjects yet. Start a quiz to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-text">Subjects Performance</h3>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-bg-2 transition-colors"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-1">
                Subject
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-bg-2 transition-colors text-center"
              onClick={() => handleSort("quizzesCompleted")}
            >
              <div className="flex items-center justify-center gap-1">
                Quizzes
                <SortIcon field="quizzesCompleted" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-bg-2 transition-colors text-center"
              onClick={() => handleSort("averageScore")}
            >
              <div className="flex items-center justify-center gap-1">
                Avg Score
                <SortIcon field="averageScore" />
              </div>
            </TableHead>
            <TableHead className="text-center">Trend</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-bg-2 transition-colors text-right"
              onClick={() => handleSort("lastActivity")}
            >
              <div className="flex items-center justify-end gap-1">
                Last Active
                <SortIcon field="lastActivity" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubjects.map((subject, index) => (
            <motion.tr
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSubjectClick?.(subject.id)}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                onSubjectClick && "cursor-pointer hover:bg-bg-2"
              )}
            >
              <TableCell className="font-medium">{subject.name}</TableCell>
              <TableCell className="text-center">{subject.quizzesCompleted}</TableCell>
              <TableCell className="text-center">
                <span className={cn("font-bold", getScoreColor(subject.averageScore))}>
                  {subject.averageScore}%
                </span>
                {subject.lastQuizScore !== undefined && (
                  <span className="text-xs text-text-muted ml-2">
                    (Last: {subject.lastQuizScore}%)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {getTrendIcon(subject.trend)}
              </TableCell>
              <TableCell className="text-right text-text-soft">
                {formatDate(subject.lastActivity)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default SubjectTable;
