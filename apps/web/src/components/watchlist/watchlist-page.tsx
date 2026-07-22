'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWatchlistStore } from '@/stores/watchlist-store';
import { useI18n } from '@/hooks/use-i18n';

export function WatchlistPage() {
  const { t } = useI18n();
  const { watchlists, addWatchlist, removeWatchlist, renameWatchlist } = useWatchlistStore();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      addWatchlist(newName.trim());
      setNewName('');
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameWatchlist(id, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Watchlist</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Watchlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {watchlists.map((watchlist) => (
          <Card key={watchlist.id}>
            <CardHeader>
              {editingId === watchlist.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(watchlist.id)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRename(watchlist.id)}>
                    Save
                  </Button>
                </div>
              ) : (
                <CardTitle>{watchlist.name}</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {watchlist.symbols.length} stocks
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(watchlist.id);
                    setEditName(watchlist.name);
                  }}
                >
                  Rename
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeWatchlist(watchlist.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
