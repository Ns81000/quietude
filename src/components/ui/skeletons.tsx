import { cn } from '@/lib/utils';

interface QuizSkeletonProps {
  className?: string;
}

export function QuizSkeleton({ className }: QuizSkeletonProps) {
  return (
    <div className={cn('space-y-8 animate-pulse', className)}>
      {/* Progress bar skeleton */}
      <div className="h-2 bg-bg-2 rounded-full w-full" />

      {/* Question card skeleton */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        {/* Question badge */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-bg-2 rounded-full" />
          <div className="h-4 w-24 bg-bg-2 rounded" />
        </div>

        {/* Question text */}
        <div className="space-y-2">
          <div className="h-5 bg-bg-2 rounded w-full" />
          <div className="h-5 bg-bg-2 rounded w-4/5" />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 bg-bg-2 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConfigSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Topic header */}
      <div className="space-y-2">
        <div className="h-8 bg-bg-2 rounded w-3/4" />
        <div className="h-4 bg-bg-2 rounded w-1/2" />
      </div>

      {/* Config options */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-bg-2 rounded" />
          <div className="h-10 bg-bg-2 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-bg-2 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-bg-2 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-36 bg-bg-2 rounded" />
          <div className="h-10 bg-bg-2 rounded" />
        </div>
      </div>

      {/* Start button */}
      <div className="h-12 bg-accent/30 rounded-lg w-full" />
    </div>
  );
}

export function NotesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-bg-2 rounded-full" />
        <div className="h-8 bg-bg-2 rounded w-3/4" />
      </div>

      {/* Content */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="h-6 bg-bg-2 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-bg-2 rounded w-full" />
          <div className="h-4 bg-bg-2 rounded w-5/6" />
          <div className="h-4 bg-bg-2 rounded w-4/5" />
        </div>
        <div className="h-6 bg-bg-2 rounded w-1/4 mt-4" />
        <div className="space-y-2">
          <div className="h-4 bg-bg-2 rounded w-full" />
          <div className="h-4 bg-bg-2 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-8 bg-bg-2 rounded w-2/3" />
        <div className="h-4 bg-bg-2 rounded w-1/2" />
      </div>

      {/* Continue card */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="h-3 bg-bg-2 rounded w-24" />
        <div className="h-7 bg-bg-2 rounded w-3/5" />
        <div className="h-4 bg-bg-2 rounded w-2/5" />
        <div className="h-10 bg-accent/30 rounded-lg w-28 mt-2" />
      </div>

      {/* Recent sessions */}
      <div className="space-y-3">
        <div className="h-4 bg-bg-2 rounded w-32" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-surface border border-border rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Summary numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4 space-y-2"
          >
            <div className="h-8 w-8 bg-bg-2 rounded-full" />
            <div className="h-8 bg-bg-2 rounded w-12" />
            <div className="h-3 bg-bg-2 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="h-4 bg-bg-2 rounded w-32 mb-4" />
        <div className="h-64 bg-bg-2 rounded" />
      </div>
    </div>
  );
}
