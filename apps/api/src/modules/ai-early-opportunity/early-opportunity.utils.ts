export function clamp01(value: number): number {
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function clamp0100(value: number): number {
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 0;
    numerator += (values[i] ?? 0) * w;
    denominator += w;
  }
  if (denominator === 0) return values.reduce((a, b) => a + (b ?? 0), 0) / values.length;
  return numerator / denominator;
}
