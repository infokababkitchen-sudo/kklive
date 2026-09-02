// Price adjustment utility for temporary price increases
export const PRICE_MULTIPLIER = 1.0; // Set to 1.2 for 20% increase, 1.0 for normal prices

export function applyPriceMultiplier(price: number): number {
  return Math.round(price * PRICE_MULTIPLIER);
}

export function getPriceMultiplierInfo(): string {
  if (PRICE_MULTIPLIER === 1.0) {
    return 'Normal pricing active';
  }
  const percentage = Math.round((PRICE_MULTIPLIER - 1) * 100);
  return `${percentage}% price increase active`;
}
