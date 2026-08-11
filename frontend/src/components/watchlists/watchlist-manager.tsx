"use client";

import { useState } from "react";
import {
  useWatchlists,
  useCreateWatchlist,
  useDeleteWatchlist,
  useAddSymbolToWatchlist,
  useRemoveSymbolFromWatchlist,
} from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, BookmarkCheck, Bookmark, X } from "lucide-react";

export function WatchlistManager() {
  const { data, isLoading } = useWatchlists();
  const createWatchlist = useCreateWatchlist();
  const deleteWatchlist = useDeleteWatchlist();
  const addSymbol = useAddSymbolToWatchlist();
  const removeSymbol = useRemoveSymbolFromWatchlist();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addSymbolState, setAddSymbolState] = useState<{
    watchlistId: string;
    symbol: string;
  } | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWatchlist.mutate(newName.trim());
    setNewName("");
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <Bookmark className="mb-3 h-12 w-12" />
        <p className="mb-4">No watchlists yet</p>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Watchlist
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Watchlist
        </Button>
      </div>

      {data.map((wl) => (
        <div
          key={wl.id}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {wl.type === "DEFAULT" ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5 text-warning" />
              )}
              <h3 className="text-base font-semibold text-text">{wl.name}</h3>
              <Badge variant="primary">{wl.symbols.length} stocks</Badge>
            </div>
            {wl.type === "CUSTOM" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteWatchlist.mutate(wl.id)}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {wl.symbols.map((sym) => (
              <span
                key={sym}
                className="inline-flex items-center gap-1 rounded-lg bg-background/50 px-2.5 py-1 text-sm text-text"
              >
                {sym}
                <button
                  onClick={() => removeSymbol.mutate({ watchlistId: wl.id, symbol: sym })}
                  className="text-muted hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setAddSymbolState({ watchlistId: wl.id, symbol: "" })}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
        </div>
      ))}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Watchlist">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="My Watchlist"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!addSymbolState}
        onClose={() => setAddSymbolState(null)}
        title="Add Symbol"
      >
        <div className="space-y-4">
          <Input
            label="Symbol"
            placeholder="e.g. GARAN"
            value={addSymbolState?.symbol || ""}
            onChange={(e) =>
              setAddSymbolState((prev) =>
                prev ? { ...prev, symbol: e.target.value.toUpperCase() } : null,
              )
            }
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddSymbolState(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addSymbolState?.symbol) {
                  addSymbol.mutate({
                    watchlistId: addSymbolState.watchlistId,
                    symbol: addSymbolState.symbol,
                  });
                  setAddSymbolState(null);
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
