import { cn } from '@/lib/utils';

interface SkeletonLineProps {
  className?: string;
  width?: string;
  height?: string;
}

export function SkeletonLine({ className, width, height }: SkeletonLineProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCircleProps {
  className?: string;
  size?: string;
}

export function SkeletonCircle({ className, size }: SkeletonCircleProps) {
  return (
    <div
      className={cn('animate-pulse rounded-full bg-muted', className)}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps {
  rows?: number;
  className?: string;
}

export function SkeletonCard({ rows = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)} aria-hidden="true">
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-2/3" />
        {rows > 3 &&
          Array.from({ length: rows - 3 }, (_, i) => (
            <SkeletonLine key={i} className="h-3 w-full" />
          ))}
      </div>
    </div>
  );
}
