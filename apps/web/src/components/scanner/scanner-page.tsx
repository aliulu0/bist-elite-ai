'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface StockResult {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  volume: number;
  eliteScore: number;
  confidence: number;
  action: string;
  timeframe: string;
}

const timeframes = ['M4', 'D1', 'W1', 'M1'];

export function ScannerPage() {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState('D1');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useApiQuery<StockResult[]>(
    ['scanner', timeframe, String(page)],
    `/api/v1/scanner?timeframe=${timeframe}&page=${page}&limit=20&search=${search}`,
    { refetchInterval: 60_000 },
  );

  const results = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('nav.scanner')}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell>{stock.sector}</TableCell>
                    <TableCell className="text-right">
                      {stock.price.toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell
                      className={`text-right ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">{stock.eliteScore.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {(stock.confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stock.action === 'BUY'
                            ? 'default'
                            : stock.action === 'SELL'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {stock.action}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={results.length < 20}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
