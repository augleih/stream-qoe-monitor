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

export function lineChart(
  title: string,
  points: { label: string; value: number }[],
): string {
  const W = 640, H = 240, left = 60, right = 20, top = 40, bottom = 40;
  const plotW = W - left - right, plotH = H - top - bottom;
  const max = Math.max(...points.map(p => p.value), 1);
  const x = (i: number) => left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const poly = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => [
    `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="3" fill="#2563eb"/>`,
    `<text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="10">${p.label}</text>`,
    `<text x="${x(i).toFixed(1)}" y="${(y(p.value) - 8).toFixed(1)}" text-anchor="middle" font-size="10">${p.value}</text>`,
  ].join('')).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif">
<text x="16" y="24" font-size="14" font-weight="bold">${title}</text>
${points.length > 1 ? `<polyline points="${poly}" fill="none" stroke="#2563eb" stroke-width="2"/>` : ''}
${dots}
</svg>`;
}

export function valueBarChart(
  title: string,
  rows: { label: string; value: number; display?: string }[],
): string {
  const W = 640, rowH = 24, left = 190, right = 80;
  const H = rows.length * rowH + 48;
  const max = Math.max(...rows.map(r => r.value), 1);
  const x = (v: number) => (v / max) * (W - left - right);
  const bars = rows.map((r, i) => {
    const y = 36 + i * rowH;
    const w = x(r.value);
    const label = r.display ?? String(r.value);
    return [
      `<text x="${left - 8}" y="${y + 12}" text-anchor="end" font-size="11">${r.label}</text>`,
      `<rect x="${left}" y="${y}" width="${w.toFixed(1)}" height="15" fill="#2563eb"/>`,
      `<text x="${left + w + 4}" y="${y + 12}" font-size="11">${label}</text>`,
    ].join('\n');
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif">
<text x="16" y="22" font-size="14" font-weight="bold">${title}</text>
${bars}
</svg>`;
}
