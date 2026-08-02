export function barChart(
  title: string,
  rows: { label: string; median: number; p95: number }[],
): string {
  const W = 640, rowH = 28, left = 170, right = 90;
  const H = rows.length * rowH + 56;
  const max = Math.max(...rows.map(r => r.p95), 1);
  const x = (v: number) => (v / max) * (W - left - right);
  const bars = rows.map((r, i) => {
    const y = 40 + i * rowH;
    return [
      `<text x="${left - 8}" y="${y + 14}" text-anchor="end" font-size="12">${r.label}</text>`,
      `<rect x="${left}" y="${y}" width="${x(r.p95).toFixed(1)}" height="18" fill="#cbd5e1"/>`,
      `<rect x="${left}" y="${y}" width="${x(r.median).toFixed(1)}" height="18" fill="#2563eb"/>`,
      `<text x="${left + x(r.p95) + 4}" y="${y + 14}" font-size="11">${r.median} / P95 ${r.p95}</text>`,
    ].join('\n');
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif">
<text x="16" y="24" font-size="14" font-weight="bold">${title}</text>
${bars}
</svg>`;
}
