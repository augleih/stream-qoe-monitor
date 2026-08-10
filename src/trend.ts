import { lineChart } from './svg.js';
import type { TrendPoint } from './types.js';

export function trendChartSvg(points: TrendPoint[]): string {
  const ok = points.filter(p => p.startup_ms !== null);
  return lineChart('daily smoke — startup ms (hls_vod × hlsjs, unlimited)',
    ok.map(p => ({ label: p.date.slice(5), value: p.startup_ms as number })));
}

export function renderTrendMd(points: TrendPoint[]): string {
  let md = '# 일일 스모크 추이\n\n';
  md += '매일 06:00 KST CI가 측정하고 추이를 자동 갱신한다 (smoke.yml의 trend-and-deploy 잡). ';
  md += '로컬 전체 재구축: `npm run trend` (gh CLI 필요).\n\n';
  md += '![trend](charts/trend_startup.svg)\n\n';
  md += '| date | startup_ms | rebuffer_ratio | error |\n|---|---|---|---|\n';
  for (const p of points) {
    md += `| ${p.date} | ${p.startup_ms ?? '—'} | ${p.rebuffer_ratio ?? '—'} | ${p.error ?? '—'} |\n`;
  }
  return md;
}
