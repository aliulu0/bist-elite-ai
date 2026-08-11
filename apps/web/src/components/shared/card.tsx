import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, action, children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border bg-card shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
