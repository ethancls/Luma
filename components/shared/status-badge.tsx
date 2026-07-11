import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  // Instance statuses
  Running: 'success',
  Stopped: 'secondary',
  Frozen: 'default',
  Error: 'destructive',
  Starting: 'warning',
  Stopping: 'warning',
  // Service / machine statuses
  online: 'success',
  degraded: 'warning',
  offline: 'destructive',
  unknown: 'secondary',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_COLORS[status] || 'default'} className={className}>
      {status}
    </Badge>
  );
}
