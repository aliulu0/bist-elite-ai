import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title, description, className }: LoadingCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {title && <p className="text-sm font-medium">{title}</p>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  show?: boolean;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ show = true, text = 'Yükleniyor...', className }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className={cn('absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
