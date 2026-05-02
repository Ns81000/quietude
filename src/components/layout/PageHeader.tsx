import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HeaderStat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  stats?: HeaderStat[];
  actions?: ReactNode;
  className?: string;
  gradient?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  stats,
  actions,
  className,
  gradient = "from-accent/8 via-transparent to-transparent",
}: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "relative rounded-2xl bg-gradient-to-br border border-accent/8 p-6 mb-8 overflow-hidden",
        gradient,
        className
      )}
    >
      {/* Decorative ambient background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/3 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-accent/10 items-center justify-center text-accent">
                <Icon className="w-5.5 h-5.5" />
              </div>
            )}
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-xl md:text-3xl text-text tracking-tight"
            >
              {title}
            </motion.h1>
          </div>
          {description && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-text-soft text-sm md:text-base max-w-2xl leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Dynamic Content: Stats or Actions */}
        <div className="flex flex-wrap items-center gap-3 md:gap-10">
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-6 md:gap-10 mr-2 md:mr-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex flex-col"
                >
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.1em] text-text-muted font-bold mb-1">
                    {stat.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {stat.icon && (
                      <stat.icon className={cn("w-4 h-4 md:w-5 md:h-5", stat.color || "text-accent")} />
                    )}
                    <span className="text-xl md:text-[22px] font-display text-text tabular-nums leading-none">
                      {stat.value}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {actions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </div>
  );
}
