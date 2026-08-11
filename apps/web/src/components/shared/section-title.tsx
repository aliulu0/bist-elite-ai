import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionTitle({ title, description, action, className }: SectionTitleProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
