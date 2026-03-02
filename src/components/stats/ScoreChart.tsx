import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreDataPoint {
  date: string; // ISO date string
  score: number; // 0-100
  quizCount?: number;
}

interface ScoreChartProps {
  data: ScoreDataPoint[];
  period?: "week" | "month" | "all";
  showTrend?: boolean;
  height?: number;
}

export function ScoreChart({
  data,
  period = "week",
  showTrend = true,
  height = 200,
}: ScoreChartProps) {
  // Filter data based on period
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    
    switch (period) {
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }
    
    return data.filter(d => new Date(d.date) >= cutoff);
  }, [data, period]);

  // Calculate trend
  const trend = useMemo(() => {
    if (filteredData.length < 2) return { direction: "neutral" as const, value: 0 };
    
    const firstHalf = filteredData.slice(0, Math.floor(filteredData.length / 2));
    const secondHalf = filteredData.slice(Math.floor(filteredData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    return {
      direction: diff > 2 ? "up" as const : diff < -2 ? "down" as const : "neutral" as const,
      value: Math.abs(Math.round(diff)),
    };
  }, [filteredData]);

  // Calculate chart dimensions
  const maxScore = 100;
  const minScore = 0;
  const chartWidth = 100; // percentage
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  // Generate path for the line chart
  const linePath = useMemo(() => {
    if (filteredData.length === 0) return "";
    
    const points = filteredData.map((d, i) => {
      const x = (i / (filteredData.length - 1 || 1)) * (chartWidth - 10) + 5;
      const y = 100 - ((d.score - minScore) / (maxScore - minScore)) * 80 - 10;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [filteredData]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (filteredData.length === 0) return "";
    
    const points = filteredData.map((d, i) => {
      const x = (i / (filteredData.length - 1 || 1)) * (chartWidth - 10) + 5;
      const y = 100 - ((d.score - minScore) / (maxScore - minScore)) * 80 - 10;
      return `${x},${y}`;
    });
    
    const firstX = 5;
    const lastX = chartWidth - 5;
    
    return `M ${firstX},90 L ${points.join(" L ")} L ${lastX},90 Z`;
  }, [filteredData]);

  // Average score
  const avgScore = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.round(filteredData.reduce((sum, d) => sum + d.score, 0) / filteredData.length);
  }, [filteredData]);

  if (filteredData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-bg-2 rounded-xl"
        style={{ height }}
      >
        <p className="text-text-muted">No quiz data for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-muted">Average Score</h3>
          <p className="text-3xl font-bold text-text">{avgScore}%</p>
        </div>
        
        {showTrend && (
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
              trend.direction === "up" && "bg-correct/10 text-correct",
              trend.direction === "down" && "bg-incorrect/10 text-incorrect",
              trend.direction === "neutral" && "bg-bg-2 text-text-muted"
            )}
          >
            {trend.direction === "up" && <TrendingUp className="w-4 h-4" />}
            {trend.direction === "down" && <TrendingDown className="w-4 h-4" />}
            {trend.direction === "neutral" && <Minus className="w-4 h-4" />}
            {trend.direction !== "neutral" ? `${trend.value}%` : "Stable"}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: height - 80 }} className="relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <line
              key={value}
              x1="5"
              y1={90 - (value / 100) * 80}
              x2="95"
              y2={90 - (value / 100) * 80}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill="url(#scoreGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-text-muted py-2">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-text-muted px-8">
        {filteredData.length > 0 && (
          <>
            <span>
              {new Date(filteredData[0].date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric" 
              })}
            </span>
            <span>
              {new Date(filteredData[filteredData.length - 1].date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric" 
              })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default ScoreChart;
