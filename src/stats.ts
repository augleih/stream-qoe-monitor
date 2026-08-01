export function median(xs: number[]): number {
  if (xs.length === 0) throw new Error('median of empty array');
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// nearest-rank: 정렬 후 ceil(0.95 * n)번째 값
export function p95(xs: number[]): number {
  if (xs.length === 0) throw new Error('p95 of empty array');
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
}
