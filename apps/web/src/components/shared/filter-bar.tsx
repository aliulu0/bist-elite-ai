import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({ searchValue, onSearchChange, searchPlaceholder = 'Filtrele...', children, className }: FilterBarProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-center', className)} role="search">
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:w-48"
          aria-label={searchPlaceholder}
        />
      </div>
      {children}
    </div>
  );
}

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}
