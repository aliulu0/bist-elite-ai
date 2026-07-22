import { Injectable } from '@nestjs/common';
import {
  Timeframe, TimeframeValidationResult, TradeRecord,
  SignalAction, TrendDirection, ValidationStatus
} from './types';

@Injectable()
export class MultiTimeframeValidator {
  validate(
    trades: TradeRecord[],
    signals: Array<{
      date: string;
      action: SignalAction;
      confidence: number;
      price: number;
      timeframe: Timeframe;
    }>,
    timeframes: Timeframe[]
  ): TimeframeValidationResult[] {
    if (!trades || trades.length === 0) {
      return timeframes.map(tf => this.getEmptyResult(tf));
    }

    return timeframes.map(tf => this.validateTimeframe(tf, trades, signals));
  }

  private validateTimeframe(
    timeframe: Timeframe,
    trades: TradeRecord[],
    signals: Array<{
      date: string;
      action: SignalAction;
      confidence: number;
      price: number;
      timeframe: Timeframe;
    }>
  ): TimeframeValidationResult {
    const tfTrades = trades.filter(t => t.timeframe === timeframe);
    const tfSignals = signals.filter(s => s.timeframe === timeframe);

    if (tfTrades.length === 0 && tfSignals.length === 0) {
      return this.getEmptyResult(timeframe);
    }

    const agreementAccuracy = this.calculateAgreementAccuracy(tfTrades, tfSignals);
    const conflictAccuracy = this.calculateConflictAccuracy(tfTrades, tfSignals);
    const consensusAccuracy = this.calculateConsensusAccuracy(tfTrades, tfSignals);
    const earlySignalAccuracy = this.calculateEarlySignalAccuracy(tfTrades, tfSignals);

    const avgConfidence = tfSignals.length > 0
      ? tfSignals.reduce((s, sig) => s + sig.confidence, 0) / tfSignals.length
      : 0;

    const dominantDirection = this.determineDominantDirection(tfTrades);

    const status = this.determineStatus(agreementAccuracy, consensusAccuracy, earlySignalAccuracy);

    return {
      timeframe,
      agreementAccuracy,
      conflictAccuracy,
      consensusAccuracy,
      earlySignalAccuracy,
      signalCount: tfSignals.length,
      avgConfidence,
      dominantDirection,
      status,
    };
  }

  private calculateAgreementAccuracy(
    trades: TradeRecord[],
    signals: Array<{ date: string; action: SignalAction; confidence: number; price: number }>
  ): number {
    if (trades.length === 0 || signals.length === 0) return 0;

    let agreements = 0;
    let total = 0;

    for (const trade of trades) {
      const nearbySignal = signals.find(s => {
        const signalTime = new Date(s.date).getTime();
        const tradeTime = new Date(trade.entryDate).getTime();
        const diffDays = Math.abs(tradeTime - signalTime) / (24 * 60 * 60 * 1000);
        return diffDays <= 1;
      });

      if (nearbySignal) {
        total++;
        const signalDirection = nearbySignal.action === SignalAction.BUY ? 'UP' : 'DOWN';
        const tradeDirection = trade.pnl > 0 ? 'UP' : 'DOWN';

        if (signalDirection === tradeDirection) {
          agreements++;
        }
      }
    }

    return total > 0 ? agreements / total : 0;
  }

  private calculateConflictAccuracy(
    trades: TradeRecord[],
    signals: Array<{ date: string; action: SignalAction; confidence: number; price: number }>
  ): number {
    if (trades.length === 0 || signals.length === 0) return 0;

    let correctConflicts = 0;
    let totalConflicts = 0;

    for (let i = 0; i < signals.length - 1; i++) {
      const current = signals[i];
      const next = signals[i + 1];

      if (current.action !== next.action) {
        totalConflicts++;
        const currentTrade = trades.find(t => t.entryDate === current.date);
        const nextTrade = trades.find(t => t.entryDate === next.date);

        if (currentTrade && nextTrade) {
          if (currentTrade.pnl > 0 && nextTrade.pnl < 0) {
            correctConflicts++;
          } else if (currentTrade.pnl < 0 && nextTrade.pnl > 0) {
            correctConflicts++;
          }
        }
      }
    }

    return totalConflicts > 0 ? correctConflicts / totalConflicts : 0;
  }

