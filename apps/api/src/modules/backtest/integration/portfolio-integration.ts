import { Injectable } from '@nestjs/common';
import { BacktestResult } from '../backtest.types';
import { PortfolioSignalDto } from '../dto/strategy-ranking.dto';

export interface PortfolioSignalInput {
  symbol: string;
  timeframe: string;
  result: BacktestResult;
  positionSizePercent: number;
}

@Injectable()
export class PortfolioIntegration {
  buildSignals(input: PortfolioSignalInput): PortfolioSignalDto[] {
    const { symbol, timeframe, result, positionSizePercent } = input;
    const perf = result.performance;
    const risk = result.risk;
    const winRate = perf.winRate;
    const sharpe = risk.sharpeRatio;
    const maxDd = risk.maxDrawdown;
    const totalReturn = perf.totalReturn;

    let confidence = 0.5;
    if (sharpe > 0) {
      confidence = Math.max(0, Math.min(1, 0.5 + sharpe / 5));
    }
    const reliability = (winRate / 100 + (Number.isFinite(sharpe) ? Math.max(0, Math.min(2, sharpe)) / 2 : 0)) / 2;

let action: PortfolioSignalDto['action'];
    if (maxDd > 25) {
      action = 'WAIT';
      confidence = Math.max(0, Math.min(1, reliability * 0.5));
    } else if (winRate < 40 && totalReturn <= 0) {
      action = 'SELL';
    } else if (winRate >= 60 && sharpe > 1 && maxDd < 15 && totalReturn > 0) {
      action = 'BUY';
    } else {
      action = 'HOLD';
    }

    const sizePercent = Math.round(((winRate / 100) * (positionSizePercent / 100) * 100) * 100) / 100;

    const rationale: string[] = [];
    rationale.push(`Kazanma oranı %${winRate.toFixed(1)}, Sharpe ${sharpe.toFixed(2)}, maks çekilme %${maxDd.toFixed(1)}.`);
    rationale.push(`Toplam getiri %${totalReturn.toFixed(2)}.`);
    if (action === 'BUY') {
      rationale.push('Pozitif risk-ödül profili; pozisyon açın.');
    } else if (action === 'SELL') {
      rationale.push('Negatif beklenen getiri; pozisyon kapatın.');
    } else {
      rationale.push('Sinyal emin değil; bekleyin.');
    }

    return [
      {
        symbol,
        timeframe,
        action,
        confidence: Math.round(reliability * 1000) / 1000,
        sizePercent,
        rationale,
        basedOn: { totalReturn, sharpeRatio: sharpe, winRate, maxDrawdown: maxDd },
      },
    ];
  }
}
