import { cn } from '@/lib/utils';

interface AccessibleIconProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleIcon({ label, children, className }: AccessibleIconProps) {
  return (
    <span role="img" aria-label={label} className={cn('inline-flex items-center', className)}>
      {children}
    </span>
  );
}
