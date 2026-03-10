export function formatRWF(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("en-US");
  return `${formatted} RWF`;
}

export function formatRWFCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M RWF`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K RWF`;
  }
  return formatRWF(amount);
}
