import { BellOff } from 'lucide-react';

export function AlertsEmptyState({ message = 'Henüz alarm bulunmuyor' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
      <BellOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
