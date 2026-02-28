/**
 * Financial utility functions for OTB calculations
 */

/** Round to nearest currency unit (VND has no decimals, USD has 2) */
export function roundCurrency(amount: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/** Calculate variance between actual and planned */
export function variance(actual: number, planned: number): { absolute: number; percentage: number } {
  const absolute = actual - planned;
  const percentage = planned !== 0 ? (absolute / planned) * 100 : 0;
  return {
    absolute: roundCurrency(absolute),
    percentage: Math.round(percentage * 100) / 100,
  };
}

/** Calculate sell-through rate */
export function sellThrough(sold: number, received: number): number {
  if (received === 0) return 0;
  return Math.round((sold / received) * 10000) / 100; // 2 decimal %
}

/**
 * Proportional allocation of a total amount across buckets by weight.
 * Handles rounding remainder by distributing to largest-remainder buckets.
 */
export function allocate(
  totalAmount: number,
  weights: number[],
  decimals = 0,
): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);

  const factor = Math.pow(10, decimals);
  const rawAllocations = weights.map((w) => (totalAmount * w) / totalWeight);
  const floored = rawAllocations.map((v) => Math.floor(v * factor) / factor);
  let remainder = roundCurrency(totalAmount - floored.reduce((s, v) => s + v, 0), decimals);

  // Distribute remainder to buckets with largest fractional parts
  const fractionals = rawAllocations.map((v, i) => ({
    index: i,
    frac: (v * factor) % 1,
  }));
  fractionals.sort((a, b) => b.frac - a.frac);

  const unit = 1 / factor;
  const result = [...floored];
  for (const { index } of fractionals) {
    if (remainder <= 0) break;
    result[index] = roundCurrency(result[index] + unit, decimals);
    remainder = roundCurrency(remainder - unit, decimals);
  }

  return result;
}
