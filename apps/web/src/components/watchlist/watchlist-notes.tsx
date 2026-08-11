import { StickyNote } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { WatchlistNote } from './watchlist-types';

interface WatchlistNotesProps {
  notes: WatchlistNote[];
}

export function WatchlistNotes({ notes }: WatchlistNotesProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Notlar</h3>
        <EmptyState
          title="Not bulunmuyor"
          description="Hisse başına notlarınız burada görünecek"
          icon={<StickyNote className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Notlar ({notes.length})</h3>
      </div>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div key={`${n.symbol}-${i}`} className="rounded-md border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{n.symbol}</span>
              <span className="text-muted-foreground">{n.updatedAt}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{n.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