  private calculateConsensusAccuracy(
    trades: TradeRecord[],
    signals: Array<{ date: string; action: SignalAction; confidence: number; price: number }>
  ): number {
    if (trades.length === 0 || signals.length === 0) return 0;

    const highConfidenceSignals = signals.filter(s => s.confidence >= 0.7);
    if (highConfidenceSignals.length === 0) return 0;

    let correctConsensus = 0;
    for (const signal of highConfidenceSignals) {
      const trade = trades.find(t => t.entryDate === signal.date);
      if (trade) {
        if ((signal.action === SignalAction.BUY && trade.pnl > 0) ||
          (signal.action === SignalAction.SELL && trade.pnl < 0)) {
          correctConsensus++;
        }
      }
    }

    return correctConsensus / highConfidenceSignals.length;
  }

  private calculateEarlySignalAccuracy(
    trades: TradeRecord[],
    signals: Array<{ date: string; action: SignalAction; confidence: number; price: number }>
  ): number {
    if (trades.length === 0 || signals.length === 0) return 0;

    let earlyCorrect = 0;
    let earlyTotal = 0;

    for (const signal of signals) {
      const signalTime = new Date(signal.date).getTime();
      const laterTrades = trades.filter(t => {
        const tradeTime = new Date(t.entryDate).getTime();
        return tradeTime > signalTime && (tradeTime - signalTime) / (24 * 60 * 60 * 1000) <= 7;
      });

      if (laterTrades.length > 0) {
        earlyTotal++;
        const bestTrade = laterTrades.reduce((best, t) =>
          Math.abs(t.pnlPercent) > Math.abs(best.pnlPercent) ? t : best
        );

        if ((signal.action === SignalAction.BUY && bestTrade.pnlPercent > 0) ||
          (signal.action === SignalAction.SELL && bestTrade.pnlPercent < 0)) {
          earlyCorrect++;
        }
      }
    }

    return earlyTotal > 0 ? earlyCorrect / earlyTotal : 0;
  }

  private determineDominantDirection(trades: TradeRecord[]): TrendDirection {
    if (trades.length === 0) return TrendDirection.NEUTRAL;

    const wins = trades.filter(t => t.pnl > 0).length;
    const winRate = wins / trades.length;
    const avgReturn = trades.reduce((s, t) => s + t.pnlPercent, 0) / trades.length;

    if (winRate >= 0.7 && avgReturn > 5) return TrendDirection.STRONG_UPTREND;
    if (winRate >= 0.6 && avgReturn > 2) return TrendDirection.UPTREND;
    if (winRate >= 0.55 && avgReturn > 0) return TrendDirection.WEAK_UPTREND;
    if (winRate <= 0.3 && avgReturn < -5) return TrendDirection.STRONG_DOWNTREND;
    if (winRate <= 0.4 && avgReturn < -2) return TrendDirection.DOWNTREND;
    if (winRate <= 0.45 && avgReturn < 0) return TrendDirection.WEAK_DOWNTREND;
    return TrendDirection.NEUTRAL;
  }

  private determineStatus(
    agreementAccuracy: number,
    consensusAccuracy: number,
    earlySignalAccuracy: number
  ): ValidationStatus {
    const avg = (agreementAccuracy + consensusAccuracy + earlySignalAccuracy) / 3;

    if (avg >= 0.7) return ValidationStatus.PASSED;
    if (avg >= 0.5) return ValidationStatus.WARNING;
    if (avg >= 0.3) return ValidationStatus.FAILED;
    return ValidationStatus.INSUFFICIENT_DATA;
  }

  private getEmptyResult(timeframe: Timeframe): TimeframeValidationResult {
    return {
      timeframe,
      agreementAccuracy: 0,
      conflictAccuracy: 0,
      consensusAccuracy: 0,
      earlySignalAccuracy: 0,
      signalCount: 0,
      avgConfidence: 0,
      dominantDirection: TrendDirection.NEUTRAL,
      status: ValidationStatus.INSUFFICIENT_DATA,
    };
  }
}
