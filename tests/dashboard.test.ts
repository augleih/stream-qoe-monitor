import { describe, expect, it } from 'vitest';
import { renderDashboard } from '../src/dashboard.js';
import type { AggRow, ScenAggRow } from '../src/aggregate.js';
import type { TrendPoint } from '../src/types.js';

const aggRow: AggRow = {
  streamId: 'hls_vod', player: 'hlsjs', network: 'unlimited',
  n: 5, failures: 0, startup_median: 350, startup_p95: 449,
  rebuffer_ratio_median: 0, rebuffer_session_pct: 0,
  dropped_ratio_median: 0, twh_median: 1080,
};
const scenRow: ScenAggRow = {
  scenario: 'seg_404', streamId: 'hls_vod', player: 'hlsjs', network: 'unlimited',
  n: 5, injected_n: 5, timeout_n: 0, not_injected_n: 0, recovered_n: 4, error_n: 0,
  abr_median: 1200, overshoot_median: 0, rebuffer_count_median: 1, rebuffer_time_median: 800,
};
const point: TrendPoint = { runId: 1, date: '2026-08-02', startup_ms: 623, rebuffer_ratio: 0, error: null };

describe('renderDashboard', () => {
  it('세 섹션과 헤더 메타를 포함한 HTML을 만든다', () => {
    const html = renderDashboard([aggRow], [scenRow], [point]);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('일일 스모크 추이');
    expect(html).toContain('베이스라인 비교');
    expect(html).toContain('결함·조건 변화 시나리오');
    expect(html).toContain('스모크 1회');       // history.length
    expect(html).toContain('베이스라인 5회');    // rows n 합
  });
  it('베이스라인 차트에 startup·해상도 수치가 들어간다', () => {
    const html = renderDashboard([aggRow], [], []);
    expect(html).toContain('350 / P95 449');   // barChart 값 라벨
    expect(html).toContain('1080p');            // valueBarChart display
  });
  it('시나리오 회복률을 n/m으로 표기한다', () => {
    const html = renderDashboard([], [scenRow], []);
    expect(html).toContain('4/5');
  });
  it('추이가 비면 데이터 없음을 표기한다', () => {
    expect(renderDashboard([aggRow], [scenRow], [])).toContain('데이터 없음');
  });
  it('에러 런은 이스케이프해 별도 표기한다', () => {
    const err: TrendPoint = { runId: 2, date: '2026-08-03', startup_ms: null, rebuffer_ratio: null, error: 'x<y' };
    const html = renderDashboard([], [], [point, err]);
    expect(html).toContain('x&lt;y');
  });
});
