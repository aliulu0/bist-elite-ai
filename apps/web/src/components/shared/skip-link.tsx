import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export function SkipLink({ href = '#main-content', label = 'İçeriğe geç', className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'fixed left-4 top-4 z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg',
        'translate-y-[-120%] transition-transform focus:translate-y-0',
        className,
      )}
    >
      {label}
    </a>
  );
}
