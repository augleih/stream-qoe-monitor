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
    const label = `${r.median} / P95 ${r.p95}`;
    const labelW = label.length * 6.2; // ~6.2px/char at font-size 11
    const fits = left + x(r.p95) + 4 + labelW <= W - 8;
    const medianBarW = x(r.median);
    // When drawn inside the bar, anchor the label to whichever bar actually
    // underlies it so the text sits on a single, known background color.
    const insideOnBlue = medianBarW >= labelW + 4;
    const insideAnchorX = insideOnBlue ? left + medianBarW - 4 : left + x(r.p95) - 4;
    const insideFill = insideOnBlue ? '#ffffff' : '#334155';
    const valueText = fits
      ? `<text x="${left + x(r.p95) + 4}" y="${y + 14}" font-size="11">${label}</text>`
      : `<text x="${insideAnchorX}" y="${y + 14}" font-size="11" text-anchor="end" fill="${insideFill}">${label}</text>`;
    return [
      `<text x="${left - 8}" y="${y + 14}" text-anchor="end" font-size="12">${r.label}</text>`,
      `<rect x="${left}" y="${y}" width="${x(r.p95).toFixed(1)}" height="18" fill="#cbd5e1"/>`,
      `<rect x="${left}" y="${y}" width="${x(r.median).toFixed(1)}" height="18" fill="#2563eb"/>`,
      valueText,
    ].join('\n');
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif">
<text x="16" y="24" font-size="14" font-weight="bold">${title}</text>
${bars}
</svg>`;
}
