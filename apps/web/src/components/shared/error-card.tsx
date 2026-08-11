import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ title = 'Hata', message, onRetry, className }: ErrorCardProps) {
  return (
    <div className={cn('rounded-lg border border-destructive/20 bg-card p-6 shadow-sm', className)}>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}
