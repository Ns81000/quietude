import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActivityDay {
  date: string; // ISO date string
  count: number; // Number of activities (quizzes, notes, etc.)
}

interface ActivityCalendarProps {
  data: ActivityDay[];
  months?: number; // How many months to show (default: 3)
}

export function ActivityCalendar({
  data,
  months = 3,
}: ActivityCalendarProps) {
  // Generate calendar grid
  const calendarData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    
    // Create activity map for quick lookup
    const activityMap = new Map<string, number>();
    data.forEach(d => {
      const dateKey = new Date(d.date).toISOString().split("T")[0];
      activityMap.set(dateKey, d.count);
    });
    
    // Generate weeks
    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    
    const currentDate = new Date(startDate);
    
    // Pad first week
    const firstDayOfWeek = currentDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), count: -1 }); // -1 indicates empty
    }
    
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const count = activityMap.get(dateKey) || 0;
      
      currentWeek.push({ date: new Date(currentDate), count });
      
      if (currentDate.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), count: -1 });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [data, months]);

  // Get intensity level for color
  const getIntensity = (count: number): number => {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    
    calendarData.forEach((week, weekIndex) => {
      week.forEach(day => {
        if (day.count >= 0) {
          const month = day.date.getMonth();
          if (month !== lastMonth) {
            labels.push({
              label: day.date.toLocaleDateString("en-US", { month: "short" }),
              index: weekIndex,
            });
            lastMonth = month;
          }
        }
      });
    });
    
    return labels;
  }, [calendarData]);

  // Stats
  const stats = useMemo(() => {
    const totalActivities = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;
    const currentStreak = calculateStreak(data);
    
    return { totalActivities, activeDays, currentStreak };
  }, [data]);

  // Show placeholder message when empty
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text">Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-text-muted text-sm">
            Start taking quizzes to see your activity here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-medium text-text">Activity</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-soft">
            <span className="font-medium text-text">{stats.totalActivities}</span> activities
          </span>
          <span className="text-text-soft">
            <span className="font-medium text-text">{stats.currentStreak}</span> day streak
          </span>
        </div>
      </div>

      {/* Calendar grid - scrollable on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full relative">
          {/* Month labels row */}
          <div className="flex items-end mb-2 h-4" style={{ marginLeft: '32px' }}>
            {monthLabels.map((item, i) => (
              <span
                key={i}
                className="text-xs text-text-muted absolute"
                style={{
                  left: `calc(32px + ${item.index * 14}px)`,
                }}
              >
                {item.label}
              </span>
            ))}
          </div>

          {/* Main grid container */}
          <div className="flex">
            {/* Day labels - only show Mon, Wed, Fri for cleaner look */}
            <div className="flex flex-col justify-between pr-2 text-[10px] text-text-muted" style={{ height: `${7 * 12 + 6 * 2}px` }}>
              <span className="h-3 leading-3"></span>
              <span className="h-3 leading-3">Mon</span>
              <span className="h-3 leading-3"></span>
              <span className="h-3 leading-3">Wed</span>
              <span className="h-3 leading-3"></span>
              <span className="h-3 leading-3">Fri</span>
              <span className="h-3 leading-3"></span>
            </div>

            {/* Weeks grid */}
            <div className="flex gap-[2px]">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={dayIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: weekIndex * 0.01,
                        duration: 0.15,
                      }}
                      title={
                        day.count >= 0
                          ? `${day.date.toLocaleDateString()}: ${day.count} activities`
                          : ""
                      }
                      className={cn(
                        "w-3 h-3 rounded-[3px] transition-colors",
                        day.count < 0 && "bg-transparent",
                        day.count === 0 && "bg-bg-2 hover:bg-bg-2/80",
                        getIntensity(day.count) === 1 && "bg-accent/25 hover:bg-accent/35",
                        getIntensity(day.count) === 2 && "bg-accent/50 hover:bg-accent/60",
                        getIntensity(day.count) === 3 && "bg-accent/75 hover:bg-accent/85",
                        getIntensity(day.count) === 4 && "bg-accent hover:opacity-90"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] text-text-muted">
            <span className="mr-1">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-[3px]",
                  level === 0 && "bg-bg-2",
                  level === 1 && "bg-accent/25",
                  level === 2 && "bg-accent/50",
                  level === 3 && "bg-accent/75",
                  level === 4 && "bg-accent"
                )}
              />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calculate current streak
function calculateStreak(data: ActivityDay[]): number {
  const sortedData = [...data]
    .filter(d => d.count > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sortedData.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const mostRecentDate = new Date(sortedData[0].date);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  // Check if streak is active (activity today or yesterday)
  if (mostRecentDate < yesterday) return 0;
  
  let streak = 1;
  let currentDate = new Date(mostRecentDate);
  
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    const dataDate = new Date(sortedData[i].date);
    dataDate.setHours(0, 0, 0, 0);
    
    if (dataDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = dataDate;
    } else if (dataDate.getTime() < prevDate.getTime()) {
      break;
    }
  }
  
  return streak;
}

export default ActivityCalendar;
