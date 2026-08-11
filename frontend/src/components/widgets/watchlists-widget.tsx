"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWatchlists } from "@/hooks";
import { Bookmark, BookmarkCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function WatchlistsWidget() {
  const { data, isLoading } = useWatchlists();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-border/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Watchlists</CardTitle>
          <Link href="/watchlists" className="btn-secondary px-3 py-1.5 text-xs">
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((wl) => (
            <Link
              key={wl.id}
              href="/watchlists"
              className="flex items-center gap-3 rounded-xl bg-background/50 p-3 transition-all hover:bg-border/50"
            >
              {wl.type === "DEFAULT" ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5 text-warning" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{wl.name}</p>
                <p className="text-xs text-muted">{wl.symbols.length} stocks</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
