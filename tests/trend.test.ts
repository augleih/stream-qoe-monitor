import { describe, expect, it } from 'vitest';
import { renderTrendMd, trendChartSvg } from '../src/trend.js';
import type { TrendPoint } from '../src/types.js';

const ok: TrendPoint = { runId: 1, date: '2026-08-02', startup_ms: 623, rebuffer_ratio: 0, error: null };
const err: TrendPoint = { runId: 2, date: '2026-08-03', startup_ms: null, rebuffer_ratio: null, error: 'boom' };

describe('renderTrendMd', () => {
  it('전체 포인트를 표로, 결측은 —로 렌더한다', () => {
    const md = renderTrendMd([ok, err]);
    expect(md).toContain('| 2026-08-02 | 623 | 0 | — |');
    expect(md).toContain('| 2026-08-03 | — | — | boom |');
  });
});

describe('trendChartSvg', () => {
  it('startup이 있는 포인트만 차트에 올린다', () => {
    const svg = trendChartSvg([ok, err]);
    expect(svg).toContain('08-02');
    expect(svg).not.toContain('08-03');
  });
});
