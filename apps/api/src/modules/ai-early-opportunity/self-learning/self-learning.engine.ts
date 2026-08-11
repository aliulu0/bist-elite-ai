const MODIFIER_MIN = 0.85;
const MODIFIER_MAX = 1.15;

export class SelfLearningEngine {
  computeModifier(predictedBullish: number, realizedWinRate: number): {
    modifier: number;
    rationale: string;
  } {
    const predicted = clamp0100(predictedBullish);
    const realizedPercent = toPercent(realizedWinRate);
    const delta = realizedPercent - predicted;
    const raw = 1 + delta / 200;
    const modifier = clamp(raw, MODIFIER_MIN, MODIFIER_MAX);

    const rationale =
      delta > 0
        ? `Gerçekleşen kazanma oranı (%${realizedPercent.toFixed(0)}) tahminden (%${predicted.toFixed(0)}) daha yüksek; güven artırılıyor.`
        : delta < 0
          ? `Gerçekleşen kazanma oranı (%${realizedPercent.toFixed(0)}) tahminden (%${predicted.toFixed(0)}) daha düşük; güven azaltılıyor.`
          : `Tahmin ve gerçekleşen performans uyumlu.`;

    return { modifier, rationale };
  }

  adjustScore(score: number, modifier: number): number {
    return clamp0100(Math.round(score * modifier));
  }

  rankByAdjusted(
    scored: Array<{ ticker: string; score: number }>,
    modifiers: Map<string, number>,
  ): Array<{ ticker: string; score: number; adjustedScore: number }> {
    return scored
      .map((s) => ({
        ticker: s.ticker,
        score: s.score,
        adjustedScore: this.adjustScore(s.score, modifiers.get(s.ticker) ?? 1),
      }))
      .sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  confidenceDelta(predictedBullish: number, realizedWinRate: number): number {
    return clamp0100(
      Math.abs(toPercent(realizedWinRate) - clamp0100(predictedBullish)),
    );
  }
}

function toPercent(value: number): number {
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  return v > 1 ? v : v * 100;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp0100(value: number): number {
  return clamp(value, 0, 100);
}
