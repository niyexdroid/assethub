export function formatNGN(amount: number): string {
  return '₦' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatNGNCompact(amount: number): string {
  if (amount >= 1_000_000) return '₦' + (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000)     return '₦' + (amount / 1_000).toFixed(0) + 'k';
  return formatNGN(amount);
}
