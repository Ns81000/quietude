import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAuthContext } from './AuthProvider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SyncIndicator({ className }: { className?: string }) {
  const { syncStatus } = useAuthStore();
  const { isOnline, pendingSyncCount, lastSyncTime } = useAuthContext();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (syncStatus === 'idle' && pendingSyncCount === 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, pendingSyncCount]);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        label: 'Offline',
        description: 'Changes will sync when back online',
        color: 'text-text-muted',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        icon: Loader2,
        label: 'Syncing...',
        description: `${pendingSyncCount} changes pending`,
        color: 'text-accent',
        spin: true,
      };
    }

    if (syncStatus === 'error') {
      return {
        icon: AlertCircle,
        label: 'Sync error',
        description: 'Some changes failed to sync',
        color: 'text-incorrect',
      };
    }

    if (showSuccess) {
      return {
        icon: Check,
        label: 'Synced',
        description: lastSyncTime ? `Last synced ${formatTime(lastSyncTime)}` : 'All changes saved',
        color: 'text-correct',
      };
    }

    return {
      icon: Cloud,
      label: 'Synced',
      description: lastSyncTime ? `Last synced ${formatTime(lastSyncTime)}` : 'All changes saved',
      color: 'text-text-muted',
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1.5 cursor-default', className)}>
          <Icon 
            className={cn(
              'w-4 h-4 transition-colors',
              status.color,
              status.spin && 'animate-spin'
            )} 
          />
          {pendingSyncCount > 0 && (
            <span className="text-xs text-text-muted">
              {pendingSyncCount}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        <div className="text-sm">
          <p className="font-medium">{status.label}</p>
          <p className="text-text-muted text-xs">{status.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
