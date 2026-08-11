import type { RuleAnalyticsResult } from './backtest-types';

interface BacktestRuleAnalyticsProps {
  analytics: RuleAnalyticsResult;
}

export function BacktestRuleAnalytics({ analytics }: BacktestRuleAnalyticsProps) {
  const topRules = [...analytics.ruleStatistics]
    .sort((a, b) => b.avgReturn - a.avgReturn)
    .slice(0, 10);

  const topPairs = [...analytics.pairStatistics]
    .sort((a, b) => b.avgReturn - a.avgReturn)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Kural İstatistikleri</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Kural</th>
                <th className="pb-2 text-right font-medium">İşlem</th>
                <th className="pb-2 text-right font-medium">Kazanma %</th>
                <th className="pb-2 text-right font-medium">Ort. Getiri</th>
                <th className="pb-2 text-right font-medium">Toplam Getiri</th>
                <th className="pb-2 text-right font-medium">Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {topRules.map((rule, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2 font-medium">{rule.rule}</td>
                  <td className="py-2 text-right">{rule.totalTrades}</td>
                  <td className="py-2 text-right">{(rule.winRate * 100).toFixed(1)}%</td>
                  <td className={`py-2 text-right font-mono ${rule.avgReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {rule.avgReturn >= 0 ? '+' : ''}{(rule.avgReturn * 100).toFixed(2)}%
                  </td>
                  <td className={`py-2 text-right font-mono ${rule.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {rule.totalReturn >= 0 ? '+' : ''}{(rule.totalReturn * 100).toFixed(2)}%
                  </td>
                  <td className="py-2 text-right font-mono">{rule.sharpe.toFixed(2)}</td>
                </tr>
              ))}
              {topRules.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">Veri yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {topPairs.length > 0 && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">En İyi Kural Çiftleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Kural A</th>
                  <th className="pb-2 font-medium">Kural B</th>
                  <th className="pb-2 text-right font-medium">İşlem</th>
                  <th className="pb-2 text-right font-medium">Kazanma %</th>
                  <th className="pb-2 text-right font-medium">Ort. Getiri</th>
                </tr>
              </thead>
              <tbody>
                {topPairs.map((pair, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 font-medium">{pair.ruleA}</td>
                    <td className="py-2 font-medium">{pair.ruleB}</td>
                    <td className="py-2 text-right">{pair.totalTrades}</td>
                    <td className="py-2 text-right">{(pair.winRate * 100).toFixed(1)}%</td>
                    <td className={`py-2 text-right font-mono ${pair.avgReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {pair.avgReturn >= 0 ? '+' : ''}{(pair.avgReturn * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
