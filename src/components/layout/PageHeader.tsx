import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';

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
  statLayout?: {
    gapDesktop?: number;
    iconGapDesktop?: number;
    offsets?: [number, number, number, number] | number[];
  };
  statsClassName?: string;
  className?: string;
  gradient?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  stats,
  actions,
  statLayout,
  statsClassName,
  className,
  gradient = "from-accent/8 via-transparent to-transparent",
}: PageHeaderProps) {
  const statOffsets = statLayout?.offsets ?? [0, 0, 0, 0];
  const statGridStyle = {
    "--header-stat-gap-desktop": `${statLayout?.gapDesktop ?? 12}px`,
    "--header-icon-gap-desktop": `${statLayout?.iconGapDesktop ?? 4}px`,
    "--header-stat-offset-1": `${statOffsets[0] ?? 0}px`,
    "--header-stat-offset-2": `${statOffsets[1] ?? 0}px`,
    "--header-stat-offset-3": `${statOffsets[2] ?? 0}px`,
    "--header-stat-offset-4": `${statOffsets[3] ?? 0}px`,
  } as CSSProperties;

  return (
    <div 
      className={cn(
        "relative rounded-2xl bg-gradient-to-br border border-accent/8 p-5 sm:p-6 mb-6 sm:mb-8 overflow-hidden",
        gradient,
        className
      )}
    >
      {/* Decorative ambient background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/3 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {Icon && (
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-accent/10 items-center justify-center text-accent">
                <Icon className="w-5.5 h-5.5" />
              </div>
            )}
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-2xl md:text-3xl font-normal text-text tracking-tight"
            >
              {title}
            </motion.h1>
          </div>
          {description && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-text-soft/80 text-sm md:text-base font-medium max-w-2xl leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Dynamic Content: Stats or Actions */}
        <div className="flex flex-col w-full md:w-auto">
            {stats && stats.length > 0 && (
              <div
                className={cn("grid grid-cols-3 gap-3 md:gap-[var(--header-stat-gap-desktop)]", statsClassName)}
                style={statGridStyle}
              >
                {stats.map((stat, i) => {
                  const offsetClass =
                    i === 0
                      ? "md:ml-[var(--header-stat-offset-1)]"
                      : i === 1
                        ? "md:ml-[var(--header-stat-offset-2)]"
                        : i === 2
                          ? "md:ml-[var(--header-stat-offset-3)]"
                          : i === 3
                            ? "md:ml-[var(--header-stat-offset-4)]"
                            : "";

                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={cn(
                        "flex flex-col p-2 md:p-0 md:items-center md:text-center rounded-lg md:rounded-none bg-bg-2/40 md:bg-transparent",
                        offsetClass
                      )}
                    >
                      <span className="text-[10px] sm:text-[10px] md:text-[11px] uppercase tracking-widest text-text-muted/70 font-display font-normal mb-1.5 md:mb-1.5 whitespace-nowrap letter-spacing-wide">
                        {stat.label}
                      </span>
                      <div className="flex items-center gap-1.5 md:gap-[var(--header-icon-gap-desktop)] md:justify-center">
                        {stat.icon && (
                          <stat.icon className={cn("w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0", stat.color || "text-accent")} />
                        )}
                        <span className="text-lg sm:text-xl md:text-[22px] font-display font-normal text-text tabular-nums leading-none">
                          {stat.value}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
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
